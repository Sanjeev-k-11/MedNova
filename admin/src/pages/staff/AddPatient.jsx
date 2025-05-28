import React, { useState, useContext } from 'react';
// Make sure this path is correct for your project structure
import { StaffContext } from '../../context/StaffContext';

function AddPatient() {
    // --- Context ---
    const { staffToken, backendUrl } = useContext(StaffContext);

    // --- State ---
    // Updated initial state to include new fields
    const initialFormData = {
        // Basic Info
        name: '',
        age: '',
        gender: '',
        phone: '',
        address: '',
        // History
        medicalHistory: '',
        previousVisit: 'no', // Default value
        previousDate: '',
        doctorName: '',
        vid: '',
        // Current Appointment
        appointmentDetails: '',
        appointmentStatus: 'Scheduled', // Default status for new entry
        // Payment Details
        paymentAmount: '',
        paymentMethod: '', // Default empty, user selects
        paymentStatus: 'Unpaid', // Default status for new entry
        transactionId: '',
        paymentNotes: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        // Clear messages on interaction
        if (successMessage) setSuccessMessage('');
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        if (!staffToken) {
            setError("Authentication token not found. Please log in.");
            setIsLoading(false);
            return;
        }
        if (!backendUrl) {
            setError("Backend URL not configured.");
            setIsLoading(false);
            return;
        }

        // API endpoint for adding a patient
        const apiUrl = `${backendUrl}/api/staff/patient`;

        // --- Construct Payload matching Backend Schema ---
        // The backend expects specific structure, especially nested paymentDetails
        const payload = {
            // Basic Info
            name: formData.name,
            age: formData.age, // Backend will parse to Number
            gender: formData.gender,
            phone: formData.phone,
            address: formData.address,
            // History
            medicalHistory: formData.medicalHistory,
            previousVisit: formData.previousVisit,
            // Appointment
            appointmentDetails: formData.appointmentDetails,
            appointmentStatus: formData.appointmentStatus, // Directly map
            // Payment (nested structure)
            paymentDetails: {
                amount: formData.paymentAmount || null, // Send null if empty, backend parses
                method: formData.paymentMethod || null, // Send null if empty/default
                status: formData.paymentStatus, // Send selected status
                transactionId: formData.transactionId || null,
                notes: formData.paymentNotes || null
                // paymentDate is handled by backend logic usually
            }
        };

        // Conditionally add previous visit details to payload if 'yes'
        if (payload.previousVisit === 'yes') {
            payload.previousDate = formData.previousDate || null;
            payload.doctorName = formData.doctorName || null;
            payload.vid = formData.vid || null;
        }
        // --- End Payload Construction ---


        console.log(`Submitting to: ${apiUrl}`);
        console.log('Submitting Payload:', payload); // Log the structured payload
        console.log('Using Token:', staffToken ? 'Yes' : 'No');


        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${staffToken}`,
                },
                body: JSON.stringify(payload), // Send the structured payload
            });

            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                 const textResponse = await response.text();
                 if (response.ok) {
                     console.log("Received non-JSON success response:", textResponse);
                     setSuccessMessage('Action successful (non-JSON response).');
                     setFormData(initialFormData);
                     return;
                 } else {
                     throw new Error(`Error: ${response.status} ${response.statusText}. Response: ${textResponse.substring(0, 150)}...`);
                 }
            }

            if (!response.ok) {
                const errorMsg = result.message || `Error: ${response.status} ${response.statusText}`;
                const details = result.errors ? ` Details: ${result.errors.join(', ')}` : '';
                throw new Error(errorMsg + details);
            }

            console.log('Success Response:', result);
            setSuccessMessage(result.message || 'Patient added successfully!');
            setFormData(initialFormData); // Reset form on success

        } catch (err) {
            console.error('Submission Error:', err);
            setError(err.message || 'Failed to add patient. Check console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- JSX with Enhanced UI (using fieldsets) ---
    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 md:p-8 bg-white rounded-lg shadow-xl border border-gray-200">
            <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-8">
                Add New Patient Record
            </h1>

            {/* Display Success/Error Messages */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-md text-center text-sm transition-opacity duration-300 ease-in-out">
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-md text-center text-sm transition-opacity duration-300 ease-in-out">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* --- Basic Information Fieldset --- */}
                <fieldset className="border border-gray-300 p-4 md:p-6 rounded-md space-y-4">
                    <legend className="text-lg font-medium text-gray-700 px-2 -ml-2">Basic Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                            <input
                                type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                         {/* Age */}
                        <div>
                            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-red-500">*</span></label>
                            <input
                                type="number" id="age" name="age" value={formData.age} onChange={handleChange} min="0" required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Gender */}
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                            <select
                                id="gender" name="gender" value={formData.gender} onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="" disabled>-- Select --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                         {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                            <input
                                type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Address */}
                        <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                            <textarea
                                id="address" name="address" rows="3" value={formData.address} onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            ></textarea>
                        </div>
                    </div>
                </fieldset>

                {/* --- Medical & Visit History Fieldset --- */}
                <fieldset className="border border-gray-300 p-4 md:p-6 rounded-md space-y-4">
                     <legend className="text-lg font-medium text-gray-700 px-2 -ml-2">Medical & Visit History</legend>
                     {/* Medical History */}
                     <div>
                         <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">Medical History (Optional)</label>
                         <textarea
                            id="medicalHistory" name="medicalHistory" rows="4" value={formData.medicalHistory} onChange={handleChange}
                            placeholder="Known conditions, allergies, medications..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                    {/* Previous Visit Radio & Conditional Details */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Previous Visit?</label>
                         <div className="flex items-center space-x-6">
                            {/* Radio buttons as before */}
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="previousVisit" value="yes" checked={formData.previousVisit === 'yes'} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/> <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="previousVisit" value="no" checked={formData.previousVisit === 'no'} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/> <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                         </div>
                    </div>
                    {/* Conditional Fields */}
                    {formData.previousVisit === 'yes' && (
                        <div className="mt-4 p-4 border-l-4 border-indigo-300 bg-indigo-50 space-y-4 rounded-r-md">
                             <h4 className="text-base font-medium text-indigo-800">Previous Visit Details</h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                <div>
                                     <label htmlFor="previousDate" className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                                     <input type="date" id="previousDate" name="previousDate" value={formData.previousDate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                                </div>
                                <div>
                                     <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                                     <input type="text" id="doctorName" name="doctorName" value={formData.doctorName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                                </div>
                                <div>
                                     <label htmlFor="vid" className="block text-sm font-medium text-gray-700 mb-1">Visit ID (VID)</label>
                                     <input type="text" id="vid" name="vid" value={formData.vid} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                                </div>
                             </div>
                        </div>
                    )}
                 </fieldset>

                {/* --- Current Appointment & Status Fieldset --- */}
                 <fieldset className="border border-gray-300 p-4 md:p-6 rounded-md space-y-4">
                    <legend className="text-lg font-medium text-gray-700 px-2 -ml-2">Current Appointment</legend>
                    {/* Appointment Status */}
                    <div>
                        <label htmlFor="appointmentStatus" className="block text-sm font-medium text-gray-700 mb-1">Appointment Status <span className="text-red-500">*</span></label>
                        <select
                            id="appointmentStatus" name="appointmentStatus" value={formData.appointmentStatus} onChange={handleChange} required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            {/* Values should match backend enum */}
                            <option value="Scheduled">Scheduled</option>
                            <option value="CheckedIn">Checked In</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="NoShow">No Show</option>
                            <option value="Rescheduled">Rescheduled</option>
                        </select>
                    </div>
                    {/* Appointment Details */}
                    <div>
                        <label htmlFor="appointmentDetails" className="block text-sm font-medium text-gray-700 mb-1">Appointment Details (Optional)</label>
                        <textarea
                            id="appointmentDetails" name="appointmentDetails" rows="3" value={formData.appointmentDetails} onChange={handleChange}
                            placeholder="Reason for visit, assigned doctor, notes..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                 </fieldset>

                 {/* --- Payment Details Fieldset --- */}
                 <fieldset className="border border-gray-300 p-4 md:p-6 rounded-md space-y-4">
                    <legend className="text-lg font-medium text-gray-700 px-2 -ml-2">Payment Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        {/* Payment Amount */}
                        <div>
                            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                                type="number" step="0.01" id="paymentAmount" name="paymentAmount" value={formData.paymentAmount} onChange={handleChange} min="0"
                                placeholder="e.g., 150.00"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Payment Method */}
                        <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                            <select
                                id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">-- Select --</option>
                                {/* Values should match backend enum */}
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="UPI">UPI</option>
                                <option value="Online">Online</option>
                                <option value="Insurance">Insurance</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                         {/* Payment Status */}
                        <div>
                            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                            <select
                                id="paymentStatus" name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                {/* Values should match backend enum */}
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                                <option value="Partial">Partial</option>
                                <option value="Waived">Waived</option>
                            </select>
                        </div>
                    </div>
                     {/* Transaction ID */}
                     <div>
                        <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (Optional)</label>
                        <input
                            type="text" id="transactionId" name="transactionId" value={formData.transactionId} onChange={handleChange}
                            placeholder="For Card/Online/UPI payments"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                     {/* Payment Notes */}
                     <div>
                        <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">Payment Notes (Optional)</label>
                        <textarea
                            id="paymentNotes" name="paymentNotes" rows="2" value={formData.paymentNotes} onChange={handleChange}
                            placeholder="Any notes regarding the payment..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                 </fieldset>


                {/* --- Submit Button --- */}
                <div>
                    <button
                        type="submit"
                        disabled={isLoading || !staffToken}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Submitting...' : 'Add Patient Record'}
                    </button>
                    {!staffToken && <p className="text-xs text-red-600 text-center mt-2">Cannot submit without authentication.</p>}
                </div>
            </form>
        </div>
    );
}

export default AddPatient;