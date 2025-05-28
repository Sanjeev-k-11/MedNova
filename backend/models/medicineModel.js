import mongoose from 'mongoose';

// Define the schema
const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    originalPrice: { type: Number, required: true },  // ✅ Add original price
    discountedPrice: { type: Number, required: true }, // ✅ Add discounted price
    quantity: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    manufacturer: { type: String, required: true },
    description: { type: String },
    
    imageUrl: { type: String }
}, { timestamps: true });

// Export the model as default
export default mongoose.model("Medicine", medicineSchema);
