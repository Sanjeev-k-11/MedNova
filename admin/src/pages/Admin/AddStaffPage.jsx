// src/pages/AddStaffPage.jsx

import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets";        // Ensure this path is correct
import { AdminContext } from "../../context/AdminContext"; // Ensure this path is correct
import { toast } from "react-toastify";
import axios from 'axios';
import validator from 'validator';

// --- Constants ---
const STAFF_ROLES = ['admin', 'nurse', 'receptionist', 'staff', 'technician'];
const VID_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;

// --- Helper: Basic SVG Spinner ---
const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Component ---
const AddStaffPage = () => {
  // --- State ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageFile, setImageFile] = useState(null); // Use null for clearer empty state
  const [vid, setVid] = useState('');
  const [role, setRole] = useState('staff');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // State for inline validation errors

  const { backendUrl, token } = useContext(AdminContext);

  // --- Handlers ---
  const handleImageChange = (e) => {
      if (e.target.files && e.target.files[0]) {
          setImageFile(e.target.files[0]);
          setFieldErrors(prev => ({ ...prev, imageFile: null })); // Clear image error on selection
      }
  }

  const handleVidChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= VID_LENGTH) {
        setVid(value);
        if (fieldErrors.vid && value.length === VID_LENGTH) {
             setFieldErrors(prev => ({ ...prev, vid: null })); // Clear VID error when valid length reached
        }
    }
  }

  // --- Validation Logic ---
  const validateForm = () => {
      const errors = {};
      if (!imageFile) errors.imageFile = "Staff photo is required.";
      if (!name.trim()) errors.name = "Name is required.";
      if (!email.trim()) errors.email = "Email is required.";
      else if (!validator.isEmail(email)) errors.email = "Invalid email format.";

      if (!vid.trim()) errors.vid = "VID is required.";
      else if (!/^\d{6}$/.test(vid)) errors.vid = `VID must be exactly ${VID_LENGTH} digits.`;

      if (!password) errors.password = "Password is required.";
      else if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

      if (!confirmPassword) errors.confirmPassword = "Password confirmation is required.";
      else if (password && password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

      if (!role) errors.role = "Role is required."; // Should default, but good practice
      if (!salary || Number(salary) < 0) errors.salary = "Valid salary is required.";

      // Add more specific validation for phone, address fields if needed

      setFieldErrors(errors);
      return Object.keys(errors).length === 0; // Return true if no errors
  }

  // --- Submit Handler ---
  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
        toast.error("Please fix the errors in the form.");
        return; // Stop submission if validation fails
    }

    setLoading(true);
    setFieldErrors({}); // Clear errors before submission attempt

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', name.trim());
    formData.append('email', email.trim());
    formData.append('password', password); // Send raw password
    formData.append('vid', vid);
    formData.append('role', role);
    formData.append('phone', phone.trim());
    formData.append('salary', Number(salary));
    formData.append('address', JSON.stringify({
        line1: addressLine1.trim(),
        line2: addressLine2.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim()
    }));

    try {
        if (!token) {
            toast.error('Authentication token not found. Please log in.');
            setLoading(false); return;
        }

        const response = await axios.post(`${backendUrl}/api/staff/register`, formData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = response.data;

        if (data.success) {
            toast.success(data.message || 'Staff member added successfully!');
            // Reset form
            setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
            setImageFile(null); setVid(''); setRole('staff'); setPhone(''); setSalary('');
            setAddressLine1(''); setAddressLine2(''); setCity(''); setPostalCode(''); setCountry('');
            // Clear file input visually (important!)
            const fileInput = document.getElementById('staff-image');
            if (fileInput) fileInput.value = "";
        } else {
            // Use backend validation message if provided
            toast.error(data.message || 'Failed to add staff member.');
        }
    } catch (error) {
        console.error("Error adding staff:", error);
        const errorMessage = error.response?.data?.message || "An unexpected error occurred. Please check logs or try again.";
        toast.error(errorMessage);
        // Optionally: Map backend validation errors back to fieldErrors state
        // if (error.response?.data?.errors) { setFieldErrors(error.response.data.errors); }
    } finally {
        setLoading(false);
    }
  };

  // --- Helper for Input Class Names ---
  const getInputClasses = (fieldName) => {
    const baseClasses = "w-full border p-3 rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out";
    const errorClasses = "border-red-500 focus:border-red-500 focus:ring-red-500";
    const normalClasses = "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500";
    return `${baseClasses} ${fieldErrors[fieldName] ? errorClasses : normalClasses}`;
  };
  const getSmallInputClasses = (fieldName) => {
     const baseClasses = "w-full border p-2 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out";
     const errorClasses = "border-red-500 focus:border-red-500 focus:ring-red-500";
     const normalClasses = "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500";
     return `${baseClasses} ${fieldErrors[fieldName] ? errorClasses : normalClasses}`;
   };


  // --- Render ---
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 w-full min-h-screen py-10 px-4 flex items-center justify-center">
      <form className="max-w-4xl w-full mx-auto bg-white shadow-lg rounded-xl p-8 md:p-10 border border-gray-200" onSubmit={onSubmitHandler} noValidate>
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">Add New Staff Member</h2>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          {/* === Left Column === */}
          <div className="space-y-6">

            {/* Image Upload */}
            <div className="text-center md:text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Staff Photo *</label>
              <div className="flex flex-col items-center gap-2">
                  <label htmlFor="staff-image" className={`cursor-pointer block w-28 h-28 border-2 border-dashed rounded-full p-1 flex items-center justify-center text-gray-400 hover:border-indigo-500 transition ${fieldErrors.imageFile ? 'border-red-500 hover:border-red-600' : 'border-gray-400'}`}>
                      <img src={imageFile ? URL.createObjectURL(imageFile) : assets.upload_area} alt="Upload Staff" className="w-full h-full object-cover rounded-full" />
                  </label>
                  <input onChange={handleImageChange} type="file" id="staff-image" hidden accept="image/*"/>
                  {imageFile && <span className="text-xs text-gray-600 mt-1 block truncate w-48 text-center">{imageFile.name}</span>}
                  {!imageFile && <p className="text-xs text-gray-500">Click to upload</p>}
                  {fieldErrors.imageFile && <p className="text-xs text-red-600 mt-1">{fieldErrors.imageFile}</p>}
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
              <input id="name" onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="Enter full name" required className={getInputClasses('name')} autoComplete="name"/>
              {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
            </div>

            {/* VID */}
             <div>
                <label htmlFor="vid" className="block text-sm font-medium text-gray-700 mb-1.5">Staff VID ({VID_LENGTH} Digits) *</label>
                <input id="vid" onChange={handleVidChange} value={vid} type="text" placeholder={`Enter ${VID_LENGTH}-digit VID`} required maxLength={VID_LENGTH} pattern="\d{6}" title={`VID must be exactly ${VID_LENGTH} digits`} className={getInputClasses('vid')} autoComplete="off"/>
                {fieldErrors.vid && <p className="text-xs text-red-600 mt-1">{fieldErrors.vid}</p>}
             </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input id="email" onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder="Enter email address" required className={getInputClasses('email')} autoComplete="email"/>
               {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Password Fields Grouped */}
            <div className="space-y-4 rounded-md border border-gray-200 p-4 bg-gray-50/50">
                 <h3 className="text-sm font-medium text-gray-600 mb-2">Set Password</h3>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                  <input id="password" onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder="Minimum 8 characters" required className={getInputClasses('password')} autoComplete="new-password"/>
                  {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
                </div>
                 <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                  <input id="confirmPassword" onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} type="password" placeholder="Retype password" required className={getInputClasses('confirmPassword')} autoComplete="new-password"/>
                  {fieldErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>}
                </div>
            </div>

          </div> {/* --- End Left Column --- */}

          {/* === Right Column === */}
          <div className="space-y-6">
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
              <select id="role" onChange={(e) => setRole(e.target.value)} value={role} required className={`w-full border bg-white p-3 rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out ${fieldErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}>
                {STAFF_ROLES.map(roleOption => (<option key={roleOption} value={roleOption}>{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</option>))}
              </select>
              {fieldErrors.role && <p className="text-xs text-red-600 mt-1">{fieldErrors.role}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input id="phone" onChange={(e) => setPhone(e.target.value)} value={phone} type="tel" placeholder="Enter phone number" className={getInputClasses('phone')} autoComplete="tel"/>
               {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
            </div>

            {/* Salary */}
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1.5">Salary *</label>
              <input id="salary" onChange={(e) => setSalary(e.target.value)} value={salary} type="number" placeholder="Enter salary amount" required min="0" step="any" className={getInputClasses('salary')}/>
              {fieldErrors.salary && <p className="text-xs text-red-600 mt-1">{fieldErrors.salary}</p>}
            </div>

            {/* Address Fields */}
            <fieldset className="border border-gray-200 p-4 rounded-md pt-3 bg-gray-50/50">
                <legend className="text-sm font-medium text-gray-700 px-1">Address (Optional)</legend>
                <div className="space-y-3 mt-2">
                     <div>
                        <label htmlFor="addressLine1" className="block text-xs font-medium text-gray-600 mb-1">Line 1</label>
                        <input id="addressLine1" type="text" placeholder="Street address, P.O. box" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className={getSmallInputClasses('addressLine1')} autoComplete="address-line1"/>
                        {fieldErrors.addressLine1 && <p className="text-xs text-red-600 mt-1">{fieldErrors.addressLine1}</p>}
                    </div>
                     <div>
                        <label htmlFor="addressLine2" className="block text-xs font-medium text-gray-600 mb-1">Line 2</label>
                        <input id="addressLine2" type="text" placeholder="Apartment, suite, etc." value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className={getSmallInputClasses('addressLine2')} autoComplete="address-line2"/>
                         {fieldErrors.addressLine2 && <p className="text-xs text-red-600 mt-1">{fieldErrors.addressLine2}</p>}
                    </div>
                     <div>
                        <label htmlFor="city" className="block text-xs font-medium text-gray-600 mb-1">City</label>
                        <input id="city" type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} className={getSmallInputClasses('city')} autoComplete="address-level2"/>
                         {fieldErrors.city && <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>}
                    </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label htmlFor="postalCode" className="block text-xs font-medium text-gray-600 mb-1">Postal Code</label>
                            <input id="postalCode" type="text" placeholder="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value)} className={getSmallInputClasses('postalCode')} autoComplete="postal-code"/>
                             {fieldErrors.postalCode && <p className="text-xs text-red-600 mt-1">{fieldErrors.postalCode}</p>}
                         </div>
                         <div>
                            <label htmlFor="country" className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                            <input id="country" type="text" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} className={getSmallInputClasses('country')} autoComplete="country-name"/>
                             {fieldErrors.country && <p className="text-xs text-red-600 mt-1">{fieldErrors.country}</p>}
                         </div>
                     </div>
                </div>
            </fieldset>

          </div> {/* --- End Right Column --- */}
        </div> {/* --- End Grid --- */}

        {/* Submit Button */}
        <div className="mt-10 text-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-full md:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                  <>
                    <Spinner />
                    <span>Adding Staff...</span>
                  </>
              ) : (
                  'Add Staff Member'
              )}
            </button>
        </div>

      </form>
    </div>
  );
};

export default AddStaffPage;