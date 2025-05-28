import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({

    userName: { type: String, required: true, index: true }, // Add index
    phoneNumber: { type: String, required: true, index: true }, // Add index
    userId: { type: String, required: true },
    image: {type:String , required:true},
    email: { type: String, required: true, index: true },

    medicines: [
        {
            medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            status: {
                type: String,
                enum: ['Paid', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Canceled'],
                default: 'Paid', // Set to 'Paid' upon successful verification
                required: true
            },
        }
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: { 
        type: String, 
        required: true,
        enum: ['Pending', 'Paid', 'Failed','Processing','Refunded','Partially Refunded','Delivered','Completed','Canceled','Admin Canceled'], // Add 'Canceled' to the enum
        default: 'Pending', 
        index: true 
    },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true }, // << Ensure this is saved during verifyPayment
    razorpaySignature: { type: String },
    processedAt: { type: Date }, // Timestamp for when processing starts
    shippedAt: { type: Date },   // Timestamp for when shipped
    deliveredAt: { type: Date }, // Timestamp for when delivered
    canceledAt: { type: Date } ,
    dateOfPurchase: { type: Date, default: Date.now, index: true }, // Add index
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: function() { return this.paymentStatus === 'Paid'; } },
    isCompleted: { type: Boolean, default: false }
}, {
    timestamps: true // Add createdAt and updatedAt fields
});

const purchaseModel = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

export default purchaseModel;
