import React, { useState, useContext, useEffect, useCallback } from "react";
import { DoctorContext } from "../../context/doctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify"; 
import {
  Loader2,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Info,
  DollarSign,
  UserCircle,  
} from "lucide-react";

const DoctorProfile = () => {
  const { dtoken, profileData: initialProfileData, setProfileData, getProfileData, backendUrl } =
    useContext(DoctorContext);
  const { currency } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);  
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false); 
  const [editableProfileData, setEditableProfileData] = useState(null);
 
  useEffect(() => {
    if (initialProfileData) { 
      setEditableProfileData(JSON.parse(JSON.stringify(initialProfileData)));
      setLoading(false);
    }
  }, [initialProfileData]);

  useEffect(() => {
    if (dtoken && !initialProfileData) {
      setLoading(true);
      getProfileData()
        .catch((err) => {
          console.error("Failed to load profile initially:", err);
          toast.error("Could not load profile data.");
        })
        .finally(() => setLoading(false));
    } else if (!dtoken) {
        setLoading(false);  
    }
  }, [dtoken, getProfileData, initialProfileData]);

 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (e, parentKey) => {
    const { name, value } = e.target;
    setEditableProfileData((prev) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [name]: value,
      },
    }));
  };


  const toggleAvailability = async () => {
    if (isTogglingAvailability || !editableProfileData) return;
    setIsTogglingAvailability(true);
    const originalAvailability = editableProfileData.available;

    try { 
      const updatedData = { ...editableProfileData, available: !originalAvailability };
      setEditableProfileData(updatedData);  
      setProfileData(updatedData);  

      const { data } = await axios.post(
        `${backendUrl}/api/doctor/update-profile`,
        { available: !originalAvailability },  
        { headers: { Authorization: `Bearer ${dtoken}` } }
      );

      if (data.success) {
        toast.success("Availability updated"); 
      } else {
        toast.error(data.message || "Failed to update availability"); 
        const revertedData = { ...editableProfileData, available: originalAvailability };
        setEditableProfileData(revertedData);
        setProfileData(revertedData);
      }
    } catch (error) {
      toast.error("Error updating availability");
      console.error(error); 
      const revertedData = { ...editableProfileData, available: originalAvailability };
      setEditableProfileData(revertedData);
      setProfileData(revertedData);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleSaveChanges = async () => {
     if (isUpdating) return;
     setIsUpdating(true);
    try { 
      console.log("Updating Profile with Data:", editableProfileData);

      const { data } = await axios.post(
        `${backendUrl}/api/doctor/update-profile`,
        editableProfileData, 
        { headers: { Authorization: `Bearer ${dtoken}` } }
      );

      if (data.success) {
        toast.success(data.message || "Profile updated successfully");
        setProfileData(editableProfileData); 
        setIsEdit(false);  
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while updating profile.");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEdit(false); 
    setEditableProfileData(JSON.parse(JSON.stringify(initialProfileData)));
  };

  const handleEditToggle = () => {
     if (isEdit) {
         handleCancelEdit();  
     } else {
         setIsEdit(true); 
         setEditableProfileData(JSON.parse(JSON.stringify(initialProfileData)));
     }
  }

  // Loading State
  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <p className="ml-4 text-gray-600 dark:text-gray-300 text-lg">Loading Profile...</p>
        </div>
    );
  }
 
  if (!initialProfileData || !editableProfileData) {
     return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 p-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-xl font-semibold text-red-700 dark:text-red-300">Error Loading Profile</p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Could not retrieve profile data. Please check your connection or try again later.</p>
            {!dtoken && <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">You might need to log in.</p>}
        </div>
     )
  }
 
  const displayData = isEdit ? editableProfileData : initialProfileData;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
 
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
         
           <img
            src={displayData.image || assets.default_profile} 
            alt={displayData.name || "Doctor"}
            className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-md flex-shrink-0 bg-gray-100 dark:bg-gray-700"
            onError={(e) => e.target.src = assets.default_profile} 
          />
          <div className="flex-grow text-center sm:text-left">
            {isEdit ? (
              <input
                type="text"
                name="name"
                value={editableProfileData.name || ''}
                onChange={handleInputChange}
                className="text-2xl md:text-3xl font-bold border-b-2 border-indigo-300 dark:border-indigo-600 focus:outline-none focus:border-indigo-500 bg-transparent w-full sm:w-auto dark:text-white pb-1"
                placeholder="Full Name"
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{displayData.name}</h1>
            )} 
             <div className="mt-1 space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                 {isEdit ? (
                     <>
                         <input type="text" name="speciality" value={editableProfileData.speciality || ''} onChange={handleInputChange} className="profile-input" placeholder="Speciality"/>
                         <input type="text" name="degree" value={editableProfileData.degree || ''} onChange={handleInputChange} className="profile-input" placeholder="Degree"/>
                         <input type="text" name="hospital" value={editableProfileData.hospital || ''} onChange={handleInputChange} className="profile-input" placeholder="Hospital/Clinic"/>
                     </>
                 ) : (
                     <>
                        <p>{displayData.speciality}</p>
                        <p>{displayData.degree}</p>
                        <p>{displayData.hospital}</p>
                     </>
                 )}
             </div>
          </div>
           {/* Availability Toggle - moved to right */}
           <div className="mt-4 sm:mt-0 flex flex-col items-center sm:items-end">
               <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Availability</span>
               <button
                onClick={toggleAvailability}
                disabled={isTogglingAvailability || isUpdating} // Disable while other updates are happening too
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  displayData.available ? "bg-green-500 focus:ring-green-400" : "bg-gray-300 dark:bg-gray-600 focus:ring-gray-400"
                } ${isTogglingAvailability ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                aria-pressed={displayData.available}
              >
                <span className="sr-only">Toggle Availability</span>
                 {isTogglingAvailability && <Loader2 size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-spin"/>}
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                    displayData.available ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`mt-1 text-xs font-semibold ${displayData.available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isTogglingAvailability ? 'Updating...' : (displayData.available ? 'Available' : 'Not Available')}
              </span>
           </div>
        </div>

        {/* Profile Details Sections */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
 
          <section>
            <h3 className="profile-section-header">Contact Information</h3>
            <div className="space-y-3 mt-3">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                {isEdit ? (
                     <input type="email" name="email" value={editableProfileData.email || ''} onChange={handleInputChange} className="profile-input flex-grow" placeholder="Email Address"/>
                 ) : (
                     <span className="text-sm text-gray-700 dark:text-gray-300 break-all">{displayData.email || 'N/A'}</span>
                 )}
              </div>
               <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                 {isEdit ? (
                     <input type="tel" name="phone" value={editableProfileData.phone || ''} onChange={handleInputChange} className="profile-input flex-grow" placeholder="Phone Number"/>
                 ) : (
                     <span className="text-sm text-gray-700 dark:text-gray-300">{displayData.phone || 'N/A'}</span>
                 )}
              </div>
            </div>
          </section>

           {/* Address */}
           <section>
            <h3 className="profile-section-header">Address</h3>
             <div className="space-y-2 mt-3">
                <div className="flex items-start gap-3">
                 <MapPin size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" />
                 {isEdit ? (
                     <div className="flex-grow space-y-2">
                        <input type="text" name="line1" value={editableProfileData.address?.line1 || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="profile-input w-full" placeholder="Address Line 1"/>
                        <input type="text" name="line2" value={editableProfileData.address?.line2 || ''} onChange={(e) => handleNestedInputChange(e, 'address')} className="profile-input w-full" placeholder="Address Line 2 / City / Pincode"/>
                     </div>
                 ) : (
                     <span className="text-sm text-gray-700 dark:text-gray-300">
                         {displayData.address?.line1 || 'N/A'}
                         {displayData.address?.line2 && `, ${displayData.address.line2}`}
                     </span>
                 )}
                </div>
            </div>
          </section>

          {/* About Me */}
          <section className="md:col-span-2">
            <h3 className="profile-section-header">About Me</h3>
            <div className="mt-3">
               {isEdit ? (
                     <textarea name="about" value={editableProfileData.about || ''} onChange={handleInputChange} rows={4} className="profile-input w-full text-sm" placeholder="Write something about your experience, approach, etc."/>
                 ) : (
                     <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{displayData.about || 'No information provided.'}</p>
                 )}
            </div>
          </section>

           {/* Consultation Fee */}
           <section>
             <h3 className="profile-section-header">Consultation Fee</h3>
             <div className="mt-3 flex items-center gap-3">
                 <DollarSign size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                {isEdit ? (
                     <input type="number" name="fees" value={editableProfileData.fees || ''} onChange={handleInputChange} min="0" className="profile-input w-24" placeholder="Fee"/>
                 ) : (
                     <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{currency}{displayData.fees || 'N/A'}</p>
                 )}
             </div>
           </section>

        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleEditToggle}
            className={`btn ${isEdit ? 'btn-secondary' : 'btn-primary'} w-full sm:w-auto`}
            disabled={isUpdating || isTogglingAvailability}  
          >
            {isEdit ? <><X size={16} /> Cancel</> : <><Edit size={16} /> Edit Profile</>}
          </button>
          {isEdit && (
            <button
              onClick={handleSaveChanges}
              disabled={isUpdating || isTogglingAvailability} // Disable while saving or toggling
              className="btn btn-success w-full sm:w-auto"
            >
              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

      </div>
 
      <style jsx>{`
        .profile-section-header {
            font-size: 1.125rem; /* text-lg */
            font-weight: 600; /* font-semibold */
            color: #374151; /* text-gray-700 */
            padding-bottom: 0.5rem; /* pb-2 */
            border-bottom-width: 1px;
            border-color: #e5e7eb; /* border-gray-200 */
        }
        .dark .profile-section-header {
             color: #d1d5db; /* dark:text-gray-300 */
             border-color: #4b5563; /* dark:border-gray-600 */
        }
        .profile-input {
            border-width: 1px;
            border-color: #d1d5db; /* border-gray-300 */
            border-radius: 0.375rem; /* rounded-md */
            padding: 0.5rem 0.75rem; /* px-3 py-2 */
            font-size: 0.875rem; /* text-sm */
            color: #1f2937; /* text-gray-800 */
            background-color: #ffffff; /* bg-white */
            transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
         .profile-input:focus {
            outline: none;
            border-color: #4f46e5; /* focus:border-indigo-500 */
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3); /* focus:ring-2 focus:ring-indigo-500/30 */
         }
         .dark .profile-input {
              border-color: #4b5563; /* dark:border-gray-600 */
              color: #e5e7eb; /* dark:text-gray-200 */
              background-color: #374151; /* dark:bg-gray-700 */
         }
         .dark .profile-input:focus {
             border-color: #6366f1; /* dark:focus:border-indigo-400 */
             box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4); /* dark:focus:ring-indigo-400/40 */
         }
         /* Base button styles */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem; /* gap-2 */
            padding: 0.5rem 1rem; /* px-4 py-2 */
            border-radius: 0.375rem; /* rounded-md */
            font-weight: 500; /* font-medium */
            font-size: 0.875rem; /* text-sm */
            transition: background-color 0.2s ease-in-out, opacity 0.2s ease-in-out;
            cursor: pointer;
            border: 1px solid transparent;
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        /* Specific button variants */
        .btn-primary { background-color: #4f46e5; /* bg-indigo-600 */ color: white; }
        .btn-primary:hover:not(:disabled) { background-color: #4338ca; /* hover:bg-indigo-700 */ }

        .btn-secondary { background-color: #6b7280; /* bg-gray-500 */ color: white; }
        .btn-secondary:hover:not(:disabled) { background-color: #4b5563; /* hover:bg-gray-600 */ }

        .btn-success { background-color: #16a34a; /* bg-green-600 */ color: white; }
        .btn-success:hover:not(:disabled) { background-color: #15803d; /* hover:bg-green-700 */ }

      `}</style>

    </div>
  );
}

export default DoctorProfile;