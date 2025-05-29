import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_WORK_FACTOR = 10;

const addressSchema = new mongoose.Schema({
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' }
}, { _id: false });

const recurringAvailabilityRuleSchema = new mongoose.Schema({
    frequency: {
        type: String,
        required: true,
        enum: ['weekly', 'monthly'],
    },
    interval: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    startTime: {
        type: String,
        required: true,
        match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format']
    },
    endTime: {
        type: String,
        required: true,
        match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format']
    },
    daysOfWeek: {
        type: [Number],
        validate: {
            validator: function(v) { return this.frequency !== 'weekly' || (Array.isArray(v) && v.length > 0); },
            message: 'Days of week are required for weekly frequency.'
        },
        default: undefined
    },
    weekOfMonth: {
        type: Number,
        validate: {
            validator: function(v) { return this.frequency !== 'monthly' || (typeof v === 'number' && [1, 2, 3, 4, 5, -1].includes(v)); },
            message: 'Week of month (1-4, or 5/-1 for last) is required for monthly frequency.'
        },
        default: undefined
    },
    dayOfWeekMonthly: {
        type: Number,
        validate: {
            validator: function(v) { return this.frequency !== 'monthly' || (typeof v === 'number' && v >= 0 && v <= 6); },
            message: 'Day of week (0-6) is required for monthly frequency.'
        },
        default: undefined
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: null
    },
    notes: { type: String, trim: true, default: '' }
}, { _id: true, timestamps: true });

const shiftSchema = new mongoose.Schema({
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    roleOverride: {
        type: String,
        enum: { values: ['admin', 'nurse', 'receptionist', 'staff', 'technician', null], message: '{VALUE} is not supported' },
        default: null
    },
    notes: { type: String, trim: true, default: '' }
}, { _id: true, timestamps: true });

const timeOffSchema = new mongoose.Schema({
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    reason: { type: String, required: true, enum: ['vacation', 'sick', 'personal', 'training', 'other'], default: 'other' },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String, trim: true, default: '' },
    requestedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'staff', default: null },
    reviewedAt: { type: Date, default: null }
}, { _id: true, timestamps: true });

const availabilityOverrideSchema = new mongoose.Schema({
    date: { type: Date, required: true, index: true },
    isAvailable: { type: Boolean, required: true },
    startTime: {
        type: String,
        match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'],
        validate: {
            validator: function(v) { return !this.isAvailable || typeof v === 'string'; },
            message: 'Start time required if marking as available with specific time.'
        },
        default: undefined
    },
    endTime: {
        type: String,
        match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'],
        validate: {
            validator: function(v) { return !this.isAvailable || typeof v === 'string'; },
            message: 'End time required if marking as available with specific time.'
        },
        default: undefined
    },
    reason: {
        type: String,
        trim: true,
        required: [true, 'Reason for override is required.']
    },
    notes: { type: String, trim: true, default: '' }
}, { _id: true, timestamps: true });

const staffSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Staff name is required'], trim: true },
    email: { type: String, required: [true, 'Staff email is required'], unique: true, lowercase: true, trim: true, match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'] },
    password: { type: String, required: [true, 'Password is required'], select: false },
    vid: { type: String, required: [true, '6-digit Staff VID is required.'], unique: true, minlength: [6, 'VID must be exactly 6 digits.'], maxlength: [6, 'VID must be exactly 6 digits.'], match: [/^\d{6}$/, 'VID must contain exactly 6 digits.'] },
    image: { type: String, required: [true, 'Staff image URL is required'] },
    role: { type: String, required: true, enum: { values: ['admin', 'nurse', 'receptionist', 'staff', 'technician'], message: '{VALUE} is not a supported role' }, default: 'staff' },
    phone: { type: String, required:true,unique:true },
    address: { type: addressSchema, default: () => ({}) },
    salary: { type: Number, required: [true, 'Salary is required'], min: [0, 'Salary cannot be negative'] },
    isActive: { type: Boolean, default: true },
    recurringAvailability: {
        type: [recurringAvailabilityRuleSchema],
        default: []
    },
    scheduledShifts: {
        type: [shiftSchema],
        default: []
    },
    timeOffRequests: {
        type: [timeOffSchema],
        default: []
    },
    availabilityOverrides: {
        type: [availabilityOverrideSchema],
        default: []
    }
}, {
    timestamps: true
});

staffSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

staffSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) {
        throw new Error('Password field not available for comparison.');
    }
    return bcrypt.compare(candidatePassword, this.password);
};

const staffModel = mongoose.models.staff || mongoose.model('staff', staffSchema);

export default staffModel;
