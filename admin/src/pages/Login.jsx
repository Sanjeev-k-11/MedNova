import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/doctorContext';
import { StaffContext } from '../context/StaffContext'; // Import StaffContext
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaUserMd, FaUsers, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; // Import icons

const LOGIN_TYPES = [
    { value: 'Admin', label: 'Admin', Icon: FaUserShield },
    { value: 'Doctor', label: 'Doctor', Icon: FaUserMd },
    { value: 'Staff', label: 'Staff', Icon: FaUsers },
];

const Login = () => {
    const [loginType, setLoginType] = useState('Admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Get setters and backendUrl from respective contexts
    const { setToken: setAdminToken, backendUrl } = useContext(AdminContext); // Assuming AdminContext provides backendUrl
    const { setDtoken: setDoctorToken } = useContext(DoctorContext);
    const { setStaffToken } = useContext(StaffContext); // Get setStaffToken correctly ONCE

    // If backendUrl is not in AdminContext, get it from StaffContext or a shared config
    // const { setStaffToken, backendUrl } = useContext(StaffContext); // Alternative if StaffContext holds URL

    const navigate = useNavigate();

    const toggleShowPassword = () => setShowPassword(!showPassword);

    const onsubmitHandler = async (event) => {
        event.preventDefault();
        setLoading(true);

        // Ensure backendUrl is available
        if (!backendUrl) {
            toast.error("Configuration error: Backend URL is missing.");
            setLoading(false);
            return;
        }

        let url = '';
        const payload = { email, password };

        try {
            if (loginType === 'Admin') {
                url = `${backendUrl}/api/admin/login`;
                const { data } = await axios.post(url, payload);
                if (data.success && data.token) { // Check for token existence
                    localStorage.setItem('token', data.token); // Admin token key
                    setAdminToken(data.token);
                    toast.success('Admin login successful!');
                    navigate('/admin-dashboard');
                } else {
                    toast.error(data.message || 'Admin login failed.');
                }
            } else if (loginType === 'Doctor') {
                url = `${backendUrl}/api/doctor/login`;
                const { data } = await axios.post(url, payload);
                if (data.success && data.token) { // Check for token existence
                    localStorage.setItem('dtoken', data.token); // Doctor token key
                    setDoctorToken(data.token);
                    toast.success('Doctor login successful!');
                    navigate('/doctor-dashboard');
                } else {
                    toast.error(data.message || 'Doctor login failed.');
                }
            } else if (loginType === 'Staff') {
                url = `${backendUrl}/api/staff/login`; // Staff login endpoint
                const { data } = await axios.post(url, payload);
                if (data.success && data.token) { // Check for token existence
                    // *** FIX: Use consistent localStorage key ***
                    localStorage.setItem('staffToken', data.token); // Use 'staffToken' key
                    // *** FIX: Call the correct context setter ***
                    setStaffToken(data.token); // Update context state
                    toast.success('Staff login successful!');
                    navigate('/staff-dashboard'); // Navigate to staff dashboard
                } else {
                    toast.error(data.message || 'Staff login failed.');
                }
            } else {
                toast.error('Invalid login type selected.');
            }
        } catch (error) {
            console.error("Login error:", error);
            // More specific error message from backend if available
            const message = error.response?.data?.message || error.message || "An error occurred during login.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 p-4">
            {/* Login Card */}
            <form onSubmit={onsubmitHandler} className="bg-white shadow-2xl rounded-xl p-8 sm:p-10 w-full max-w-md border border-gray-100">

                {/* Optional Logo Placeholder */}
                <div className="text-center mb-6">
                    <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        {/* Dynamically change icon based on selected type */}
                        {loginType === 'Admin' && <FaUserShield className="h-6 w-6 text-indigo-600" />}
                        {loginType === 'Doctor' && <FaUserMd className="h-6 w-6 text-indigo-600" />}
                        {loginType === 'Staff' && <FaUsers className="h-6 w-6 text-indigo-600" />}
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Sign in as <span className="text-indigo-600">{loginType}</span>
                    </h2>
                </div>

                {/* Login Type Selection */}
                <fieldset className="mb-6">
                    <legend className="block text-sm font-medium text-gray-700 mb-3 text-center">Select Your Role</legend>
                    <div className="flex justify-center space-x-3 sm:space-x-4">
                        {LOGIN_TYPES.map(({ value, label, Icon }) => (
                            <label key={value} className={`flex flex-col items-center justify-center p-3 w-24 h-24 border rounded-lg cursor-pointer transition duration-150 ease-in-out ${loginType === value ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="loginType"
                                    value={value}
                                    checked={loginType === value}
                                    onChange={(e) => setLoginType(e.target.value)}
                                    className="sr-only" // Hide actual radio, style the label
                                    aria-labelledby={`login-type-label-${value}`}
                                />
                                <Icon className={`h-6 w-6 mb-1 ${loginType === value ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                <span id={`login-type-label-${value}`} className={`block text-xs font-medium ${loginType === value ? 'text-indigo-700' : 'text-gray-600'}`}>{label}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                {/* Email Input */}
                <div className="mb-4 relative">
                    {/* Input and Label... */}
                     <label htmlFor="email-login" className="block text-sm font-medium text-gray-700 mb-1 sr-only">Email</label>
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <FaEnvelope className="h-4 w-4 text-gray-400" aria-hidden="true" />
                     </div>
                     <input
                         id="email-login"
                         onChange={(e) => setEmail(e.target.value)}
                         value={email}
                         type="email"
                         required
                         className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                         placeholder="Email address"
                         autoComplete="email"
                    />
                </div>

                {/* Password Input */}
                <div className="mb-4 relative">
                    {/* Input, Label, Button... */}
                     <label htmlFor="password-login" className="block text-sm font-medium text-gray-700 mb-1 sr-only">Password</label>
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <FaLock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                     </div>
                     <input
                         id="password-login"
                         onChange={(e) => setPassword(e.target.value)}
                         value={password}
                         type={showPassword ? 'text' : 'password'} // Toggle type
                         required
                         className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                         placeholder="Password"
                         autoComplete="current-password"
                     />
                     <button
                         type="button"
                         onClick={toggleShowPassword}
                         className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                         aria-label={showPassword ? "Hide password" : "Show password"}
                     >
                        {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                    </button>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right mb-6">
                     <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                         Forgot password?
                     </a>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                   {/* Loading Spinner or Text... */}
                   {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing In...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </button>

            </form>
        </div>
    );
};

export default Login;