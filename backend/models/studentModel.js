// studentModel.js
import mongoose from "mongoose";
import bcrypt from 'bcrypt'; // Import bcryptjs for password hashing

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Student full name is required'],
    trim: true,
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll Number/ID is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  course: {
    type: String,
    required: [true, 'Course/Program is required'],
    trim: true,
  },
  yearSemester: {
    type: String,
    required: [true, 'Current Year/Semester is required'],
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of Birth is required'],
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['Male', 'Female', 'Other', 'Prefer not to say'],
      message: 'Gender must be Male, Female, Other, or Prefer not to say',
    },
  },
  hostelBlockRoom: {
    type: String,
    trim: true,
  },
  guardianContact: {
    type: String,
    required: [true, 'Guardian contact is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  profileImage: {
    type: String,
    trim: true,
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: {
      values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      message: 'Invalid blood group',
    },
  },
  medicalHistory: {
    type: String,
    trim: true,
  },
  isVaccinated: {
    type: Boolean,
    required: [true, 'Vaccination status is required'],
    default: false,
  },

  virtualId: {
    type: String,
    required: [true, 'Virtual ID is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid 6-digit Virtual ID!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false, // Prevents the password from being returned in queries by default
    minlength: [8, 'Password must be at least 8 characters long'], // Example: add min length
  },

  // --- Added field for status ---
  status: {
    type: String,
    enum: ['active', 'blocked', 'graduated', 'alumni', 'suspended'], // Example statuses
    default: 'active', // Default status
  },
  // --- End Added field ---


  dateOfAdmission: {
    type: Date,
  },
  attendancePercentage: {
    type: Number,
    min: [0, 'Attendance percentage cannot be less than 0'],
    max: [100, 'Attendance percentage cannot be more than 100'],
  },
  libraryCardNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  clubMemberships: [String],
  achievementsCertifications: {
    type: String,
    trim: true,
  },

}, {
  timestamps: true
});
 
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

studentSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default Student;