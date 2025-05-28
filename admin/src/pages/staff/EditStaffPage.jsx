// src/pages/admin/EditStaffPage.jsx

import React, { useState, useEffect, useContext, Fragment } from 'react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext'; // Adjust path if needed
import { toast } from 'react-toastify';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, X, User, Mail, Hash, Briefcase, Phone, MapPin, DollarSign, Image as ImageIcon, ArrowLeft, PlusCircle, Trash2, Calendar, Clock, CreditCard } from 'lucide-react'; // Added CreditCard icon
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';

// Constants for Scheduling
const RECURRENCE_FREQUENCIES = ['weekly', 'monthly'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKS_OF_MONTH = [
    { value: 1, label: 'First' }, { value: 2, label: 'Second' },
    { value: 3, label: 'Third' }, { value: 4, label: 'Fourth' },
    { value: 5, label: 'Last' } // Using 5 for Last convention
];
// Define STAFF_ROLES if not imported globally
const STAFF_ROLES = ['admin', 'nurse', 'receptionist', 'staff', 'technician', 'doctor', 'other']; // Make sure this matches your needs

const defaultProfilePic = '/images/default-profile.png'; // Example path if image is in public folder

// Helper for small input class names (can be moved to a utility file)
const getSmallInputClasses = (hasError = false) => {
    const baseClasses = "w-full border p-2 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-opacity-50 transition duration-150 ease-in-out dark:bg-gray-700 dark:text-gray-200";
    const errorClasses = "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400";
    const normalClasses = "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400";
    return `${baseClasses} ${hasError ? errorClasses : normalClasses}`;
};

const EditStaffPage = () => {
    const { id: staffId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, token } = useContext(AdminContext);

    // --- Profile State ---
    const [staffData, setStaffData] = useState(null);
    const [initialStaffData, setInitialStaffData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [newImageFile, setNewImageFile] = useState(null);

    // --- Schedule State ---
    const [scheduleLoading, setScheduleLoading] = useState({
        ruleAdd: false, ruleDelete: null, shiftAdd: false, shiftDelete: null,
        overrideAdd: false, overrideDelete: null
    });
    const [scheduleError, setScheduleError] = useState(null);

    const [currentRule, setCurrentRule] = useState({ frequency: 'weekly', interval: 1, daysOfWeek: [], weekOfMonth: 1, dayOfWeekMonthly: 0, startTime: '09:00', endTime: '17:00', startDate: '', endDate: '' });
    const [currentShift, setCurrentShift] = useState({ startTime: '', endTime: '', roleOverride: null, notes: '' });
    const [currentOverride, setCurrentOverride] = useState({ date: '', isAvailable: false, startTime: '', endTime: '', reason: '', notes: '' });

    const [showAddRuleForm, setShowAddRuleForm] = useState(false);
    const [showAddShiftForm, setShowAddShiftForm] = useState(false);
    const [showAddOverrideForm, setShowAddOverrideForm] = useState(false);


    // --- Fetch Staff Details ---
    useEffect(() => {
        const fetchStaffDetails = async () => {
            setLoading(true);
            setProfileError(null);
            if (!token || !staffId) {
                const msg = "Authentication or Staff ID missing.";
                setProfileError(msg);
                toast.error(msg);
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${backendUrl}/api/staff/${staffId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.success && response.data.staff) {
                    const fetchedStaff = response.data.staff;
                    fetchedStaff.address = fetchedStaff.address || { line1: '', line2: '', city: '', postalCode: '', country: '' };
                    fetchedStaff.recurringAvailability = fetchedStaff.recurringAvailability || [];
                    fetchedStaff.scheduledShifts = fetchedStaff.scheduledShifts || [];
                    fetchedStaff.availabilityOverrides = fetchedStaff.availabilityOverrides || [];
                    setStaffData(fetchedStaff);
                    setInitialStaffData(JSON.parse(JSON.stringify(fetchedStaff)));
                    setProfileError(null);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch staff details');
                }
            } catch (err) {
                console.error("Error fetching staff details:", err);
                const status = err.response?.status;
                let message = err.response?.data?.message || err.message || "Could not load staff data.";
                if (status === 404) message = "Staff member not found.";
                if (status === 401) message = "Unauthorized. Please log in again.";
                if (status === 403) message = "Forbidden. You lack permissions.";
                setProfileError(message);
                toast.error(`Error: ${message}`);
                setStaffData(null); // Ensure no stale data is shown on critical fetch error
            } finally {
                setLoading(false);
            }
        };
        fetchStaffDetails();
    }, [staffId, backendUrl, token]);

    // --- Input Handlers (Profile) ---
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        // Basic handling for different input types if needed
        setStaffData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value // Handle number conversion if necessary
        }));
    };

    const handleToggleChange = () => {
         setStaffData(prev => ({...prev, isActive: !prev.isActive}));
    };

    const handleNestedInputChange = (e, parentKey) => {
        const { name, value } = e.target;
        setStaffData(prev => ({
            ...prev,
            [parentKey]: {
                ...(prev[parentKey] || {}),
                [name]: value
            }
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) { toast.error("Please select an image file."); return; }
            if (file.size > 5 * 1024 * 1024) { toast.error("Image file size should not exceed 5MB."); return; }
            setNewImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(previewUrl);
        } else {
             setNewImageFile(null);
             if (imagePreview) URL.revokeObjectURL(imagePreview);
             setImagePreview(null);
        }
    };

    // Cleanup preview object URL on component unmount
     useEffect(() => {
         return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
     }, [imagePreview]);

    // --- Input Handlers (Schedule Add Forms) ---
    const handleRuleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'daysOfWeek') {
            const dayValue = parseInt(value);
            const currentDays = currentRule.daysOfWeek || [];
            const newDays = checked ? [...currentDays, dayValue] : currentDays.filter(day => day !== dayValue);
            setCurrentRule(prev => ({ ...prev, daysOfWeek: newDays.sort((a,b) => a-b) })); // Keep sorted
        } else {
            setCurrentRule(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 1 : value })); // Ensure interval is at least 1
        }
    };

    const handleShiftInputChange = (e) => {
       const { name, value } = e.target;
       setCurrentShift(prev => ({ ...prev, [name]: value }));
   };

    const handleOverrideInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Handle radio button for isAvailable specifically
        if (name === 'isAvailable') {
             setCurrentOverride(prev => ({ ...prev, isAvailable: value === 'true' }));
        } else {
             setCurrentOverride(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    // --- Helper Functions ---
    const resetAddForms = () => {
        setCurrentRule({ frequency: 'weekly', interval: 1, daysOfWeek: [], weekOfMonth: 1, dayOfWeekMonthly: 0, startTime: '09:00', endTime: '17:00', startDate: '', endDate: '' });
        setCurrentShift({ startTime: '', endTime: '', roleOverride: null, notes: '' });
        setCurrentOverride({ date: '', isAvailable: false, startTime: '', endTime: '', reason: '', notes: '' });
        setShowAddRuleForm(false);
        setShowAddShiftForm(false);
        setShowAddOverrideForm(false);
        setScheduleError(null);
    };

    // --- Schedule Add/Remove API Handlers ---
    const handleAddRule = async () => {
        if (!currentRule.startDate || !currentRule.startTime || !currentRule.endTime) return toast.error("Rule needs start date, start time, and end time.");
        if (currentRule.frequency === 'weekly' && (!currentRule.daysOfWeek || currentRule.daysOfWeek.length === 0)) return toast.error("Please select days for a weekly rule.");
        if (currentRule.startTime >= currentRule.endTime) return toast.error("Rule end time must be after start time.");

        setScheduleLoading(prev => ({ ...prev, ruleAdd: true })); setScheduleError(null);
        try {
            const response = await axios.post(`${backendUrl}/api/staff/${staffId}/recurring-availability`, currentRule, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.data.success && response.data.rule) {
                toast.success("Recurring rule added.");
                setStaffData(prev => ({ ...prev, recurringAvailability: [...(prev.recurringAvailability || []), response.data.rule] }));
                resetAddForms();
            } else { throw new Error(response.data.message || "Failed to add rule."); }
        } catch (err) {
            console.error("Error adding rule:", err);
            const message = err.response?.data?.message || err.message || "Server error adding rule.";
            setScheduleError(message); toast.error(`Error: ${message}`);
        } finally { setScheduleLoading(prev => ({ ...prev, ruleAdd: false })); }
    };

    const handleRemoveRule = async (ruleId) => {
        if (!ruleId || scheduleLoading.ruleDelete === ruleId) return;
        if (!window.confirm("Remove this recurring rule?")) return;
        setScheduleLoading(prev => ({ ...prev, ruleDelete: ruleId })); setScheduleError(null);
        try {
            const response = await axios.delete(`${backendUrl}/api/staff/${staffId}/recurring-availability/${ruleId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.data.success) {
                toast.info("Recurring rule removed.");
                setStaffData(prev => ({ ...prev, recurringAvailability: (prev.recurringAvailability || []).filter(rule => rule._id !== ruleId) }));
            } else { throw new Error(response.data.message || "Failed to remove rule."); }
        } catch (err) {
            console.error("Error removing rule:", err);
            const message = err.response?.data?.message || err.message || "Server error removing rule.";
            setScheduleError(message); toast.error(`Error: ${message}`);
        } finally { setScheduleLoading(prev => ({ ...prev, ruleDelete: null })); }
    };

    const handleAddShift = async () => {
        if (!currentShift.startTime || !currentShift.endTime) return toast.error("Shift needs start & end date/times.");
        if (new Date(currentShift.startTime) >= new Date(currentShift.endTime)) return toast.error("Shift end time must be after start time.");

        setScheduleLoading(prev => ({ ...prev, shiftAdd: true })); setScheduleError(null);
        try {
            const response = await axios.post(`${backendUrl}/api/staff/${staffId}/shifts`, currentShift, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.data.success && response.data.shift) {
                toast.success("Scheduled shift added.");
                setStaffData(prev => ({ ...prev, scheduledShifts: [...(prev.scheduledShifts || []), response.data.shift].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) }));
                resetAddForms();
            } else { throw new Error(response.data.message || "Failed to add shift."); }
        } catch (err) {
            console.error("Error adding shift:", err);
            const message = err.response?.data?.message || err.message || "Server error adding shift.";
            setScheduleError(message); toast.error(`Error: ${message}`);
        } finally { setScheduleLoading(prev => ({ ...prev, shiftAdd: false })); }
    };

    const handleRemoveShift = async (shiftId) => {
        if (!shiftId || scheduleLoading.shiftDelete === shiftId) return;
        if (!window.confirm("Remove this shift?")) return;
        setScheduleLoading(prev => ({ ...prev, shiftDelete: shiftId })); setScheduleError(null);
        try {
            const response = await axios.delete(`${backendUrl}/api/staff/${staffId}/shifts/${shiftId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.data.success) {
                toast.info("Scheduled shift removed.");
                setStaffData(prev => ({ ...prev, scheduledShifts: (prev.scheduledShifts || []).filter(shift => shift._id !== shiftId) }));
            } else { throw new Error(response.data.message || "Failed to remove shift."); }
        } catch (err) {
            console.error("Error removing shift:", err);
            const message = err.response?.data?.message || err.message || "Server error removing shift.";
            setScheduleError(message); toast.error(`Error: ${message}`);
        } finally { setScheduleLoading(prev => ({ ...prev, shiftDelete: null })); }
    };

    const handleAddOverride = async () => {
        if (!currentOverride.date || !currentOverride.reason) return toast.error("Override needs a date and reason.");
        if (currentOverride.isAvailable && currentOverride.startTime && currentOverride.endTime && currentOverride.startTime >= currentOverride.endTime) return toast.error("Override end time must be after start time.");

        setScheduleLoading(prev => ({ ...prev, overrideAdd: true })); setScheduleError(null);
        try {
            const response = await axios.post(`${backendUrl}/api/staff/${staffId}/overrides`, currentOverride, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.data.success && response.data.override) {
                toast.success("Availability override added.");
                setStaffData(prev => ({ ...prev, availabilityOverrides: [...(prev.availabilityOverrides || []), response.data.override].sort((a, b) => new Date(a.date) - new Date(b.date)) }));
                resetAddForms();
            } else { throw new Error(response.data.message || "Failed to add override."); }
        } catch (err) {
            console.error("Error adding override:", err);
            const message = err.response?.data?.message || err.message || "Server error adding override.";
            setScheduleError(message); toast.error(`Error: ${message}`);
        } finally { setScheduleLoading(prev => ({ ...prev, overrideAdd: false })); }
    };

    const handleRemoveOverride = async (overrideId) => {
        if (!overrideId || scheduleLoading.overrideDelete === overrideId) return;
        if (!window.confirm("Remove this override?")) return;
        setScheduleLoading(prev => ({ ...prev, overrideDelete: overrideId })); setScheduleError(null);
        try {
            const response = await axios.delete(`${backendUrl}/api/staff/${staffId}/overrides/${overrideId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.data.success) {
                toast.info("Availability override removed.");
                setStaffData(prev => ({ ...prev, availabilityOverrides: (prev.availabilityOverrides || []).filter(ov => ov._id !== overrideId) }));
            } else { throw new Error(response.data.message || "Failed to remove override."); }
        } catch (err) {
            console.error("Error removing override:", err);
            const message = err.response?.data?.message || err.message || "Server error removing override.";
            setScheduleError(message); toast.error(`Error: ${message}`);
        } finally { setScheduleLoading(prev => ({ ...prev, overrideDelete: null })); }
    };

    // --- Profile Update Submission ---
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!staffData || updatingProfile || !token) return;
        setUpdatingProfile(true); setProfileError(null);

        const updatePayload = {
            name: staffData.name, role: staffData.role, phone: staffData.phone,
            address: staffData.address, salary: staffData.salary, isActive: staffData.isActive,
        };
        let dataToSend; let headers = { 'Authorization': `Bearer ${token}` };

        if (newImageFile) {
            dataToSend = new FormData();
            Object.keys(updatePayload).forEach(key => {
                if (key === 'address' && updatePayload[key] !== null && typeof updatePayload[key] === 'object') {
                    dataToSend.append(key, JSON.stringify(updatePayload[key]));
                } else if (updatePayload[key] !== null && updatePayload[key] !== undefined) {
                    dataToSend.append(key, updatePayload[key]);
                }
            });
            dataToSend.append('image', newImageFile, newImageFile.name);
            headers['Content-Type'] = 'multipart/form-data'; // Ensure correct content type for FormData
        } else {
            dataToSend = updatePayload; headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await axios.put(`${backendUrl}/api/staff/${staffId}`, dataToSend, { headers });
            if (response.data.success) {
                toast.success('Staff profile updated successfully!');
                setNewImageFile(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null);

                const updatedStaffFromServer = response.data.staff;
                updatedStaffFromServer.address = updatedStaffFromServer.address || { line1: '', line2: '', city: '', postalCode: '', country: '' };
                // Preserve local schedule data, assuming PUT doesn't return it
                updatedStaffFromServer.recurringAvailability = staffData.recurringAvailability;
                updatedStaffFromServer.scheduledShifts = staffData.scheduledShifts;
                updatedStaffFromServer.availabilityOverrides = staffData.availabilityOverrides;

                setStaffData(updatedStaffFromServer);
                setInitialStaffData(JSON.parse(JSON.stringify(updatedStaffFromServer))); // Update baseline
                // navigate('/admin/staff'); // Optional: Navigate away after save
            } else { throw new Error(response.data.message || 'Update failed on server.'); }
        } catch (err) {
            console.error("Error updating staff profile:", err);
            const status = err.response?.status;
            let message = err.response?.data?.message || err.message || "An error occurred during the profile update.";
            if (status === 400) message = `Update failed: Invalid data. ${err.response?.data?.message || ''}`;
            setProfileError(message); toast.error(`Profile Update failed: ${message}`);
        } finally { setUpdatingProfile(false); }
    };

    // --- Navigation to ID Card Page ---
    const handleViewIdCard = () => {
      if (staffId) {
        // Navigate to the new route for the ID card page
        navigate(`/admin/staff/${staffId}/id-card`);
      } else {
        toast.error("Staff ID not available to view ID card.");
      }
    };


    // --- Render Logic ---
    if (loading) {
         // Basic loading indicator or skeleton
         return (
            <div className="container mx-auto px-4 py-8 text-center">
                <div className="flex justify-center items-center">
                   {/* Simple Spinner */}
                   <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <p className="text-xl text-gray-700 dark:text-gray-300">Loading staff data...</p>
                </div>
            </div>
         );
    }

    if (!staffData && profileError) {
         return (
             <div className="container mx-auto px-4 py-8 text-center">
                 <h1 className="text-2xl font-semibold mb-4 text-red-600 dark:text-red-400">Error Loading Staff</h1>
                 <p className="text-red-500 dark:text-red-400 mb-4">{profileError}</p>
                 <Link to="/admin/staff" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                     <ArrowLeft size={16} className="mr-2" /> Back to Staff List
                 </Link>
             </div>
         );
     }
     // Fallback message if staffData is null for some reason not covered by specific error
     if (!staffData) return <div className="text-center py-10 text-gray-500">Staff data unavailable.</div>;


    const currentImageSrc = imagePreview || staffData?.image || defaultProfilePic;
    const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
    const formatTime = (timeStr) => timeStr || 'N/A';

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            {/* Added justify-between to spread items out */}
            <div className="flex items-center justify-between mb-6">
                 <div className='flex items-center'>
                     <button
                        onClick={() => navigate(-1)} // Go back to previous page
                        className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mr-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-150 ease-in-out"
                        title="Go Back" aria-label="Go Back" >
                         <ArrowLeft size={20} />
                     </button>
                     <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                         Edit Staff: <span className="font-medium">{initialStaffData?.name || '...'}</span>
                     </h1>
                 </div>
                 {/* --- View ID Card Button --- */}
                 {/* Added the new button here */}
                 <button
                    onClick={handleViewIdCard}
                    className="btn btn-secondary flex items-center" // Using secondary button style, added flex items-center for icon
                    title="View Staff ID Card"
                    disabled={!staffId} // Disable if staffId is not available
                 >
                   <CreditCard size={16} className="mr-1" /> {/* Added icon */}
                   View ID Card
                 </button>
             </div>

            {/* --- Profile Edit Form --- */}
            <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700 mb-10">
                 {profileError && (
                     <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
                         <p><span className="font-bold">Profile Update Error:</span> {profileError}</p>
                     </div>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                     {/* Column 1: Image & Read-only Info */}
                     <div className="md:col-span-1 space-y-6">
                         <div className="flex flex-col items-center">
                             <img src={currentImageSrc} alt={staffData.name || 'Staff Profile'} className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-md mb-4 bg-gray-100 dark:bg-gray-700" onError={(e) => { if (e.target.src !== defaultProfilePic) { e.target.onerror = null; e.target.src = defaultProfilePic; } }} />
                             <label htmlFor="imageUpload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                 <ImageIcon size={16} className="mr-2" /> Change Image
                             </label>
                             <input type="file" id="imageUpload" name="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                             {imagePreview && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Previewing new image.</p>}
                         </div>
                         <div className="space-y-4">
                             <div className="form-group"><label className="form-label-icon"><Mail size={14} className="text-gray-500 dark:text-gray-400"/> Email (Read-only)</label><p className="form-static-text">{staffData.email}</p></div>
                             <div className="form-group"><label className="form-label-icon"><Hash size={14} className="text-gray-500 dark:text-gray-400"/> VID (Read-only)</label><p className="form-static-text">{staffData.vid}</p></div>
                         </div>
                     </div>
                     {/* Columns 2 & 3: Editable Details */}
                     <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                         <div className="form-group sm:col-span-2"><label htmlFor="name" className="form-label-icon"><User size={14}/> Name *</label><input type="text" id="name" name="name" value={staffData.name || ''} onChange={handleInputChange} className="form-input" required aria-required="true" /></div>
                         <div className="form-group"><label htmlFor="role" className="form-label-icon"><Briefcase size={14}/> Role *</label>
                             <select id="role" name="role" value={staffData.role || ''} onChange={handleInputChange} className="form-input form-select" required aria-required="true">
                                 <option value="" disabled>Select Role</option>
                                 {STAFF_ROLES.map(roleOption => (<option key={roleOption} value={roleOption}>{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</option>))}
                             </select>
                         </div>
                         <div className="form-group"><label htmlFor="phone" className="form-label-icon"><Phone size={14}/> Phone</label><input type="tel" id="phone" name="phone" placeholder="e.g., +1 555-123-4567" value={staffData.phone || ''} onChange={handleInputChange} className="form-input" /></div>
                         <div className="form-group"><label htmlFor="salary" className="form-label-icon"><DollarSign size={14}/> Salary *</label><input type="number" id="salary" name="salary" value={staffData.salary || ''} onChange={handleInputChange} className="form-input" step="0.01" min="0" required aria-required="true" placeholder="e.g., 50000.00" /></div>
                         <div className="form-group flex items-center pt-2 sm:pt-4"><label className="form-label mr-4 mb-0">Status:</label>
                             <button type="button" onClick={handleToggleChange} className={`cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none rounded-full p-1 ${staffData.isActive ? 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'}`} title={staffData.isActive ? 'Deactivate Staff' : 'Activate Staff'} aria-pressed={staffData.isActive}>
                                 {staffData.isActive ? <FaToggleOn size={28}/> : <FaToggleOff size={28}/>}
                             </button>
                             <span className={`ml-2 text-sm font-medium ${staffData.isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400'}`}>{staffData.isActive ? 'Active' : 'Inactive'}</span>
                         </div>
                         <div className="sm:col-span-2 mt-4 border-t border-gray-200 dark:border-gray-700 pt-6"><label className="form-label-icon mb-2 block"><MapPin size={14}/> Address</label>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                 <div className="form-group sm:col-span-2"><label htmlFor="address-line1" className="sr-only">Address Line 1</label><input type="text" id="address-line1" name="line1" placeholder="Address Line 1" value={staffData.address?.line1 || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="form-input" /></div>
                                 <div className="form-group sm:col-span-2"><label htmlFor="address-line2" className="sr-only">Address Line 2</label><input type="text" id="address-line2" name="line2" placeholder="Address Line 2 (Optional)" value={staffData.address?.line2 || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="form-input" /></div>
                                 <div className="form-group"><label htmlFor="address-city" className="sr-only">City</label><input type="text" id="address-city" name="city" placeholder="City" value={staffData.address?.city || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="form-input" /></div>
                                 <div className="form-group"><label htmlFor="address-postalCode" className="sr-only">Postal Code</label><input type="text" id="address-postalCode" name="postalCode" placeholder="Postal Code" value={staffData.address?.postalCode || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="form-input" /></div>
                                 <div className="form-group sm:col-span-2"><label htmlFor="address-country" className="sr-only">Country</label><input type="text" id="address-country" name="country" placeholder="Country" value={staffData.address?.country || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="form-input" /></div>
                             </div>
                         </div>
                     </div>
                 </div>
                 {/* Profile Action Buttons Footer */}
                 <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center space-x-3">
                     <button type="button" onClick={() => navigate('/admin/staff')} className="btn btn-secondary" disabled={updatingProfile}><X size={16} className="mr-1" /> Cancel</button> {/* Changed text */}
                     <button type="submit" className="btn btn-primary" disabled={updatingProfile || loading}><Save size={16} className="mr-1" /> {updatingProfile ? 'Saving Profile...' : 'Save Changes'}</button> {/* Changed text */}
                 </div>
            </form>

            {/* --- Schedule Management Section --- */}
            <fieldset className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700 mt-10">
                <legend className="text-xl font-semibold text-gray-900 dark:text-white px-2 mb-4">Schedule Management</legend>
                 {scheduleError && (
                     <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 mb-4 rounded text-sm" role="alert">
                         <p><span className="font-bold">Schedule Update Note:</span> {scheduleError}</p>
                     </div>
                 )}
                 {/* Recurring Availability */}
                 <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center"><Calendar size={18} className="mr-2 text-indigo-600 dark:text-indigo-400" /> Recurring Availability</h4>
                    <div className="space-y-2 mb-4 pl-1">
                        {(staffData.recurringAvailability || []).length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No recurring rules defined.</p>}
                        {(staffData.recurringAvailability || []).map((rule) => (
                            <div key={rule._id} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700/50 text-sm">
                                <span className='text-gray-700 dark:text-gray-300'>Every {rule.interval > 1 ? `${rule.interval} ` : ''}{rule.frequency} on {rule.frequency === 'weekly' ? (rule.daysOfWeek || []).map(d => DAYS_OF_WEEK[d].substring(0,3)).join(', ') : `${WEEKS_OF_MONTH.find(w => w.value === rule.weekOfMonth)?.label || '?'} ${DAYS_OF_WEEK[rule.dayOfWeekMonthly]}`} ({formatTime(rule.startTime)} - {formatTime(rule.endTime)}) [{formatDate(rule.startDate)} - {rule.endDate ? formatDate(rule.endDate) : 'Ongoing'}]</span>
                                <button type="button" onClick={() => handleRemoveRule(rule._id)} disabled={scheduleLoading.ruleDelete === rule._id} className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Remove Rule"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                    {!showAddRuleForm && (<button type="button" onClick={() => { resetAddForms(); setShowAddRuleForm(true); }} className="btn btn-secondary btn-sm"><PlusCircle size={16} className="mr-1" /> Add Recurring Rule</button>)}
                    {showAddRuleForm && (
                        <div className="mt-4 p-4 border border-indigo-200 dark:border-indigo-700 rounded-md bg-indigo-50/50 dark:bg-gray-700/30 space-y-3">
                            <h5 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">New Rule Details</h5>
                             <div className="grid grid-cols-2 gap-3">
                                 <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Frequency</label><select name="frequency" value={currentRule.frequency} onChange={handleRuleInputChange} className={getSmallInputClasses()}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                                 <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Interval (Every X)</label><input type="number" name="interval" value={currentRule.interval} min="1" onChange={handleRuleInputChange} className={getSmallInputClasses()} /></div>
                             </div>
                             {currentRule.frequency === 'weekly' && (
                                <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Days of Week</label><div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{DAYS_OF_WEEK.map((day, index) => (<label key={index} className="flex items-center space-x-1.5 text-xs dark:text-gray-300"><input type="checkbox" name="daysOfWeek" value={index} checked={currentRule.daysOfWeek?.includes(index)} onChange={handleRuleInputChange} className="form-checkbox h-3.5 w-3.5 text-indigo-600 dark:accent-indigo-400"/><span>{day.substring(0,3)}</span></label>))}</div></div>
                             )}
                             {currentRule.frequency === 'monthly' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Week of Month</label><select name="weekOfMonth" value={currentRule.weekOfMonth} onChange={handleRuleInputChange} className={getSmallInputClasses()}>{WEEKS_OF_MONTH.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}</select></div>
                                    <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Day of Week</label><select name="dayOfWeekMonthly" value={currentRule.dayOfWeekMonthly} onChange={handleRuleInputChange} className={getSmallInputClasses()}>{DAYS_OF_WEEK.map((day, index) => <option key={index} value={index}>{day}</option>)}</select></div>
                                </div>
                             )}
                             <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Start Time</label><input type="time" name="startTime" value={currentRule.startTime} onChange={handleRuleInputChange} className={getSmallInputClasses()} /></div>
                                <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">End Time</label><input type="time" name="endTime" value={currentRule.endTime} onChange={handleRuleInputChange} className={getSmallInputClasses()} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Rule Start Date *</label><input type="date" name="startDate" value={currentRule.startDate} onChange={handleRuleInputChange} className={getSmallInputClasses()} required/></div>
                                <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Rule End Date (Optional)</label><input type="date" name="endDate" value={currentRule.endDate} onChange={handleRuleInputChange} className={getSmallInputClasses()} /></div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={resetAddForms} className="btn btn-secondary btn-sm" disabled={scheduleLoading.ruleAdd}>Cancel</button><button type="button" onClick={handleAddRule} className="btn btn-primary btn-sm" disabled={scheduleLoading.ruleAdd}>Add Rule</button></div>
                        </div>
                    )}
                </div>
                 {/* Scheduled Shifts */}
                 <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center"><Clock size={18} className="mr-2 text-teal-600 dark:text-teal-400" /> Specific Shifts</h4>
                    <div className="space-y-2 mb-4 pl-1">
                          {(staffData.scheduledShifts || []).length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No specific shifts scheduled.</p>}
                          {(staffData.scheduledShifts || []).map((shift) => (
                              <div key={shift._id} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700/50 text-sm">
                                  <span className='text-gray-700 dark:text-gray-300'>{formatDateTime(shift.startTime)} - {formatDateTime(shift.endTime)}{shift.roleOverride && <span className="italic text-xs text-gray-500 dark:text-gray-400"> (as {shift.roleOverride})</span>}{shift.notes && <span className="block text-xs text-gray-500 dark:text-gray-400 pl-2">- {shift.notes}</span>}</span>
                                  <button type="button" onClick={() => handleRemoveShift(shift._id)} disabled={scheduleLoading.shiftDelete === shift._id} className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Remove Shift"><Trash2 size={16} /></button>
                              </div>
                          ))}
                    </div>
                    {!showAddShiftForm && (<button type="button" onClick={() => { resetAddForms(); setShowAddShiftForm(true); }} className="btn btn-secondary btn-sm"><PlusCircle size={16} className="mr-1" /> Add Specific Shift</button>)}
                    {showAddShiftForm && (
                        <div className="mt-4 p-4 border border-teal-200 dark:border-teal-700 rounded-md bg-teal-50/50 dark:bg-gray-700/30 space-y-3">
                            <h5 className="text-sm font-medium text-teal-800 dark:text-teal-300">New Shift Details</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Start Date & Time *</label><input type="datetime-local" name="startTime" value={currentShift.startTime} onChange={handleShiftInputChange} className={getSmallInputClasses()} required /></div>
                                <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">End Date & Time *</label><input type="datetime-local" name="endTime" value={currentShift.endTime} onChange={handleShiftInputChange} className={getSmallInputClasses()} required /></div>
                            </div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Role Override (Optional)</label>
                                <select name="roleOverride" value={currentShift.roleOverride || ''} onChange={handleShiftInputChange} className={getSmallInputClasses()}>
                                    <option value="">Same as Staff Role</option>
                                    {STAFF_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Notes</label><input type="text" name="notes" value={currentShift.notes} onChange={handleShiftInputChange} placeholder="Optional shift notes" className={getSmallInputClasses()} /></div>
                            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={resetAddForms} className="btn btn-secondary btn-sm" disabled={scheduleLoading.shiftAdd}>Cancel</button><button type="button" onClick={handleAddShift} className="btn btn-primary btn-sm" disabled={scheduleLoading.shiftAdd}>Add Shift</button></div>
                        </div>
                    )}
                 </div>
                 {/* Availability Overrides */}
                 <div>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center"><Calendar size={18} className="mr-2 text-orange-600 dark:text-orange-400" /> Availability Overrides</h4>
                    <div className="space-y-2 mb-4 pl-1">
                          {(staffData.availabilityOverrides || []).length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No overrides defined.</p>}
                          {(staffData.availabilityOverrides || []).map((ov) => (
                              <div key={ov._id} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700/50 text-sm">
                                  <span className={`text-gray-700 dark:text-gray-300 ${!ov.isAvailable ? 'line-through' : ''}`}>{formatDate(ov.date)}: {ov.isAvailable ? 'Available' : 'Unavailable'}{ov.isAvailable && (ov.startTime || ov.endTime) && ` (${formatTime(ov.startTime)} - ${formatTime(ov.endTime)})`}<span className="italic text-xs text-gray-500 dark:text-gray-400"> ({ov.reason})</span>{ov.notes && <span className="block text-xs text-gray-500 dark:text-gray-400 pl-2">- {ov.notes}</span>}</span>
                                  <button type="button" onClick={() => handleRemoveOverride(ov._id)} disabled={scheduleLoading.overrideDelete === ov._id} className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Remove Override"><Trash2 size={16} /></button>
                              </div>
                          ))}
                    </div>
                    {!showAddOverrideForm && (<button type="button" onClick={() => { resetAddForms(); setShowAddOverrideForm(true); }} className="btn btn-secondary btn-sm"><PlusCircle size={16} className="mr-1" /> Add Override/Exception</button>)}
                    {showAddOverrideForm && (
                        <div className="mt-4 p-4 border border-orange-200 dark:border-orange-700 rounded-md bg-orange-50/50 dark:bg-gray-700/30 space-y-3">
                             <h5 className="text-sm font-medium text-orange-800 dark:text-orange-300">New Override Details</h5>
                             <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Date *</label><input type="date" name="date" value={currentOverride.date} onChange={handleOverrideInputChange} className={getSmallInputClasses()} required /></div>
                             <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Status *</label>
                                <div className="flex items-center space-x-4">
                                     <label className="flex items-center space-x-1.5 text-xs dark:text-gray-300"><input type="radio" name="isAvailable" value="false" checked={!currentOverride.isAvailable} onChange={handleOverrideInputChange} className="form-radio h-3.5 w-3.5 text-indigo-600 dark:accent-indigo-400"/><span>Unavailable</span></label>
                                     <label className="flex items-center space-x-1.5 text-xs dark:text-gray-300"><input type="radio" name="isAvailable" value="true" checked={currentOverride.isAvailable} onChange={handleOverrideInputChange} className="form-radio h-3.5 w-3.5 text-indigo-600 dark:accent-indigo-400"/><span>Specifically Available</span></label>
                                </div>
                             </div>
                             {currentOverride.isAvailable && (
                                <div className="grid grid-cols-2 gap-3 border-t border-orange-100 dark:border-gray-600 pt-3">
                                    <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Available Start Time</label><input type="time" name="startTime" value={currentOverride.startTime} onChange={handleOverrideInputChange} className={getSmallInputClasses()} /></div>
                                    <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Available End Time</label><input type="time" name="endTime" value={currentOverride.endTime} onChange={handleOverrideInputChange} className={getSmallInputClasses()} /></div>
                                </div>
                             )}
                             <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Reason *</label><input type="text" name="reason" value={currentOverride.reason} onChange={handleOverrideInputChange} placeholder="e.g., Public Holiday, Meeting" className={getSmallInputClasses()} required /></div>
                             <div><label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">Notes</label><input type="text" name="notes" value={currentOverride.notes} onChange={handleOverrideInputChange} placeholder="Optional override notes" className={getSmallInputClasses()} /></div>
                             <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={resetAddForms} className="btn btn-secondary btn-sm" disabled={scheduleLoading.overrideAdd}>Cancel</button><button type="button" onClick={handleAddOverride} className="btn btn-primary btn-sm" disabled={scheduleLoading.overrideAdd}>Add Override</button></div>
                        </div>
                    )}
                 </div>
            </fieldset>

            {/* Reusable CSS Classes (using Tailwind utility classes directly is preferred) */}
             <style jsx>{`
                 .form-group { /* Applied via gap */ }
                 .form-label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; color: #374151; /* text-gray-700 */ }
                 .dark .form-label { color: #d1d5db; /* dark:text-gray-300 */ }
                 .form-label-icon { display: inline-flex; align-items: center; gap: 0.375rem; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; color: #4b5563; /* text-gray-600 */ }
                 .dark .form-label-icon { color: #9ca3af; /* dark:text-gray-400 */ }
                 .form-input { display: block; width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; color: #1f2937; background-color: #fff; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.05); transition: border-color 0.15s, box-shadow 0.15s; }
                 .dark .form-input { background-color: #374151; border-color: #4b5563; color: #e5e7eb; }
                 .form-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3); }
                 .dark .form-input:focus { border-color: #818cf8; box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.4); }
                 .form-select { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1.5em 1.5em; padding-right: 2.5rem; appearance: none; }
                 .dark .form-select { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); }
                 .form-static-text { padding-top: 0.125rem; font-size: 0.875rem; color: #4b5563; word-break: break-all; }
                 .dark .form-static-text { color: #9ca3af; }
                 .form-checkbox { border-radius: 0.25rem; border-color: #d1d5db; } .dark .form-checkbox { border-color: #6b7280; background-color: #4b5563;}
                 .form-radio { border-radius: 50%; border-color: #d1d5db; } .dark .form-radio { border-color: #6b7280; background-color: #4b5563;}

                 .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; font-size: 0.875rem; transition: background-color 0.2s, opacity 0.2s; cursor: pointer; border: 1px solid transparent; line-height: 1.25rem; }
                 .btn:disabled { opacity: 0.6; cursor: not-allowed; }
                 .btn-primary { background-color: #4f46e5; color: white; }
                 .btn-primary:hover:not(:disabled) { background-color: #4338ca; }
                 .btn-secondary { background-color: #f3f4f6; color: #374151; border-color: #d1d5db; }
                 .dark .btn-secondary { background-color: #4b5563; color: #e5e7eb; border-color: #6b7280; }
                 .btn-secondary:hover:not(:disabled) { background-color: #e5e7eb; }
                 .dark .btn-secondary:hover:not(:disabled) { background-color: #6b7280; }
                 .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; line-height: 1rem; }
             `}</style>
        </div>
    );
};

export default EditStaffPage;