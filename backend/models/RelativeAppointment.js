import mongoose from 'mongoose';

const relativeAppointmentSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  patientAge: {
    type: Number,
    required: true,
    min: 0
  },
  patientGender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other', 'Prefer Not to Say']
  },
  appointmentDay: {
    type: Date,
    required: true
  },
  previousAppointmentDetails: {
    type: String,
    default: '',
    trim: true
  },
  patientPhoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

const RelativeAppointment = mongoose.models.RelativeAppointment || mongoose.model('RelativeAppointment', relativeAppointmentSchema);

export default RelativeAppointment;
