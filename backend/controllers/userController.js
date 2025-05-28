import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import Razorpay from 'razorpay'
import contactModel from '../models/contactmodel.js'
import RelativeAppointment from '../models/RelativeAppointment.js'
import HeaderModel from '../models/HeaderModel.js'



import mongoose from 'mongoose';
import nodemailer from 'nodemailer';


const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';

let transporter = null;
if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_SECURE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        },
         tls: {
            // rejectUnauthorized: false
         }
    });

     transporter.verify(function (error, success) {
        if (error) {
            console.error("SMTP transporter verification failed:", error);
            transporter = null;
        } else {
        }
     });
} else {
     console.warn("Nodemailer transporter is not initialized due to missing environment variables.");
}

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = async (email, otp) => {
    if (!transporter) {
        console.error("Email transporter not configured or failed verification. Cannot send email.");
        return { success: false, message: "Email service not available." };
    }

    const mailOptions = {
    from: `"MedNova" <${EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
    text: `Your verification OTP is: ${otp}\n\nThis OTP is valid for 1 minutes.`,
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://i.ibb.co/3MFSf8L/mednova-logo.png" alt="MedNova Logo" style="height: 60px;" />
            </div>
            <h2 style="color: #2c3e50;">Verify Your Email Address</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">
                Thank you for registering with <strong>MedNova</strong>!
            </p>
            <p style="font-size: 16px; color: #333;">
                Your One-Time Password (OTP) for email verification is:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #4CAF50; background-color: #f1f1f1; padding: 10px 20px; border-radius: 6px;">
                    ${otp}
                </span>
            </div>
            <p style="font-size: 16px; color: #333;">
                This OTP is valid for the next <strong>01 minutes</strong>. Please do not share it with anyone.
            </p>
            <p style="font-size: 14px; color: #777;">
                If you did not request this, you can safely ignore this email.
            </p>
            <br>
            <p style="font-size: 16px; color: #333;">Best regards,<br><strong>Team MedNova</strong></p>
        </div>
    `,
};


    try {
        let info = await transporter.sendMail(mailOptions);
        if (process.env.NODE_ENV !== 'production' && info.preview) {
        }
        return { success: true, message: "OTP email sent." };
    } catch (error) {
        console.error("Error sending OTP email to %s:", email, error);
        return { success: false, message: "Failed to send OTP email." };
    }
};

const createToken = (id) => {
    if (!process.env.JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
        throw new Error("JWT_SECRET is not configured.");
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};


const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format." });
         }
         if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
             return res.status(400).json({ success: false, message: "Invalid phone number format." });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
        }

        const existingUser = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] });

        if (existingUser) {
             let field = existingUser.email === email ? 'email' : 'phone';
             if (existingUser.isEmailVerified) {
                 return res.status(400).json({ success: false, message: `A verified account already exists with this ${field}. Please log in.` });
             } else {
                 return res.status(400).json({ success: false, message: `A verification is already pending for this ${field}. Please check your email or try logging in.` });
             }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 1 * 60 * 1000);

        const userData = {
            name,
            email,
            password: hashedPassword,
            phone,
            otp: otp,
            otpExpiry: otpExpiry,
            isEmailVerified: false,
             lastOtpSentTime: new Date(), // Set initial send time
        otpResendCount: 0, // Reset resend count
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();

        await sendOtpEmail(user.email, otp);

        res.status(201).json({
            success: true,
            message: " An OTP has been sent to your email for verification.",
            user: {
                email: user.email,
            },
            token: null
        });

    } catch (error) {
        console.error("Register Error:", error);

        if (error.code === 11000) {
             let field = error.message.includes('email') ? 'email' : error.message.includes('phone') ? 'phone' : 'field';
             return res.status(400).json({ success: false, message: `User already exists with this ${field}.` });
        }

        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        res.status(500).json({ success: false, message: "Server error during registration. Please try again later." });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required." });
        }

        const user = await userModel.findOne({ email });

        // Check if user exists
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Check if user is already verified
        if (user.isEmailVerified) {
            return res.status(400).json({ success: false, message: "Email is already verified." });
        }

        // Check if OTP matches the stored OTP
        // user.otp will be the value set during registration or resendOtp
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP." });
        }

        // Check if OTP is expired
        // user.otpExpiry will be the expiry time set during registration or resendOtp
        if (user.otpExpiry < new Date()) {
            // Clear OTP fields for security if expired
            // This sets otp and otpExpiry to null in the database
            user.otp = null;
            user.otpExpiry = null;
            await user.save(); // Save the change
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        // If OTP is valid and not expired:
        user.isEmailVerified = true; // Mark email as verified
        user.otp = null;             // Clear OTP after successful verification (sets to null)
        user.otpExpiry = null;       // Clear expiry after successful verification (sets to null)

        await user.save(); // Save the updated user document (otp and otpExpiry are now null)

        // Generate JWT Token (Now that email is verified, issue the main token)
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({
            success: true,
            message: "Email verified successfully. You are now logged in.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified // Should be true
            }
        });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ success: false, message: "Server error during OTP verification. Please try again later." });
    }
};

// Define your limits
const MIN_WAIT_SECONDS = 60; // 1 minute wait between *any* attempts
const MAX_RESEND_ATTEMPTS = 2; // Max resends *after* the initial one
const LONG_WAIT_MINUTES = 10; // 10 minutes wait after exceeding max resends

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required." });
        }

        // Find the user who is NOT verified yet
        const user = await userModel.findOne({ email, isEmailVerified: false });

        if (!user) {
             // User not found OR already verified. Return a message that doesn't reveal existence easily.
            return res.status(404).json({ success: false, message: "Unable to resend OTP for this email. Please check the email or register." });
        }

        const now = Date.now();
        const lastSent = user.lastOtpSentTime ? user.lastOtpSentTime.getTime() : 0; // Use 0 if not set (first resend scenario if initial wasn't tracked)
        const timeSinceLastSent = now - lastSent;

        // --- Rate Limiting Logic ---

        // Check the long wait period first if attempts are exceeded
        if (user.otpResendCount >= MAX_RESEND_ATTEMPTS) {
             const longWaitMilliseconds = LONG_WAIT_MINUTES * 60 * 1000;
             if (timeSinceLastSent < longWaitMilliseconds) {
                 const remainingWaitSeconds = Math.ceil((longWaitMilliseconds - timeSinceLastSent) / 1000);
                  // Note: Avoid telling them the exact number of attempts or the exact timer value for security/anti-enumeration
                 return res.status(429).json({ success: false, message: `You have requested OTP too many times. Please wait ${LONG_WAIT_MINUTES} minutes before trying again.` });
             } else {
                 // Long wait is over, reset count and allow resend
                 user.otpResendCount = 0; // Reset counter after long wait
             }
        }

        // Check the short wait period (applies between any attempts up to the max)
        const minWaitMilliseconds = MIN_WAIT_SECONDS * 1000;
         if (timeSinceLastSent < minWaitMilliseconds) {
             const remainingWaitSeconds = Math.ceil((minWaitMilliseconds - timeSinceLastSent) / 1000);
             return res.status(429).json({ success: false, message: `Please wait ${MIN_WAIT_SECONDS} seconds before requesting another OTP.` });
         }


        // If we reached here, rate limits are passed. Generate and send new OTP.
        const otp = generateOtp();
        const otpExpiry = new Date(now + 15 * 60 * 1000); // New expiry time

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.lastOtpSentTime = new Date(now); // Update last sent time
        user.otpResendCount += 1; // Increment resend count
        await user.save();

        const emailStatus = await sendOtpEmail(user.email, otp); // Assuming sendOtpEmail exists

        if (emailStatus.success) {
             res.status(200).json({ success: true, message: "A new OTP has been sent to your email." });
        } else {
             // If email sending fails, the user record is still updated with the new OTP.
             // The user can still try the new code if the previous one arrived late,
             // or they can hit resend again after the min wait.
             console.warn(`Resend OTP: User ${user.email} updated with new OTP, but email sending failed.`);
             // Consider if you want to revert the user save if email fails, or just warn.
             // Keeping the updated user allows the user to potentially receive a delayed email.
             // Reverting would prevent them from using the new OTP but might break the flow.
             res.status(200).json({ success: true, message: "A new OTP was generated, but there was an issue sending the email. Please check your spam or try again later." });
        }

    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({ success: false, message: "Server error while trying to resend OTP. Please try again later." });
    }
};


////Api for user login

// const loginUser = async (req,res) =>{

//     try{

//         const { email , password} = req.body
//         const user = await userModel.findOne({email})

//         if(!user){
//             res.json({ success: false, message:"user does not exist" });
//         }

//         const isMatch = await bcrypt.compare(password,user.password)

//         if(!isMatch){
//             const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
//             res.json({ success: false, token });
//         }else{
//             res.json({ success: false, message:"Invalid Credential"});
//         }


//     }catch(error){
//         console.error(error); // Logs the error in the backend console
//         res.json({ success: false, message: error.message });

//     }
// }





const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials." });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support for assistance." });
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({ success: false, message: "Email not verified. Please check your email for the verification code to activate your account." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials." });
        }

        const token = createToken(user._id);
        res.status(200).json({ success: true, token });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error during login. Please try again later." });
    }
};


//api to get user profile data

const getProfile = async (req, res) => {
    try {

        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })


    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: error.message });


    }
}

const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {
            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })



        }

        res.json({ success: true, message: "Profile Update" })


    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: error.message });

    }
}

//api to book appointment

const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body

        const docData = await doctorModel.findById(docId).select('-password')

        if (!docData.available) {
            return res.json({ success: false, message: "Doctor not available" })
        }

        let slots_booked = docData.slots_booked

        //checking for slot availablity
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: "Slot not available" })
            } else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save new slots date in docData

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })
        res.json({ success: true, message: 'Appoinment book' })

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: error.message });


    }
}

// Api to get user appintments for frounted my-appointments
// Fix the parameter order

const listAppointment = async (req, res) => {
    try {
        // Ensure userId is being passed correctly
        const { userId } = req.body; // Assuming you're using JWT and it's stored in req.user

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is missing' });
        }

        const appointments = await appointmentModel.find({ userId });

        // If appointments found, return them
        if (appointments.length > 0) {
            return res.json({ success: true, appointments });
        }

        // No appointments found
        return res.json({ success: false, message: 'No appointments found' });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};



const cancelAppointment = async (req, res) => {

    try {

        const { userId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        //verify appointment user
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: "UnAuthorized Action" })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot

        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: "Appointment Cancelled" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })




    }
}


//api to make payment of appointment using razoper
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const paymentRazorpay = async (req, res) => {

    try {
        
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: " Appointment Cancelled or not found" })

        }

        //creating ption for razorpay payment

        const options = {
            amount: appointmentData.amount *100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,

        }

        //creation of an order

        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })





    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })



    }
}




// Api to varify the user payment
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id } = req.body;

        if (!razorpay_order_id) {
            return res.status(400).json({ success: false, message: "Missing order ID" });
        }

        // Fetch order details
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
        console.log("Order Info:", orderInfo);

        // Fetch payment details using payment ID (better approach)
        const paymentInfo = await razorpayInstance.payments.fetch(razorpay_payment_id);
        console.log("Payment Info:", paymentInfo);

        if (paymentInfo.status === "captured") {
            // Update appointment payment status
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });

            return res.json({ success: true, message: "Payment Successful" });
        } else {
            return res.json({ success: false, message: "Payment failed or pending" });
        }

    } catch (error) {
        console.error("Razorpay Verification Error:", error);
        res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
    }
};

// // 
//  const buyMedicines = async (req, res) => {
//     const { userName, phoneNumber, cart } = req.body;

//     if (!userName || !phoneNumber || cart.length === 0) {
//         return res.status(400).json({ 
//             success: false, 
//             message: 'All fields (userName, phoneNumber, cart) are required' 
//         });
//     }

//     try {
//         // Calculate total amount in paise (Razorpay requires paise)
//         const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

//         // Create Razorpay order
//         const options = {
//             amount: totalAmount * 100, // Amount in paise
//             currency: 'INR',
//             receipt: `receipt_${Date.now()}`
//         };

//         const order = await razorpay.orders.create(options);

//         if (!order) {
//             return res.status(500).json({ success: false, message: 'Failed to create order' });
//         }

//         res.status(200).json({ 
//             success: true, 
//             message: 'Order created successfully', 
//             order 
//         });
//     } catch (error) {
//         console.error('Error in buyMedicines:', error);
//         res.status(500).json({ success: false, message: 'Server error in creating order' });
//     }
// };


//  const verifyPayment = async (req, res) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userName, phoneNumber, cart } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//         return res.status(400).json({ 
//             success: false, 
//             message: 'Missing payment verification details' 
//         });
//     }

//     try {
//         // Generate expected signature using Razorpay orderId and paymentId
//         const generatedSignature = crypto
//             .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//             .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//             .digest('hex');

//         if (generatedSignature !== razorpay_signature) {
//             return res.status(400).json({ success: false, message: 'Invalid signature, payment failed' });
//         }

//         // Calculate total amount
//         const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

//         // Save Purchase Record
//         const purchase = await PurchaseModel.create({
//             userName,
//             phoneNumber,
//             medicines: cart,
//             totalAmount,
//             paymentStatus: 'Paid',
//             paymentId: razorpay_payment_id,
//         });

//         // Update Medicine Stock
//         for (const item of cart) {
//             await medicineModel.findByIdAndUpdate(
//                 item.medicineId,
//                 { $inc: { quantity: -item.quantity } }, // Decrease stock
//                 { new: true }
//             );
//         }

//         res.status(200).json({ 
//             success: true, 
//             message: 'Payment verified and stock updated', 
//             purchase 
//         });
//     } catch (error) {
//         console.error('Error in verifyPayment:', error);
//         res.status(500).json({ success: false, message: 'Error in payment verification' });
//     }
// };



const getPublicContactData = async (req, res) => {
    console.log("--- Backend: getPublicContactData ---"); // Log request entry

    try {
        // Find the single document containing contact page settings.
        // Using findOne({}) assumes there's only one relevant document.
        const contactData = await contactModel.findOne({});

        if (!contactData) {
            // If no document exists yet (admin hasn't configured it)
            console.log("No contact data found in the database.");
            return res.status(404).json({
                success: false,
                message: "Contact information is not available at the moment."
                // Optionally, you could send default placeholder data here if needed by the frontend
                // data: { officeHeading: 'Contact Us', ... other defaults }
            });
        }

        // Successfully found the contact data
        console.log("Contact data fetched successfully.");
        res.status(200).json({
            success: true,
            message: "Contact data retrieved successfully.",
            data: contactData // Send the entire document's data
        });

    } catch (error) {
        // Handle potential database errors or other issues
        console.error("Error fetching public contact data:", error);
        res.status(500).json({
            success: false,
            message: "Server error occurred while fetching contact information."
            // Avoid sending detailed error messages to public users
            // error: error.message // Only for development/debugging
        });
    }
};




const createRelativeAppointment = async (req, res) => {
  try {
    const {
      patientName,
      patientAge,
      patientGender,
      appointmentDay,
      previousAppointmentDetails,
      patientPhoneNumber,
      userId
    } = req.body;

    if (!patientName || !patientAge || !patientGender || !appointmentDay || !patientPhoneNumber) {
      return res.status(400).json({ message: 'Please fill all required fields: Name, Age, Gender, Appointment Day, Phone Number' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required or user data missing.' });
    }

    const newAppointment = new RelativeAppointment({
      patientName,
      patientAge,
      patientGender,
      appointmentDay: new Date(appointmentDay),
      previousAppointmentDetails: previousAppointmentDetails || '',
      patientPhoneNumber,
      userId
    });

    const savedAppointment = await newAppointment.save();

    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment: savedAppointment
    });

  } catch (error) {
    console.error('Error booking relative appointment:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    if (error instanceof TypeError && error.message.includes('Cannot read properties of undefined')) {
      return res.status(500).json({ message: 'Internal server error related to user data.' });
    }

    res.status(500).json({ message: 'Server error while booking appointment.' });
  }
};

const getMyRelativeAppointments = async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authorized, user ID missing.' });
  }

  try {
    const userAppointments = await RelativeAppointment.find({ userId }).sort({ appointmentDay: 1 });

    res.status(200).json({
      count: userAppointments.length,
      appointments: userAppointments
    });

  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: 'Server error while fetching appointments.' });
  }
};



const getPublicHeaderConfig = async (req, res) => {
  try {
    const config = await HeaderModel.findOneAndUpdate(
      { name: 'mainHeaderConfig' },
      {
        $setOnInsert: {
          name: 'mainHeaderConfig',
          images: [{ url: '/path/to/default/image.jpg', altText: 'Default header image' }],
          loggedOutContent: { heading: 'Default Header', paragraph: 'Default welcome text.' },
          loggedInContent: { heading: 'Welcome Back', paragraph: 'Default logged-in text.' },
          loggedOutButton: { text: 'Get Started', link: '#' },
          loggedInButton: { text: 'My Dashboard', link: '#' }
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    if (error.name === 'CastError') {
      if (error.path === 'images') {
        return res.status(500).json({ success: false, message: 'Server configuration error: Invalid default image format in database setup.' });
      }
      if (error.path === '_id') {
        return res.status(500).json({ success: false, message: 'Server query error for header config.' });
      }
      return res.status(400).json({ success: false, message: `Data format error: ${error.message}` });
    }

    res.status(500).json({ success: false, message: 'Server error fetching header configuration.' });
  }
};

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay,getPublicContactData
    ,createRelativeAppointment,getMyRelativeAppointments , getPublicHeaderConfig,verifyOtp,resendOtp
}