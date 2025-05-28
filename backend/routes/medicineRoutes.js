import express from 'express';
import authMedicine from '../middlewares/authMedicine.js';

import { buyMedicine, cancelOrder, getMyMedicines, verifyPayment } from '../controllers/medicineController.js';

const medicineRoutes = express.Router();
// Route to create Razorpay order
medicineRoutes.post('/payments-razorpay',authMedicine,buyMedicine);

// Route to verify Razorpay payment
medicineRoutes.post('/verifys-payment',authMedicine, verifyPayment); // Minor suggestion: maybe rename to '/verify-payment'?

// THIS LINE IS CORRECT for handling the GET request the frontend makes
medicineRoutes.get("/my-medicines", authMedicine, getMyMedicines);

// This line looks correct for handling cancellation
medicineRoutes.post("/cancel-order", authMedicine, cancelOrder);

export default medicineRoutes;