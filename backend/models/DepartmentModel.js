import mongoose from 'mongoose';

const departmentLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Removes leading/trailing whitespace
  },
  floor: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  contact: {
    type: String,
    required: false, // Changed to false, as some examples were 'N/A' or could be omitted
    trim: true,
  },
  hours: {
    type: String,
    required: false, // Changed to false, maybe some locations don't have specific hours listed
    trim: true,
  },
  capacity: {
    type: String, // Storing capacity as a string like "12 beds" or "20 people"
    required: false, // Optional field
    trim: true,
  },
  // You might add an 'order' field if you need to control the display order
  order: {
      type: Number,
      required: false,
      default: 0 // Default order if not specified
  }
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps automatically
});

// Create the model
const DepartmentLocationModel = mongoose.models.departmentLocation || mongoose.model('DepartmentLocation', departmentLocationSchema);

export default DepartmentLocationModel;