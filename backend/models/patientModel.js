import mongoose from "mongoose";

const Schema = mongoose.Schema;

const patientSchema = new Schema({
    // +++ NEW FIELD +++
    staffId: {
        type: mongoose.Schema.Types.ObjectId, // Stores the MongoDB ObjectId
        ref: 'Staff', // Reference to your Staff/User model (MAKE SURE 'Staff' is the correct model name you use for staff members)
        required: [true, 'Associated Staff ID is required.'], // Make it mandatory
        index: true // Add an index for potentially faster lookups based on staff
    },
    // --- Existing fields ---
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 0
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say']
    },
    phone: {
        type: String,
        required: true,
        trim: true
        // Consider adding validation/uniqueness if needed
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    medicalHistory: {
        type: String,
        trim: true,
        default: ''
    },
    previousVisit: {
        hasVisited: {
            type: Boolean,
            required: true,
            default: false
        },
        lastVisitDate: {
            type: Date,
            default: null
        },
        lastDoctorName: {
            type: String,
            trim: true,
            default: null
        },
        lastVisitId: { // This is where you store the 'vid' from the form
            type: String,
            trim: true,
            default: null
        }
    },
    appointmentDetails: {
        type: String,
        trim: true,
        default: null
    },
    paymentDetails: {
        amount: {
            type: Number,
            default: null
        },
        method: {
            type: String,
            enum: ['Cash', 'Card', 'Online', 'Insurance', 'UPI', 'Other', null],
            default: null
        },
        status: {
            type: String,
            enum: ['Paid', 'Unpaid', 'Partial', 'Waived'],
            default: 'Unpaid',
            required: true
        },
        transactionId: {
            type: String,
            trim: true,
            default: null
        },
        paymentDate: {
            type: Date,
            default: null
        },
        notes: {
            type: String,
            trim: true,
            default: null
        }
    },
    appointmentStatus: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'NoShow', 'Rescheduled', 'CheckedIn'],
        default: 'Scheduled',
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Optional: Add indexes for frequently queried fields if needed
// patientSchema.index({ phone: 1 }); // Example index on phone

// Ensure the model is not re-compiled if it already exists (important for Next.js/hot-reloading environments)
const PatientModel = mongoose.models.Patient || mongoose.model('Patient', patientSchema);

export default PatientModel;