import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const contactSchema = new Schema({
    officeHeading: {
        type: String,
        required: [true, 'Office section heading is required.'],
        default: 'OUR OFFICE',
        trim: true // Added trim
    },
    contactName: {
        type: String,
        // required: [true, 'Contact name is required.'], // Made optional
        trim: true // Added trim
    },
    location: {
        type: String,
        // required: [true, 'Location details are required.'], // Made optional
        trim: true // Added trim
    },
    primaryPhoneNumber: {
        type: String,
        // required: [true, 'Primary phone number is required.'], // Made optional
        trim: true // Added trim
        // Add phone number validation regex if needed
        // match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'] // Example E.164 format
    },
    secondaryPhoneNumber: {
        type: String,
        trim: true // Added trim
        // Add validation if needed
    },
    contactImage: { // Renamed from 'image' for clarity
        type: String,
        // required: true, // Changed: Usually better to allow null/optional image
        default: null, // Explicitly default to null if no image
        trim: true
    },
    email: {
        type: String,
        // required: [true, 'Email address is required.'], // Made optional - depends on needs
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Please provide a valid email address.']
    },
    careersHeading: {
        type: String,
        required: [true, 'Careers section heading is required.'],
        default: 'CAREERS AT MEDNOVA',
        trim: true // Added trim
    },
    careersDescription: {
        type: String,
        // required: [true, 'Careers description is required.'], // Made optional
        trim: true // Added trim
    },
    careersButtonText: {
        type: String,
        required: [true, 'Careers button text is required.'],
        default: 'Explore Jobs',
        trim: true // Added trim
    },
    careersButtonLink: {
        type: String,
        // required: [true, 'A link for the careers button is required.'], // Made optional
        trim: true // Added trim
        // Consider adding URL validation if needed
    },
    supportHeading: {
        type: String,
        required: [true, 'Support section heading is required.'],
        default: 'RELIABILITY & SUPPORT',
        trim: true // Added trim
    },
    supportDescription: {
        type: String,
        // required: [true, 'Support description is required.'], // Made optional
        trim: true // Added trim
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Consistent Model Name: 'Contact' (uppercase singular)
const contactModel = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

export default contactModel;