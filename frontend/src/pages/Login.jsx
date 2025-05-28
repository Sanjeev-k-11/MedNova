// src/components/Login.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '../assets/assets'; // Ensure correct path

// Define the duration for the resend timer (in seconds)
// This should ideally match the minimum wait time enforced by your backend
const RESEND_WAIT_TIME_SECONDS = 60; // Example: 1 minute

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext);
  const navigate = useNavigate();

  // State to manage the current view: 'Sign Up', 'Login', 'OTP Verification'
  const [state, setState] = useState('Sign Up');
  // State for form data (signup or login)
  const [userData, setUserData] = useState({ name: '', email: '', password: '', phone: '' });
  // State for OTP input during verification
  const [otpInput, setOtpInput] = useState('');
  // State to store the email for which OTP is pending verification
  const [verifyingEmail, setVerifyingEmail] = useState('');
  // State to manage loading state (optional, for showing spinner)
  const [loading, setLoading] = useState(false);

  // --- Timer State ---
  // State for the countdown timer (in seconds) for resending OTP
  const [timer, setTimer] = useState(0);


  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e) => {
    setOtpInput(e.target.value);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    // Prevent submitting if already submitting or in OTP state
     if (loading || state === 'OTP Verification') return;

    setLoading(true); // Start loading
    try {
      let url = '';
      let payload = {};

      if (state === 'Sign Up') {
        url = '/api/user/register'; // Backend endpoint to create PendingUser and send OTP
        payload = userData;
      } else if (state === 'Login') {
        url = '/api/user/login'; // Backend endpoint to log in verified users
        payload = { email: userData.email, password: userData.password };
      }

      const { data } = await axios.post(`${backendUrl}${url}`, payload);

      if (data.success) {
        if (state === 'Sign Up') {
          // --- Successful Registration Initiation (PendingUser Created, OTP Sent) ---
          toast.success(data.message || 'OTP sent to your email.');
          // Store the email received from the backend response for verification
          setVerifyingEmail(data.user?.email || userData.email);
          setState('OTP Verification'); // Switch to OTP verification form
          // Clear signup form data as it's no longer needed
          setUserData({ name: '', email: '', password: '', phone: '' });
          setTimer(RESEND_WAIT_TIME_SECONDS); // *** Start the timer after successful send ***

        } else if (state === 'Login') {
           // --- Successful Login (User was already verified) ---
           localStorage.setItem('token', data.token);
           setToken(data.token);
           toast.success('Logged in successfully!');
           navigate('/'); // Redirect to home page
           // Clear login form data
           setUserData({ name: '', email: '', password: '', phone: '' });
        }
      } else {
        // Handle backend errors for both signup initiation and login
        toast.error(data.message);
         // If login fails because email is not verified, user might need guidance
         // This is handled by the effect cleaning state when state changes, but
         // if you wanted to keep the email specifically:
         // if (state === 'Login' && data.message && data.message.includes("Email not verified")) {
         //      setUserData(prev => ({ ...prev, email: userData.email }));
         // }
      }

    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(error.response?.data?.message || error.message || "An unexpected error occurred.");
       // If login fails and response suggests verification issue, guide user to OTP state if possible
        if (state === 'Login' && error.response?.data?.message?.includes("Email not verified")) {
             // If backend sends back the email for the unverified account
             if(error.response?.data?.email){
                 setVerifyingEmail(error.response.data.email);
                 setState('OTP Verification'); // Switch to OTP verification state
                 setTimer(RESEND_WAIT_TIME_SECONDS); // *** Start the timer ***
                 toast.info("Your email is not verified. Please verify it using the sent OTP.");
             } else {
                 // If backend doesn't return email, maybe suggest signup/resend manually
                  toast.info("Your email is not verified. Please register again or use the 'Resend OTP' option if you remember the email.");
             }
         }
    } finally {
        setLoading(false); // Stop loading
    }
  };

  // Handler for OTP Verification Submission
  const onVerifyOtpHandler = async (event) => {
     event.preventDefault();
      if (loading || !verifyingEmail) return; // Prevent submitting if loading or no email

     setLoading(true); // Start loading
     try {
         // Backend endpoint to verify OTP and CREATE main user (NO TOKEN RETURNED HERE)
         const url = '/api/user/verify-otp';
         // Use stored email and OTP input
         const payload = { email: verifyingEmail, otp: otpInput };

         const { data } = await axios.post(`${backendUrl}${url}`, payload);

         if (data.success) {
             // --- Successful OTP Verification (Main User Created) ---
             // Account is now active on the backend, but the user is NOT yet logged in.
             toast.success(data.message || 'Email verified successfully! You can now log in.');

             // --- Navigate back to the Login page ---
             setState('Login'); // Change state back to Login form
             // Clear OTP state and verifying email
             setOtpInput('');
             setVerifyingEmail('');
             setTimer(0); // *** Stop and reset timer ***
             // Optionally pre-fill the email field in the login form for convenience
             setUserData({ name: '', email: verifyingEmail, password: '', phone: '' });

         } else {
             // OTP verification failed (invalid code, expired, etc.)
             toast.error(data.message || 'OTP verification failed.');
         }
     } catch (error) {
         console.error("Verify OTP Error:", error);
         toast.error(error.response?.data?.message || error.message || "An error occurred during verification.");
     } finally {
         setLoading(false); // Stop loading
     }
  };

  // Handler for Resend OTP
  const onResendOtpHandler = async () => {
       // Prevent resend if loading or timer is still active
       if (loading || !verifyingEmail || timer > 0) return;

      setLoading(true); // Start loading
      try {
          // Backend endpoint to resend OTP for PendingUser
          const url = '/api/user/resend-otp';
          // Send the stored email to resend OTP to
          const payload = { email: verifyingEmail };

          const { data } = await axios.post(`${backendUrl}${url}`, payload);

          if (data.success) {
              toast.success(data.message || 'New OTP sent to your email.');
              setOtpInput(''); // Clear the OTP input field so user enters the new one
              setTimer(RESEND_WAIT_TIME_SECONDS); // *** Reset and start the timer after successful resend ***
          } else {
              toast.error(data.message || 'Failed to resend OTP.');
              // If backend returns a specific waiting message, the user sees that via toast
              // e.g., "Please wait X seconds" or "You have requested too many times..."
          }
      } catch (error) {
          console.error("Resend OTP Error:", error);
          toast.error(error.response?.data?.message || error.message || "An error occurred while resending OTP.");
          // If backend returns a specific waiting message in error.response.data.message, toast displays it
      } finally {
         setLoading(false); // Stop loading
      }
  };

  // --- Effect to manage the timer countdown ---
  useEffect(() => {
      let intervalId = null;

      if (state === 'OTP Verification' && timer > 0) {
          intervalId = setInterval(() => {
              setTimer(prevTimer => {
                  // Use prevTimer from the interval closure
                  if (prevTimer <= 1) {
                      // Timer reached zero or less, clear the interval
                      clearInterval(intervalId);
                      return 0; // Ensure timer doesn't go below zero
                  }
                  return prevTimer - 1; // Decrement
              });
          }, 1000); // Update every 1 second
      }

      // Cleanup function: clear interval when state changes away from OTP verification,
      // when timer reaches 0 (handled inside setInterval callback), or component unmounts.
      return () => {
          if (intervalId) {
              clearInterval(intervalId);
          }
      };
  }, [state]); // Re-run effect only when the 'state' changes

  // Redirect if token exists (e.g., on page load if already logged in)
  useEffect(() => {
    if (token) {
        navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only re-run if token changes

  // Clear form data and timer when switching between states
  useEffect(() => {
      // Clear form data and OTP/verifying email when switching states
      if (state === 'Sign Up') {
         // Clear everything when going back to Signup
         setUserData({ name: '', email: '', password: '', phone: '' });
         setOtpInput('');
         setVerifyingEmail('');
         setTimer(0); // Ensure timer is reset when leaving OTP state
      } else if (state === 'Login') {
          // When switching to Login (either from Signup or Verification), clear
          // name, phone, password and OTP state. Keep email if it was pre-filled
           setUserData(prev => ({ ...prev, name: '', password: '', phone: '' }));
           setOtpInput('');
           setTimer(0); // Ensure timer is reset when leaving OTP state
           // verifyingEmail is cleared implicitly when userData is reset in Signup state,
           // or explicitly before setting userData in onVerifyOtpHandler.

      } else if (state === 'OTP Verification') {
           // When entering OTP state, clear signup specific fields like name and phone
           setUserData(prev => ({ ...prev, name: '', password: '', phone: '' }));
           setOtpInput(''); // Also clear OTP input field when entering OTP state
           // Timer is started explicitly by onSubmitHandler or onResendOtpHandler
           // verifyingEmail is set by onSubmitHandler (Signup) or potentially on Login failure
      }
  }, [state]); // Dependency array: run when state changes


  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: `url(${assets.header_img6})`, // Use relevant background image
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark Overlay for Better Readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <AnimatePresence mode="wait">
        {/* Conditional Rendering based on 'state' */}

        {/* --- Signup Form --- */}
        {state === 'Sign Up' && (
          <motion.form
            key="signup-form"
            onSubmit={onSubmitHandler}
            className="relative z-10 bg-white p-8 md:p-10 rounded-xl shadow-xl w-full max-w-md backdrop-blur-md bg-opacity-90"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-3xl font-bold text-center text-gray-800 mb-3">Create Account</p>
            <p className="text-center text-gray-600 mb-6">Sign up to book appointments</p>

            {/* Input fields for signup */}
            <motion.div className="mb-4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <p className="text-gray-700 font-medium">Full Name</p>
              <input type="text" name="name" onChange={handleChange} value={userData.name} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
            </motion.div>

            <motion.div className="mb-4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <p className="text-gray-700 font-medium">Phone Number</p>
              <input type="tel" name="phone" onChange={handleChange} value={userData.phone} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
            </motion.div>

            <motion.div className="mb-4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <p className="text-gray-700 font-medium">Email</p>
              <input type="email" name="email" onChange={handleChange} value={userData.email} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
            </motion.div>

            <motion.div className="mb-6" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
              <p className="text-gray-700 font-medium">Password</p>
              <input type="password" name="password" onChange={handleChange} value={userData.password} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
            </motion.div>

            <motion.button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition transform hover:scale-105 disabled:bg-blue-300"
              whileHover={{ scale: 1.02 }} // Slight scale on hover
              whileTap={{ scale: 0.98 }} // Slight press effect
               disabled={loading} // Disable button while loading
            >
              {loading ? 'Creating...' : 'Create Account'}
            </motion.button>

            <p className="mt-4 text-center text-gray-700">
              Already have an account?{' '}
              <span
                onClick={() => setState('Login')} // Changes state to 'Login'
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Login here
              </span>
            </p>
          </motion.form>
        )}

        {/* --- Login Form --- */}
        {state === 'Login' && (
             <motion.form
                 key="login-form"
                 onSubmit={onSubmitHandler} // Calls onSubmitHandler (which handles login when state is 'Login')
                 className="relative z-10 bg-white p-8 md:p-10 rounded-xl shadow-xl w-full max-w-md backdrop-blur-md bg-opacity-90"
                 initial={{ opacity: 0, y: 50 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -50 }}
                 transition={{ duration: 0.5 }}
             >
                 <p className="text-3xl font-bold text-center text-gray-800 mb-3">Login</p>
                 <p className="text-center text-gray-600 mb-6">Login to continue</p>

                 {/* Input fields for login */}
                 <motion.div className="mb-4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                     <p className="text-gray-700 font-medium">Email</p>
                     <input type="email" name="email" onChange={handleChange} value={userData.email} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                 </motion.div>

                 <motion.div className="mb-6" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                     <p className="text-gray-700 font-medium">Password</p>
                     <input type="password" name="password" onChange={handleChange} value={userData.password} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                 </motion.div>

                 <motion.button
                     type="submit"
                     className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition transform hover:scale-105 disabled:bg-blue-300"
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     disabled={loading} // Disable button while loading
                 >
                     {loading ? 'Logging in...' : 'Login'}
                 </motion.button>

                 {/* Link to switch to Signup form */}
                 <p className="mt-4 text-center text-gray-700">
                     Create a new account?{' '}
                     <span
                         onClick={() => setState('Sign Up')} // Changes state to 'Sign Up'
                         className="text-blue-600 cursor-pointer hover:underline"
                     >
                         Click here
                     </span>
                 </p>
             </motion.form>
        )}

        {/* --- OTP Verification Form --- */}
         {state === 'OTP Verification' && (
             <motion.form
                 key="otp-verification-form"
                 onSubmit={onVerifyOtpHandler} // Calls the specific handler for OTP verification
                 className="relative z-10 bg-white p-8 md:p-10 rounded-xl shadow-xl w-full max-w-md backdrop-blur-md bg-opacity-90"
                 initial={{ opacity: 0, y: 50 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -50 }}
                 transition={{ duration: 0.5 }}
             >
                 <p className="text-3xl font-bold text-center text-gray-800 mb-3">Verify Your Email</p>
                 <p className="text-center text-gray-600 mb-6">
                     An OTP has been sent to <strong className="text-blue-600">{verifyingEmail}</strong>. Please enter it below.
                 </p>

                 {/* Input field for OTP */}
                 <motion.div className="mb-4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                     <p className="text-gray-700 font-medium">Enter OTP</p>
                     <input
                         type="text"
                         inputMode="numeric"
                         pattern="\d{6}" // Basic pattern for 6 digits
                         name="otp"
                         onChange={handleOtpChange}
                         value={otpInput}
                         required
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-center text-xl tracking-wider"
                         maxLength="6" // Limit input to 6 characters
                     />
                 </motion.div>

                 <motion.button
                     type="submit"
                     className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition transform hover:scale-105 disabled:bg-green-300"
                      whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     disabled={loading} // Disable button while loading
                 >
                     {loading ? 'Verifying...' : 'Verify OTP'}
                 </motion.button>

                 {/* Resend OTP Link and Timer */}
                 <p className="mt-4 text-center text-gray-700">
                     Didn't receive the OTP?{' '}
                     {/* Conditional rendering based on timer */}
                     {timer > 0 ? (
                         // Display timer if it's running
                         <span className="text-gray-500 cursor-not-allowed">
                             Resend in 0:{timer.toString().padStart(2, '0')}
                         </span>
                     ) : (
                         // Display clickable link if timer is 0 and not loading
                         <span
                             onClick={!loading ? onResendOtpHandler : undefined} // Only attach handler if not loading
                             className={`text-blue-600 cursor-pointer hover:underline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              // Disabled state is handled by the onClick condition and opacity class
                         >
                             Resend OTP
                         </span>
                     )}
                 </p>

                  <p className="mt-2 text-center text-gray-700">
                    Wrong email?{' '}
                     <span
                         onClick={() => {
                             // Go back to signup state to correct email
                             setState('Sign Up');
                             // Clear all state related to OTP and previous signup attempt
                             setUserData({ name: '', email: '', password: '', phone: '' });
                             setOtpInput('');
                             setVerifyingEmail('');
                             setTimer(0); // Ensure timer is reset
                         }}
                         className={`text-blue-600 cursor-pointer hover:underline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                         disabled={loading} // Disable link while loading
                     >
                         Go back to Signup
                     </span>
                 </p>
             </motion.form>
         )}

      </AnimatePresence>
    </div>
  );
};

export default Login;