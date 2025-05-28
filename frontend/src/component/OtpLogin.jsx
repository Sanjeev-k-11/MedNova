import React, { useState } from 'react';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OtpLogin = ({ onOtpVerified }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const auth = getAuth();

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    handleSendOtp();
                }
            }, auth);
        }
    };

    const handleSendOtp = () => {
        if (phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        signInWithPhoneNumber(auth, `+${phone}`, appVerifier)
            .then((confirmationResult) => {
                window.confirmationResult = confirmationResult;
                setIsOtpSent(true);
                toast.success('OTP sent successfully!');
            })
            .catch((error) => {
                toast.error('Failed to send OTP. Please try again.');
                console.error(error);
            });
    };

    const handleVerifyOtp = () => {
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }
        window.confirmationResult
            .confirm(otp)
            .then((result) => {
                toast.success('OTP verified successfully!');
                onOtpVerified(result.user);
            })
            .catch((error) => {
                toast.error('Invalid OTP. Please try again.');
                console.error(error);
            });
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 shadow-lg rounded-2xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-4">OTP Verification</h2>

                <input
                    type="tel"
                    placeholder="Enter phone number with country code"
                    className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setPhone(e.target.value)}
                    value={phone}
                />

                {isOtpSent && (
                    <input
                        type="number"
                        placeholder="Enter OTP"
                        className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                        onChange={(e) => setOtp(e.target.value)}
                        value={otp}
                    />
                )}

                {!isOtpSent ? (
                    <button
                        onClick={handleSendOtp}
                        className="bg-blue-500 text-white w-full py-3 rounded-lg hover:bg-blue-600"
                    >
                        Send OTP
                    </button>
                ) : (
                    <button
                        onClick={handleVerifyOtp}
                        className="bg-green-500 text-white w-full py-3 rounded-lg hover:bg-green-600"
                    >
                        Verify OTP
                    </button>
                )}

                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
};

export default OtpLogin;
