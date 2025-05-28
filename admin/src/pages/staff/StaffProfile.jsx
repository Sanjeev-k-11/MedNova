// src/pages/StaffProfile.jsx (or wherever your StaffProfile is located)
import React, { useState, useContext, useEffect, Fragment } from "react";
import { StaffContext } from "../../context/StaffContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import {
  Loader2,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Briefcase,
  Hash,
  User,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  UserCog,
} from "lucide-react";
import { Dialog, Transition } from '@headlessui/react';

// Import the new StaffIdCard component
import StaffIdCard from './StaffIdCard'; // Adjust path as needed

const StaffProfile = () => {
  const {
    staffToken,
    profileData: initialProfileData,
    setProfileData,
    getProfileData,
    backendUrl,
  } = useContext(StaffContext);

  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editableProfileData, setEditableProfileData] = useState(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (initialProfileData) {
      setEditableProfileData(JSON.parse(JSON.stringify(initialProfileData)));
      setLoading(false);
    } else {
       setEditableProfileData(null);
    }
  }, [initialProfileData]);

  useEffect(() => {
    if (staffToken && !initialProfileData) {
      setLoading(true);
      getProfileData()
        .catch((err) => {
          console.error("Failed to load staff profile initially:", err);
          toast.error("Could not load profile data. Please refresh.");
        });
    } else if (!staffToken) {
        setLoading(false);
    }
  }, [staffToken, getProfileData, initialProfileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (e, parentKey) => {
    const { name, value } = e.target;
    setEditableProfileData((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [name]: value,
      },
    }));
  };

  const handleSaveChanges = async () => {
    if (isUpdating || !editableProfileData) return;
    setIsUpdating(true);

    const updatePayload = {
      phone: editableProfileData.phone,
      address: editableProfileData.address,
    };

    console.log("Updating Staff Profile with Payload:", updatePayload);

    try {
      const { data } = await axios.put(
        `${backendUrl}/api/staff/update-profile`,
        updatePayload,
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );

      if (data.success) {
        toast.success(data.message || "Profile updated successfully");
        const updatedProfile = data.staff
          ? { ...initialProfileData, ...data.staff }
          : { ...initialProfileData, ...updatePayload };

        setProfileData(updatedProfile);
        setEditableProfileData(JSON.parse(JSON.stringify(updatedProfile)));
        setIsEdit(false);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while updating profile.";
      toast.error(`Profile update failed: ${errorMessage}`);
      console.error("Profile Update Error:", error.response || error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEdit(false);
    if (initialProfileData) {
        setEditableProfileData(JSON.parse(JSON.stringify(initialProfileData)));
    }
  };

  const handleEditToggle = () => {
    if (isEdit) {
      handleCancelEdit();
    } else {
      setIsEdit(true);
      if (initialProfileData) {
          setEditableProfileData(JSON.parse(JSON.stringify(initialProfileData)));
      }
    }
  };

   const openPasswordModal = () => setIsPasswordModalOpen(true);
   const closePasswordModal = () => {
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        if (isChangingPassword) setIsChangingPassword(false);
   }

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isChangingPassword) return;

    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error("Please fill in all password fields."); return; }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters long."); return; }
    if (newPassword !== confirmPassword) { toast.error("New password and confirm password do not match."); return; }
    if (currentPassword === newPassword) { toast.error("New password cannot be the same as the current password."); return; }

    setIsChangingPassword(true);

    try {
      const payload = { currentPassword, newPassword };
      const { data } = await axios.put(
        `${backendUrl}/api/staff/me/password`,
        payload,
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );

      if (data.success) {
        toast.success(data.message || "Password changed successfully!");
        closePasswordModal();
      } else {
        toast.error(data.message || "Failed to change password.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred.";
      toast.error(`Password change failed: ${errorMessage}`);
      console.error("Password Change Error:", error.response || error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900">
        <Loader2 className="h-12 w-12 animate-spin text-sky-600" />
        <p className="ml-4 text-gray-600 dark:text-gray-300 text-lg">Loading Your Profile...</p>
      </div>
    );
  }

  const displayData = isEdit ? editableProfileData : initialProfileData;

  if (!displayData) {
     return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <p className="text-xl font-semibold text-red-700 dark:text-red-300">Profile Unavailable</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">We couldn't retrieve your profile data at this moment. Please ensure you are logged in and try refreshing the page.</p>
        {!staffToken && <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">(You appear to be logged out)</p>}
      </div>
    );
  }


  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4 sm:p-6 md:p-8 transition-colors duration-300">
      {/* Outer container to hold both the main profile card and the ID card */}
      {/* Stacks vertically on small screens, uses flex horizontally on medium+ screens */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto"> {/* Adjusted max-w */}

         {/* --- Main Profile Card (Existing Code) --- */}
         {/* Use flex-grow to make it take up available space */}
         <div className={`flex-grow w-full bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isEdit ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-gray-800' : ''}`}>

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
               <div className="relative flex-shrink-0 group">
                    <img
                        src={displayData.image || assets.default_profile}
                        alt={`${displayData.name}'s profile picture`}
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-600 transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => e.target.src = assets.default_profile}
                    />
                </div>
              <div className="flex-grow text-center sm:text-left mt-2 sm:mt-0">
                {isEdit ? (
                   // Still allow seeing the name, even if not editable via this form
                  <input
                    type="text"
                    name="name"
                    value={editableProfileData.name || ''}
                    readOnly // Make it readOnly as name is not updated here
                    className="text-2xl md:text-3xl font-bold border-b-2 border-sky-300 dark:border-sky-600 focus:outline-none bg-transparent w-full sm:w-auto dark:text-white pb-1 mb-2 transition-colors duration-300 cursor-not-allowed" // Added cursor style
                    placeholder="Full Name"
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{displayData.name}</h1>
                )}
                <div className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center justify-center sm:justify-start gap-1.5"><Briefcase size={14} className="text-gray-500"/> Role: <span className="font-medium text-gray-700 dark:text-gray-300">{displayData.role || 'N/A'}</span></p>
                    <p className="flex items-center justify-center sm:justify-start gap-1.5"><Hash size={14} className="text-gray-500"/> VID: <span className="font-medium text-gray-700 dark:text-gray-300">{displayData.vid || 'N/A'}</span></p>
                    <p className={`flex items-center justify-center sm:justify-start gap-1.5 font-semibold ${displayData.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {displayData.isActive ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                        Status: {displayData.isActive ? 'Active' : 'Inactive'}
                    </p>
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Contact Information Card */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700">
                <h3 className="profile-section-header flex items-center gap-2 border-b-0 pb-0 mb-3"><Mail size={18} /> Contact</h3>
                <div className="space-y-4">
                  {/* Email (Not Editable) */}
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <span className="text-sm text-gray-800 dark:text-gray-200 break-all">{displayData.email || 'N/A'}</span>
                    </div>
                  </div>
                  {/* Phone (Editable) */}
                  <div className="flex items-start gap-3">
                     <Phone size={16} className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0"/>
                     <div className="flex-grow">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        {isEdit ? (
                        <input type="tel" name="phone" value={editableProfileData.phone || ''} onChange={handleInputChange} className="profile-input flex-grow text-sm p-1" placeholder="Phone Number" />
                        ) : (
                        <span className="text-sm text-gray-800 dark:text-gray-200">{displayData.phone || 'Not provided'}</span>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Card (Editable) */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700">
                <h3 className="profile-section-header flex items-center gap-2 border-b-0 pb-0 mb-3"><MapPin size={18} /> Address</h3>
                <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0"/>
                    <div className="flex-grow">
                        {isEdit ? (
                        <div className="space-y-2">
                            <input type="text" name="line1" value={editableProfileData.address?.line1 || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="profile-input w-full text-sm p-1" placeholder="Address Line 1" />
                            <input type="text" name="line2" value={editableProfileData.address?.line2 || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="profile-input w-full text-sm p-1" placeholder="Line 2 (Optional)" />
                            <div className="grid grid-cols-2 gap-2">
                               <input type="text" name="city" value={editableProfileData.address?.city || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="profile-input w-full text-sm p-1" placeholder="City" />
                               <input type="text" name="postalCode" value={editableProfileData.address?.postalCode || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="profile-input w-full text-sm p-1" placeholder="Postal Code" />
                            </div>
                            <input type="text" name="country" value={editableProfileData.address?.country || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="profile-input w-full text-sm p-1" placeholder="Country" />
                        </div>
                        ) : (
                        <span className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                            {displayData.address?.line1 || ''}
                            {displayData.address?.line1 && <br/>}
                            {displayData.address?.line2 || ''}
                            {displayData.address?.line2 && <br/>}
                            {displayData.address?.city && `${displayData.address.city}, `}
                            {displayData.address?.postalCode || ''}
                            {(displayData.address?.city || displayData.address?.postalCode) && <br/>}
                            {displayData.address?.country || ''}
                            {(!displayData.address?.line1 && !displayData.address?.line2 && !displayData.address?.city && !displayData.address?.postalCode && !displayData.address?.country) && 'No address provided.'}
                        </span>
                        )}
                    </div>
                </div>
              </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-between items-center">
                {/* Profile Edit/Save Buttons */}
                <div className="flex gap-3 w-full sm:w-auto">
                     <button onClick={handleEditToggle} className={`btn ${isEdit ? 'btn-secondary-outline' : 'btn-primary'} w-full sm:w-auto`} disabled={isUpdating || isPasswordModalOpen}>
                        {isEdit ? <><X size={16} /> Cancel Edit</> : <><Edit size={16} /> Edit Profile</>}
                    </button>
                    {isEdit && (
                        <button onClick={handleSaveChanges} disabled={isUpdating || isPasswordModalOpen} className="btn btn-success w-full sm:w-auto">
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>

                {/* Change Password Button */}
                <button
                    onClick={openPasswordModal}
                    className="btn btn-danger w-full sm:w-auto mt-3 sm:mt-0"
                    disabled={isEdit} // Disable if profile is being edited
                >
                    <KeyRound size={16} /> Change Password
                </button>
            </div>
             {isEdit && <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center sm:text-right">Save or cancel profile edits to change password.</p>}
         </div> {/* End of Main Profile Card */}

         {/* --- Staff ID Card (New Component) --- */}
         {/* Container for the ID card, fixed width but allows wrapping */}
         {/* Add mt-8 for spacing on small screens before md:flex makes it side-by-side */}
         <div className="w-full md:w-auto flex-shrink-0 mt-8 md:mt-0">
             <StaffIdCard staffData={displayData} /> {/* Pass the displayData */}
         </div>

      </div> {/* End of Outer Container */}


      {/* --- Change Password Modal --- */}
      {/* ... (Keep your existing modal code here) ... */}
       <Transition appear show={isPasswordModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closePasswordModal}>
          <Transition.Child
            as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <Lock size={20}/> Change Your Password
                  </Dialog.Title>
                  <button onClick={closePasswordModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors" aria-label="Close password modal">
                    <X size={20} />
                  </button>
                  <form onSubmit={handleChangePasswordSubmit} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="currentPasswordModal" className="modal-label">Current Password</label>
                        <div className="relative mt-1">
                            <Lock size={16} className="password-icon"/>
                            <input type={showCurrentPassword ? 'text' : 'password'} id="currentPasswordModal" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordInputChange} className="modal-input" placeholder="Enter your current password" required disabled={isChangingPassword}/>
                             <button type="button" onClick={() => setShowCurrentPassword(p => !p)} className="password-toggle-btn" aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}>
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="newPasswordModal" className="modal-label">New Password</label>
                         <div className="relative mt-1">
                             <Lock size={16} className="password-icon"/>
                            <input type={showNewPassword ? 'text' : 'password'} id="newPasswordModal" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordInputChange} className="modal-input" placeholder="Min. 6 characters" required minLength="6" disabled={isChangingPassword}/>
                            <button type="button" onClick={() => setShowNewPassword(p => !p)} className="password-toggle-btn" aria-label={showNewPassword ? "Hide new password" : "Show new password"}>
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirmPasswordModal" className="modal-label">Confirm New Password</label>
                         <div className="relative mt-1">
                             <Lock size={16} className="password-icon"/>
                            <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPasswordModal" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} className="modal-input" placeholder="Re-enter new password" required minLength="6" disabled={isChangingPassword}/>
                            <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="password-toggle-btn" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                         <button type="button" onClick={closePasswordModal} className="btn btn-secondary-outline" disabled={isChangingPassword}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isChangingPassword} className="btn btn-danger">
                            {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isChangingPassword ? 'Saving...' : 'Save Password'}
                        </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>


      {/* --- Style Block --- */}
       <style jsx>{`
        /* General Profile Card Styles */
        .profile-section-header { font-size: 0.9rem; font-weight: 600; color: #475569; /* slate-600 */ text-transform: uppercase; letter-spacing: 0.05em; }
        .dark .profile-section-header { color: #94a3b8; /* slate-400 */ }

        .profile-input { border-width: 1px; border-color: #d1d5db; /* gray-300 */ border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #1f2937; background-color: #ffffff; transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease; }
        .profile-input:focus { outline: none; border-color: #38bdf8; /* sky-400 */ box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3); }
        .dark .profile-input { border-color: #4b5563; /* gray-600 */ color: #e5e7eb; background-color: #374151; /* gray-700 */ }
        .dark .profile-input:focus { border-color: #38bdf8; /* sky-400 */ box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); }

        /* Base button styles */
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; font-size: 0.875rem; transition: all 0.2s ease; cursor: pointer; border: 1px solid transparent; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .btn:active:not(:disabled) { transform: translateY(0px); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Button Variants */
        .btn-primary { background-color: #0ea5e9; /* sky-500 */ color: white; }
        .btn-primary:hover:not(:disabled) { background-color: #0284c7; /* sky-600 */ }
        .btn-secondary { background-color: #64748b; /* slate-500 */ color: white; }
        .btn-secondary:hover:not(:disabled) { background-color: #475569; /* slate-600 */ }
        .btn-success { background-color: #16a34a; color: white; }
        .btn-success:hover:not(:disabled) { background-color: #15803d; }
        .btn-danger { background-color: #ef4444; /* red-500 */ color: white; }
        .btn-danger:hover:not(:disabled) { background-color: #dc2626; /* red-600 */ }

        /* Outline Button Variant */
        .btn-secondary-outline { border-color: #cbd5e1; /* slate-300 */ color: #475569; /* slate-600 */ background-color: white; }
        .btn-secondary-outline:hover:not(:disabled) { background-color: #f1f5f9; /* slate-100 */ border-color: #94a3b8; /* slate-400 */ color: #1e293b; /* slate-800 */}
        .dark .btn-secondary-outline { border-color: #4b5563; /* gray-600 */ color: #d1d5db; /* gray-300 */ background-color: transparent; }
        .dark .btn-secondary-outline:hover:not(:disabled) { background-color: #374151; /* gray-700 */ border-color: #6b7280; /* gray-500 */ color: #f3f4f6; /* gray-100 */}


        /* Modal Specific Styles */
        .modal-label { display: block; font-size: 0.8rem; font-weight: 500; color: #475569; /* slate-600 */ margin-bottom: 0.25rem; }
        .dark .modal-label { color: #94a3b8; /* slate-400 */ }
        .modal-input { border-width: 1px; border-color: #d1d5db; border-radius: 0.375rem; padding: 0.6rem 2.5rem 0.6rem 2.25rem; /* Adjusted padding */ font-size: 0.875rem; color: #1f2937; background-color: #f9fafb; /* gray-50 */ width: 100%; transition: all 0.2s ease; }
        .modal-input:focus { outline: none; border-color: #0ea5e9; /* sky-500 */ box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.3); background-color: white; }
        .dark .modal-input { border-color: #4b5563; color: #e5e7eb; background-color: #374151; }
        .dark .modal-input:focus { border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.4); background-color: #4b5563; }
        .password-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9ca3af; /* gray-400 */ z-index: 10; }
        .password-toggle-btn { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); color: #6b7280; /* gray-500 */ background: none; border: none; padding: 0.25rem; cursor: pointer; transition: color 0.2s ease; }
        .password-toggle-btn:hover { color: #1f2937; /* gray-800 */ }
        .dark .password-toggle-btn { color: #9ca3af; /* gray-400 */ }
        .dark .password-toggle-btn:hover { color: #e5e7eb; /* gray-200 */ }
      `}</style>
    </div>
  );
};

export default StaffProfile;