import express from 'express';
import { registerUser ,loginUser, getProfile, updateProfile, bookAppointment, listAppointment,cancelAppointment, paymentRazorpay, verifyRazorpay, getPublicContactData, getPublicHeaderConfig, verifyOtp, resendOtp,  } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';

const router = express.Router();

router.post('/register', registerUser); // ✅ Ensure POST /register is defined
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);
router.get('/get-profile',authUser,getProfile)
router.post('/update-profile',upload.single('image'),authUser,updateProfile)
router.post('/book-appointment',authUser,bookAppointment)
router.get('/appointments',authUser,listAppointment)
router.post('/cancel-appointment',authUser,cancelAppointment)
router.post('/payment-razorpay',authUser,paymentRazorpay)
router.post('/verify-payment',authUser,verifyRazorpay)

router.get('/contact', getPublicContactData);

router.get('/header', getPublicHeaderConfig);
export default router;
