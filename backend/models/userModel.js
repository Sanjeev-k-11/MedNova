// models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {type:String , required:true},
    email: {type:String , required:true, unique:true},
    password: {type:String , required:true},
    image: {type:String , default:"data:image/png;base64,iVBORw0KGgoAAAAN..."}, // Keep your image default
    address: {
        line1: { type: String, default: "Not Selected" },
        line2: { type: String, default: "Not Selected" }
    },
    gender:{type:String, default:"Not Selected"},
    dob:{ type: Date, required:false }, // dob is already optional
    phone:{ type: String, default:'0000000000' }, // phone has a default, but is required in register API
    isEmailVerified: {
        type: Boolean,
        default: false // Default is false, becomes true on verification
    },
    otp: {
        type: String,
        // This field is required ONLY if isEmailVerified is false
        required: function() {
            return !this.isEmailVerified;
        }
    },
    otpExpiry: {
        type: Date,
        // This field is required ONLY if isEmailVerified is false
        required: function() {
             return !this.isEmailVerified;
        }
    },
     lastOtpSentTime: {
        type: Date,
        required: function() {
             // Only required if the user is NOT verified (part of the verification process state)
             return !this.isEmailVerified;
        }
    },
    otpResendCount: {
        type: Number,
        default: 0, // Initialize count to 0
         required: function() {
             // Only required if the user is NOT verified
             return !this.isEmailVerified;
         }
    },
    
    role: {
        type: String,
        enum: ['user', 'admin'], // Restrict role to 'user' or 'admin'
        default: 'user' // Most users will be regular users
    },
    isBlocked: {
        type: Boolean,
        default: false // Account is not blocked by default
    }

},{
    timestamps: true,
    minimize:false});


const userModel = mongoose.models.user || mongoose.model('user',userSchema);

export default userModel;