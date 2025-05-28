// src/components/EditStudentForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StaffContext } from '../../context/StaffContext';
import { FaUserCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
// Import the CSS Module
import styles from './EditStudentForm.module.css';


const EditStudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { staffToken, backendUrl } = useContext(StaffContext);

  const [formData, setFormData] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isExistingImageCleared, setIsExistingImageCleared] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [formErrors, setFormErrors] = useState({});


  // --- Fetch Student Data ---
  useEffect(() => {
    const fetchStudent = async () => {
        if (!staffToken) {
            setFetchError('Authentication token missing. Please log in to fetch student data.');
            setIsLoading(false);
            return;
        }
        if (!id) {
             setFetchError('No student ID provided in URL.');
             setIsLoading(false);
             return;
        }

        setIsLoading(true);
        setFetchError(null);
        setProfileImageFile(null);
        setPreviewImageUrl(null);
        setOriginalImageUrl(null);
        setIsExistingImageCleared(false);
        setFormData(null); // Clear previous form data
         setFormErrors({}); // Clear previous form errors

        try {
            const response = await fetch(`${backendUrl}/api/student/studentBy/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${staffToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const studentData = result.data.student;

            setOriginalImageUrl(studentData.profileImage || null);
            // The effect hook below will handle setting the initial previewImageUrl
            // setPreviewImageUrl(studentData.profileImage || null); // Moved to useEffect

            setFormData({
                 fullName: studentData.fullName || '',
                 rollNumber: studentData.rollNumber || '',
                 email: studentData.email || '',
                 phoneNumber: studentData.phoneNumber || '',
                 course: studentData.course || '',
                 yearSemester: studentData.yearSemester || '',
                 dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toISOString().split('T')[0] : '',
                 gender: studentData.gender || '',
                 hostelBlockRoom: studentData.hostelBlockRoom || '',
                 guardianContact: studentData.guardianContact || '',
                 address: studentData.address || '',
                 bloodGroup: studentData.bloodGroup || '',
                 medicalHistory: studentData.medicalHistory || '',
                 isVaccinated: studentData.isVaccinated ?? false, // Handle potential null/undefined from backend

                 virtualId: studentData.virtualId || '',
                 password: '', // Always empty for security

                 dateOfAdmission: studentData.dateOfAdmission ? new Date(studentData.dateOfAdmission).toISOString().split('T')[0] : '',
                 attendancePercentage: studentData.attendancePercentage ?? '', // Use ?? for 0 values
                 libraryCardNumber: studentData.libraryCardNumber || '',
                 clubMemberships: Array.isArray(studentData.clubMemberships) ? studentData.clubMemberships.join(', ') : '',
                 achievementsCertifications: studentData.achievementsCertifications || '',
            });


        } catch (err) {
            console.error('Error fetching student for edit:', err);
            setFetchError(err.message);
            toast.error(`Failed to load student data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    fetchStudent();
  }, [id, staffToken, backendUrl]);


   // Effect to manage the image preview URL
   useEffect(() => {
       if (profileImageFile) {
           // If a new file is selected, create a preview URL for it
           const url = URL.createObjectURL(profileImageFile);
           setPreviewImageUrl(url);
           // Clean up the object URL when the component unmounts or the file changes
           return () => URL.revokeObjectURL(url);
       } else if (isExistingImageCleared) {
           // If the user clicked "Clear Image" and no new file is selected
           setPreviewImageUrl(null);
       } else {
           // If no new file and not explicitly cleared, show the original image (if it exists)
           setPreviewImageUrl(originalImageUrl || null);
       }
   }, [profileImageFile, isExistingImageCleared, originalImageUrl]);


  // Handle input changes (general fields)
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error message for the specific field being edited
    if (formErrors[name]) {
        setFormErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  // Handle file input change (image)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
     if (file && file.type.startsWith('image/')) {
       setProfileImageFile(file);
       setIsExistingImageCleared(false); // No longer clearing if a new file is chosen
       if (formErrors.profileImage) { // Clear image error if valid file selected
           setFormErrors(prevErrors => {
               const newErrors = { ...prevErrors };
               delete newErrors.profileImage;
               return newErrors;
           });
       }
     } else {
        setProfileImageFile(null);
        // If the user selected an invalid file, the preview should revert
        // This is handled by the image effect hook which depends on profileImageFile being null.
        if (file) { // Only show error if a file was actually selected but invalid
             toast.error('Please select a valid image file.');
        }
     }
  };

   // Handle clearing the image
   const handleClearImage = () => {
       setProfileImageFile(null); // Clear the selected file input state
       setIsExistingImageCleared(true); // Flag that the existing image should be cleared on save
       // The image effect hook will set previewImageUrl to null
   };


  // Basic Frontend Validation
   const validateForm = (data) => {
      const errors = {};

      // Basic Required Fields
      if (!data?.fullName?.trim()) errors.fullName = 'Full Name is required';
      if (!data?.email?.trim()) errors.email = 'Email is required';
       if (data?.email?.trim() && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email.trim())) {
          errors.email = 'Please enter a valid email address';
       }
       if (!data?.phoneNumber?.trim()) errors.phoneNumber = 'Phone Number is required';
       if (!data?.course?.trim()) errors.course = 'Course/Program is required';
       if (!data?.yearSemester?.trim()) errors.yearSemester = 'Year/Semester is required';
       if (!data?.dateOfBirth) errors.dateOfBirth = 'Date of Birth is required';
       if (!data?.gender) errors.gender = 'Gender is required'; // Check if selected option is empty
       if (!data?.guardianContact?.trim()) errors.guardianContact = 'Guardian Contact is required';
       if (!data?.address?.trim()) errors.address = 'Address is required';
       if (!data?.bloodGroup) errors.bloodGroup = 'Blood Group is required'; // Check if selected option is empty

       // Conditional/Specific Fields
       // Virtual ID is disabled/readonly, so validation is less critical client-side for *editing* it.
       // Password validation only if entered:
       if (data?.password && data.password.length > 0 && data.password.length < 8) { // Assuming minimum 8 characters
            errors.password = 'Password must be at least 8 characters long';
       }
        // Attendance validation:
        // Use loose check for attendance being an empty string or not a valid number,
        // but allow 0 or numbers between 0 and 100.
        const attendance = data?.attendancePercentage;
        if (attendance !== '' && (isNaN(attendance) || attendance < 0 || attendance > 100)) {
          errors.attendancePercentage = 'Attendance must be a number between 0 and 100';
        }
        // isVaccinated is a boolean, checkbox handles true/false. No required validation needed typically.

      return errors;
  };


  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!staffToken) {
      toast.error('Authentication token missing. Please log in.');
      return;
    }
     if (!formData) {
         toast.error('Student data not loaded yet.');
         return;
     }

    // --- Frontend Validation ---
    const validationErrors = validateForm(formData);
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
        toast.error('Please fix the errors in the form.');
        // console.log('Validation Errors:', validationErrors); // Keep for debugging
        return;
    }
     // --- End Frontend Validation ---


    // --- Prepare FormData for Submission ---
    const dataToSubmit = new FormData();

    // Append all formData fields
     Object.keys(formData).forEach(key => {
        const value = formData[key];

        // Skip fields that are disabled/readOnly (FormData automatically skips disabled inputs)
        // Explicitly skip virtualId and rollNumber if needed, but HTML disabled takes care of it.
        if (key === 'virtualId' || key === 'rollNumber') {
             return; // Don't append these read-only fields
        }

         if (key === 'password' && value === '') {
             return; // Skip empty password field - backend should handle this by keeping old password
         }

        // Special handling for clubMemberships (comma-separated string to array)
         if (key === 'clubMemberships') {
             const clubArray = typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(item => item !== '') : [];
             // Append each item individually for backend, or a specific indicator for empty
             if (clubArray.length > 0) {
                  clubArray.forEach(club => dataToSubmit.append(key, club));
             } else {
                 // If empty, append an empty string or special value if backend expects it,
                 // or just don't append the key. Not appending is common for empty optional arrays.
                 // A safer bet is to rely on the backend PATCH logic to handle omitted fields
                 // or provide a specific 'clear' mechanism if needed, similar to the image.
                 // For now, we just don't append if the resulting array is empty.
             }
         } else if (value !== null && value !== '') {
              dataToSubmit.append(key, value);
         } else if (typeof value === 'boolean') {
              // Always append boolean value (true or false)
              dataToSubmit.append(key, value);
         }
         // Other optional fields with empty strings or nulls will not be appended.
         // The backend should handle these gracefully (e.g., keep existing value or set to null).
     });


    // --- Image Submission Logic ---
    if (profileImageFile) {
      // If a new file is selected, append it under the expected key 'image'
      dataToSubmit.append('image', profileImageFile);
      // Explicitly remove the clear flag if it was previously set, as we're uploading a new image
      dataToSubmit.delete('clearProfileImage');
    } else if (isExistingImageCleared && originalImageUrl) {
      // If no new file, but user clicked "Clear Image", and there was an original image
      // Send a flag to the backend. Use the same key expected by the backend API.
      dataToSubmit.append('clearProfileImage', 'true');
    }
     // If neither (no new file AND not explicitly cleared), the 'image' and 'clearProfileImage'
     // fields are not appended. The backend should interpret this absence as "keep the existing image".
    // --- End Image Submission Logic ---


    setIsSaving(true); // Start saving state

    try {
      const response = await fetch(`${backendUrl}/api/student/Update/${id}`, {
        method: 'PATCH', // PATCH is typical for partial updates
        headers: {
          'Authorization': `Bearer ${staffToken}`,
          // DO NOT set 'Content-Type': 'multipart/form-data' here.
          // When using FormData, the browser sets the correct Content-Type
          // including the boundary marker required by the server.
        },
        body: dataToSubmit,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific backend validation errors if they come in a structured format
        if (response.status === 400 && result.errors) { // Assuming backend sends { errors: { field: "msg" } } for validation
             setFormErrors(result.errors);
             toast.error(result.message || 'Validation failed. Please check the highlighted fields.');
        } else {
             const errorMessage = result.message || response.statusText || 'Failed to update student.';
             toast.error(errorMessage);
        }
        // Throw an error to stop the success flow and ensure finally block runs
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      toast.success('Student updated successfully!');
      // Navigate back to the list or view page after successful save
       navigate('/students'); // Example: Go back to the list

      // If you wanted to stay on the page and show the updated data:
      // Update state with the new data returned by the server if needed,
      // and clear password field.
      // setFormData(prevData => ({ ...prevData, ...result.data.student, password: '' }));
      // setOriginalImageUrl(result.data.student.profileImage || null); // Update original image URL state
      // setProfileImageFile(null); // Clear the selected file input state
      // setIsExistingImageCleared(false); // Reset image cleared flag
      // setFormErrors({}); // Clear errors

    } catch (err) {
      console.error('Error updating student:', err);
      // Error messages are handled above based on response.ok status and result structure
      // If err doesn't have a result property (e.g., network error), show a generic toast
      if (!err.response) {
           toast.error('Network error or server unreachable.');
      }

    } finally {
      setIsSaving(false); // Stop saving state
    }
  };


  // Render states (Loading, Error, No Token)
  if (!staffToken) {
    return <div className={styles.container}>Please log in as staff to edit students.</div>;
  }

  if (fetchError) {
    return <div className={styles.errorMessageDisplay}>Error loading student: {fetchError}</div>;
  }

  if (isLoading || !formData) { // Show initial loading or if formData is still null
    return <div className={styles.loadingMessage}>Loading student data...</div>;
  }


  // Render the form when data is available
  return (
    <div className={styles.container}>
       {/* Loading Overlay for Saving */}
       {isSaving && (
            <div className={styles.loadingOverlay}>
                <FaSpinner className={styles.spin} style={styles.loadingSpinner} />
                <span>Updating...</span>
            </div>
       )}

      <h2>Edit Student Record</h2>

      <form onSubmit={handleSubmit} noValidate> {/* noValidate prevents default browser validation */}

        {/* --- Section 1: Profile Picture & Basic Info --- */}
        <section className={styles.formSection}>
             <h3 className={styles.sectionHeading}>Personal Information</h3>
             <div className={styles.formRow}>
               {/* Image Upload Group */}
               <div className={styles.imageFormGroup}>
                  <label className={styles.label} htmlFor="profileImage">Profile Image:</label>
                   <label htmlFor="profileImage" className={styles.imageUploadContainer}>
                       <input
                           type="file"
                           id="profileImage"
                           name="image" // Name expected by backend for file upload
                           onChange={handleFileChange}
                           className={styles.fileInputHidden}
                           accept="image/*"
                       />
                       {/* Conditional Rendering for Preview or Placeholder */}
                       {previewImageUrl ? (
                           <img src={previewImageUrl} alt="Profile Preview" className={styles.imagePreview} />
                       ) : (
                           <div className={styles.imagePlaceholder}>
                                <FaUserCircle className={styles.placeholderIcon} />
                                Upload Image
                           </div>
                       )}
                   </label>
                    {/* Button to clear the image - show if there is an image currently displayed */}
                    {/* Show if there's a preview URL OR if original existed and user wants to clear */}
                     { (previewImageUrl || (originalImageUrl && !isExistingImageCleared)) && (
                         <button type="button" onClick={handleClearImage} className={styles.removeImageButton}>
                             Remove Image
                         </button>
                     )}
                   {/* Optional: Display image upload specific errors */}
                   {/* {formErrors.profileImage && <div className={styles.errorMessage}>{formErrors.profileImage}</div>} */}
               </div>

               {/* Personal Info Group (using flex: 2 for relative size) */}
               <div className={styles.formGroup} style={{ flex: 2 }}> {/* Apply flex directly if not a common style */}
                   <label className={styles.label} htmlFor="fullName">Full Name:<span className={styles.requiredLabel}>*</span></label>
                   <input
                       type="text"
                       id="fullName"
                       name="fullName"
                       value={formData.fullName}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.fullName ? styles.error : ''}`}
                       required
                   />
                   {formErrors.fullName && <div className={styles.errorMessage}>{formErrors.fullName}</div>}
               </div>
                {/* Date of Birth Group (also flex: 2 if in same row group) */}
               <div className={styles.formGroup} style={{ flex: 2 }}>
                   <label className={styles.label} htmlFor="dateOfBirth">Date of Birth:<span className={styles.requiredLabel}>*</span></label>
                   <input
                       type="date"
                       id="dateOfBirth"
                       name="dateOfBirth"
                       value={formData.dateOfBirth}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.dateOfBirth ? styles.error : ''}`}
                       required
                   />
                    {formErrors.dateOfBirth && <div className={styles.errorMessage}>{formErrors.dateOfBirth}</div>}
               </div>
                {/* Gender Group (also flex: 2 if in same row group) */}
               <div className={styles.formGroup} style={{ flex: 2 }}>
                   <label className={styles.label} htmlFor="gender">Gender:<span className={styles.requiredLabel}>*</span></label>
                   <select
                       id="gender"
                       name="gender"
                       value={formData.gender}
                       onChange={handleInputChange}
                       className={`${styles.select} ${formErrors.gender ? styles.error : ''}`}
                       required
                    >
                       <option value="">Select Gender</option>
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                       <option value="Other">Other</option>
                       <option value="Prefer not to say">Prefer not to say</option>
                   </select>
                   {formErrors.gender && <div className={styles.errorMessage}>{formErrors.gender}</div>}
               </div>
            </div>
        </section>

        {/* --- Section 2: Contact & Address --- */}
        <section className={styles.formSection}>
            <h3 className={styles.sectionHeading}>Contact and Address</h3>
             <div className={styles.formRow}>
                {/* Email Group */}
               <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="email">Email Address:<span className={styles.requiredLabel}>*</span></label>
                   <input
                       type="email"
                       id="email"
                       name="email"
                       value={formData.email}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.email ? styles.error : ''}`}
                       required
                   />
                    {formErrors.email && <div className={styles.errorMessage}>{formErrors.email}</div>}
               </div>
                {/* Phone Group */}
                <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="phoneNumber">Phone Number:<span className={styles.requiredLabel}>*</span></label>
                   <input
                       type="text"
                       id="phoneNumber"
                       name="phoneNumber"
                       value={formData.phoneNumber}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.phoneNumber ? styles.error : ''}`}
                       required
                   />
                   {formErrors.phoneNumber && <div className={styles.errorMessage}>{formErrors.phoneNumber}</div>}
                </div>
           </div>

            {/* Guardian Contact Group */}
            <div className={styles.formRow}>
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="guardianContact">Guardian Contact:<span className={styles.requiredLabel}>*</span></label>
                   <input
                       type="text"
                       id="guardianContact"
                       name="guardianContact"
                       value={formData.guardianContact}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.guardianContact ? styles.error : ''}`}
                       required
                   />
                   {formErrors.guardianContact && <div className={styles.errorMessage}>{formErrors.guardianContact}</div>}
                </div>
            </div>

            {/* Address Group (use a single row for textarea) */}
            <div className={styles.formRow}>
                 <div className={styles.formGroup} style={{ flexBasis: '100%' }}> {/* Make address take full width */}
                   <label className={styles.label} htmlFor="address">Address:<span className={styles.requiredLabel}>*</span></label>
                   <textarea
                       id="address"
                       name="address"
                       value={formData.address}
                       onChange={handleInputChange}
                       className={`${styles.textarea} ${formErrors.address ? styles.error : ''}`}
                       required
                   />
                    {formErrors.address && <div className={styles.errorMessage}>{formErrors.address}</div>}
                </div>
            </div>
        </section>


        {/* --- Section 3: Enrollment & Account Info --- */}
        <section className={styles.formSection}>
             <h3 className={styles.sectionHeading}>Enrollment and Account Details</h3>
            <div className={styles.formRow}>
                {/* Roll Number (Disabled) */}
                <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="rollNumber">Roll Number / ID:<span className={styles.requiredLabel}>*</span></label>
                   <input
                       type="text"
                       id="rollNumber"
                       name="rollNumber"
                       value={formData.rollNumber}
                       className={styles.input}
                       required
                       readOnly
                       disabled // Disable this input - its value won't be sent
                    />
                    {/* Validation for roll number is typically not needed on edit since it's read-only */}
                </div>
                 {/* Virtual ID (Disabled) */}
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="virtualId">Virtual ID (6 digits):<span className={styles.requiredLabel}>*</span></label>
                   <input
                        type="text"
                        id="virtualId"
                        name="virtualId"
                        value={formData.virtualId}
                        className={styles.input}
                        required
                        maxLength={6}
                        pattern="\d{6}"
                        readOnly
                        disabled // Disable this input
                     />
                 </div>
           </div>
           <div className={styles.formRow}>
                {/* Course/Program */}
                <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="course">Course / Program:<span className={styles.requiredLabel}>*</span></label>
                   <input
                       type="text"
                       id="course"
                       name="course"
                       value={formData.course}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.course ? styles.error : ''}`}
                       required
                   />
                   {formErrors.course && <div className={styles.errorMessage}>{formErrors.course}</div>}
                </div>
                 {/* Year/Semester */}
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="yearSemester">Year / Semester:<span className={styles.requiredLabel}>*</span></label>
                   <input
                       type="text"
                       id="yearSemester"
                       name="yearSemester"
                       value={formData.yearSemester}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.yearSemester ? styles.error : ''}`}
                       required
                   />
                    {formErrors.yearSemester && <div className={styles.errorMessage}>{formErrors.yearSemester}</div>}
                 </div>
            </div>
             <div className={styles.formRow}>
                 {/* Date of Admission */}
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="dateOfAdmission">Date of Admission:</label>
                   <input
                       type="date"
                       id="dateOfAdmission"
                       name="dateOfAdmission"
                       value={formData.dateOfAdmission}
                       onChange={handleInputChange}
                       className={styles.input}
                   />
                    {/* No required validation */}
                 </div>
                 {/* Password Update */}
                <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="password">New Password:</label>
                   <input
                       type="password"
                       id="password"
                       name="password"
                       value={formData.password}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.password ? styles.error : ''}`}
                       placeholder="Leave blank to keep current password"
                    />
                   {formErrors.password && <div className={styles.errorMessage}>{formErrors.password}</div>}
                </div>
           </div>
        </section>


        {/* --- Section 4: Health Information --- */}
        <section className={styles.formSection}>
            <h3 className={styles.sectionHeading}>Health and Medical Information</h3>
            <div className={styles.formRow}>
                 {/* Blood Group */}
                <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="bloodGroup">Blood Group:<span className={styles.requiredLabel}>*</span></label>
                    <select
                        id="bloodGroup"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        className={`${styles.select} ${formErrors.bloodGroup ? styles.error : ''}`}
                        required
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {formErrors.bloodGroup && <div className={styles.errorMessage}>{formErrors.bloodGroup}</div>}
                </div>
                {/* Is Vaccinated Checkbox */}
                 <div className={`${styles.formGroup} ${styles.checkboxGroup}`}> {/* Use custom class for checkbox group */}
                   <label htmlFor="isVaccinated" className={`${styles.label} ${styles.checkboxLabel}`}> {/* Use custom class for checkbox label */}
                      <input
                          type="checkbox"
                          id="isVaccinated"
                          name="isVaccinated"
                          checked={formData.isVaccinated}
                          onChange={handleInputChange}
                          className={styles.checkboxInput}
                       />
                       Is Vaccinated
                       {/* Required is conceptual here, checkbox always submits a value */}
                       {/* <span className={styles.requiredLabel}>*</span> */}
                   </label>
                </div>
           </div>
           {/* Medical History */}
            <div className={styles.formRow}>
                 <div className={styles.formGroup} style={{ flexBasis: '100%' }}> {/* Take full width */}
                   <label className={styles.label} htmlFor="medicalHistory">Medical History (if any):</label>
                   <textarea
                       id="medicalHistory"
                       name="medicalHistory"
                       value={formData.medicalHistory}
                       onChange={handleInputChange}
                       className={styles.textarea}
                   />
                 </div>
             </div>
        </section>


        {/* --- Section 5: Other Information --- */}
        <section className={styles.formSection}>
            <h3 className={styles.sectionHeading}>Other Information</h3>
            <div className={styles.formRow}>
                 {/* Hostel */}
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="hostelBlockRoom">Hostel Block / Room:</label>
                   <input
                       type="text"
                       id="hostelBlockRoom"
                       name="hostelBlockRoom"
                       value={formData.hostelBlockRoom}
                       onChange={handleInputChange}
                       className={styles.input}
                   />
                 </div>
                  {/* Attendance */}
                  <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="attendancePercentage">Attendance %:</label>
                   <input
                       type="number"
                       id="attendancePercentage"
                       name="attendancePercentage"
                       value={formData.attendancePercentage}
                       onChange={handleInputChange}
                       className={`${styles.input} ${formErrors.attendancePercentage ? styles.error : ''}`}
                       min="0"
                       max="100"
                       step="0.1" // Allow decimal places if needed
                   />
                   {formErrors.attendancePercentage && <div className={styles.errorMessage}>{formErrors.attendancePercentage}</div>}
                 </div>
            </div>
            <div className={styles.formRow}>
                 {/* Library Card */}
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="libraryCardNumber">Library Card Number:</label>
                   <input
                       type="text"
                       id="libraryCardNumber"
                       name="libraryCardNumber"
                       value={formData.libraryCardNumber}
                       onChange={handleInputChange}
                       className={styles.input}
                   />
                 </div>
                 {/* Club Memberships */}
                 <div className={styles.formGroup}>
                   <label className={styles.label} htmlFor="clubMemberships">Club/Society Memberships (comma-separated):</label>
                    <input
                        type="text"
                        id="clubMemberships"
                        name="clubMemberships"
                        value={formData.clubMemberships}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="e.g., Chess Club, Debate Society"
                    />
                 </div>
            </div>
             {/* Achievements */}
             <div className={styles.formRow}>
                 <div className={styles.formGroup} style={{ flexBasis: '100%' }}> {/* Take full width */}
                   <label className={styles.label} htmlFor="achievementsCertifications">Achievements / Certifications:</label>
                   <textarea
                       id="achievementsCertifications"
                       name="achievementsCertifications"
                       value={formData.achievementsCertifications}
                       onChange={handleInputChange}
                       className={styles.textarea}
                   />
                 </div>
             </div>
        </section>

        {/* Submit Button */}
        <div className={styles.buttonContainer}>
            <button
              type="submit"
              className={isSaving ? styles.buttonDisabled : styles.button}
              disabled={isSaving}
            >
              {isSaving ? (
                  <>
                    <FaSpinner className={styles.spin} style={{ marginRight: '8px' }} />
                    Updating...
                  </>
                 ) : (
                   'Save Changes'
                 )}
            </button>
        </div>

      </form>

      {/* Removed the inline style block for keyframes as it's now in the CSS file */}
    </div>
  );
};

export default EditStudentForm;