// import jwt from 'jsonwebtoken'
// import nodemailer from 'nodemailer'
// import userModel from '../models/userModel.js';


// // --- Nodemailer Transporter Setup ---
// // (Keep this setup as it was)
// const EMAIL_HOST = process.env.EMAIL_HOST;
// const EMAIL_PORT = process.env.EMAIL_PORT || 587;
// const EMAIL_USER = process.env.EMAIL_USER;
// const EMAIL_PASS = process.env.EMAIL_PASS;
// const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';

// if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
//     console.error("FATAL ERROR: Email credentials are not configured in environment variables. Email sending will be disabled.");
// }

// let transporter = null;
// if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
//     transporter = nodemailer.createTransport({
//         host: EMAIL_HOST,
//         port: EMAIL_PORT,
//         secure: EMAIL_SECURE,
//         auth: {
//             user: EMAIL_USER,
//             pass: EMAIL_PASS
//         },
//          tls: {
//              // Use only if you encounter certificate issues in development and know the risks
//              // rejectUnauthorized: false
//         }
//     });

//      transporter.verify(function (error, success) {
//         if (error) {
//             console.error("SMTP transporter verification failed:", error);
//         } else {
//             console.log("SMTP transporter is ready to take messages");
//         }
//      });
// } else {
//      console.warn("Nodemailer transporter is not initialized due to missing environment variables.");
// }


// // --- Helper Function to Generate OTP ---
// const generateOtp = () => {
//     // Generate a 6-digit number as a string
//     return Math.floor(100000 + Math.random() * 900000).toString();
// };

// // --- Helper Function to Send OTP Email ---
// const sendOtpEmail = async (email, otp) => {
//     // Check if transporter is initialized before sending
//     if (!transporter) {
//         console.error("Email transporter not configured. Cannot send email.");
//         return { success: false, message: "Email service not available." };
//     }

//     const mailOptions = {
//         from: `"Your App Name" <${EMAIL_USER}>`, // sender address
//         to: email, // list of receivers
//         subject: "Verify Your Email Address", // Subject line
//         text: `Your verification OTP is: ${otp}\n\nThis OTP is valid for 15 minutes.`, // plain text body
//         html: `
//             <p>Hello,</p>
//             <p>Thank you for registering with Your App Name!</p>
//             <p>Your One-Time Password (OTP) for email verification is:</p>
//             <h2 style="color: #4CAF50;">${otp}</h2>
//             <p>Please use this code to verify your email address. This OTP is valid for the next 15 minutes.</p>
//             <br>
//             <p>If you did not request this, please ignore this email.</p>
//             <p>Best regards,<br>Your App Name Team</p>
//         `, // html body
//     };

//     try {
//         let info = await transporter.sendMail(mailOptions);
//         console.log('OTP Email sent to %s: %s', email, info.messageId);

//         // Log preview URL for development (e.g., using Mailtrap or Ethereal)
//         if (process.env.NODE_ENV !== 'production' && info.preview) {
//              console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
//         }

//         return { success: true, message: "OTP email sent." };

//     } catch (error) {
//         console.error("Error sending OTP email to %s:", email, error);
//         return { success: false, message: "Failed to send OTP email." };
//     }
// };


// // --- Verify OTP API ---
// // This function checks the provided OTP and verifies the user's email.
// // Upon successful verification, it clears the OTP fields and issues the login token.
// const verifyOtp = async (req, res) => {
//     try {
//         const { email, otp } = req.body;

//         if (!email || !otp) {
//             return res.status(400).json({ success: false, message: "Email and OTP are required." });
//         }

//         const user = await userModel.findOne({ email });

//         // Check if user exists
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         // Check if user is already verified
//         if (user.isEmailVerified) {
//             return res.status(400).json({ success: false, message: "Email is already verified." });
//         }

//         // Check if OTP matches the stored OTP
//         // user.otp will be the value set during registration or resendOtp
//         if (user.otp !== otp) {
//             return res.status(400).json({ success: false, message: "Invalid OTP." });
//         }

//         // Check if OTP is expired
//         // user.otpExpiry will be the expiry time set during registration or resendOtp
//         if (user.otpExpiry < new Date()) {
//             // Clear OTP fields for security if expired
//             // This sets otp and otpExpiry to null in the database
//             user.otp = null;
//             user.otpExpiry = null;
//             await user.save(); // Save the change
//             return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
//         }

//         // If OTP is valid and not expired:
//         user.isEmailVerified = true; // Mark email as verified
//         user.otp = null;             // Clear OTP after successful verification (sets to null)
//         user.otpExpiry = null;       // Clear expiry after successful verification (sets to null)

//         await user.save(); // Save the updated user document (otp and otpExpiry are now null)

//         // Generate JWT Token (Now that email is verified, issue the main token)
//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

//         res.status(200).json({
//             success: true,
//             message: "Email verified successfully. You are now logged in.",
//             token,
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 phone: user.phone,
//                 isEmailVerified: user.isEmailVerified // Should be true
//             }
//         });

//     } catch (error) {
//         console.error("Verify OTP Error:", error);
//         res.status(500).json({ success: false, message: "Server error during OTP verification. Please try again later." });
//     }
// };

// // --- Resend OTP API ---
// // This function generates a new OTP and expiry, updates the user document,
// // and sends a new email if the user is not already verified.
// const resendOtp = async (req, res) => {
//     try {
//         const { email } = req.body;

//         if (!email) {
//             return res.status(400).json({ success: false, message: "Email is required." });
//         }

//         const user = await userModel.findOne({ email });

//         // Check if user exists
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         // Check if user is already verified
//         if (user.isEmailVerified) {
//             return res.status(400).json({ success: false, message: "Email is already verified." });
//         }

//          // Optional: Add rate limiting logic here to prevent abuse (e.g., check user.otpExpiry time)
//          // if (user.otpExpiry && user.otpExpiry > Date.now() - 60000) { // Example: Wait 60 seconds
//          //      return res.status(429).json({ success: false, message: "Please wait before requesting another OTP." });
//          // }

//         // Generate a NEW OTP and NEW expiry
//         const otp = generateOtp(); // Use helper function
//         const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // New expiry (e.g., 15 minutes from now)

//         // Update user document with new OTP and expiry
//         // This overwrites the previous otp and otpExpiry values
//         user.otp = otp;
//         user.otpExpiry = otpExpiry;
//         await user.save(); // Save the change

//         // Send the new OTP email (use helper function)
//         const emailStatus = await sendOtpEmail(user.email, otp);

//         if (emailStatus.success) {
//              res.status(200).json({ success: true, message: "A new OTP has been sent to your email." });
//         } else {
//              // Log the warning if email sending fails but still respond success=true
//              // because the user object *was* updated with the new OTP in the DB.
//              console.warn("Resend OTP: User updated with new OTP, but email sending failed.");
//              res.status(200).json({ success: true, message: "A new OTP was generated, but there was an issue sending the email. Please check your spam or try again later." });
//         }


//     } catch (error) {
//         console.error("Resend OTP Error:", error);
//         res.status(500).json({ success: false, message: "Server error while trying to resend OTP. Please try again later." });
//     }
// };


// // Export the functions
// export {
//     // Export helpers for authController to use
//     generateOtp,
//     sendOtpEmail,
//     // Export verification-specific functions for routes
//     verifyOtp,
//     resendOtp
// };