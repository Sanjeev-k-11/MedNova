// components/CreateStudentForm.js

import React, { useState, useContext, useEffect } from 'react';
import { StaffContext } from '../../context/StaffContext'; // Adjust the path based on your project structure
import { FaUserCircle } from 'react-icons/fa'; // Example icon (install react-icons)
import { toast } from 'react-toastify'; // Import toast function (install react-toastify)

// --- Enhanced Styling (Replace with your preferred CSS/UI library later) ---
const formStyles = {
  container: {
    padding: '20px',
    maxWidth: '900px', // Slightly wider for better two-column layout
    margin: '20px auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '2px 2px 12px rgba(0,0,0,0.1)',
    backgroundColor: '#fff', // Changed to white background
  },
  formLayoutFlex: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px', // Space between rows and columns
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    width: '100%', // Row takes full width
    flexWrap: 'wrap',
  },
  formGroup: {
    marginBottom: '0', // Reset default margin
    flex: 1, // Items in a row share space
    minWidth: '220px', // Minimum width before wrapping
  },
  imageFormGroup: { // Specific style for the image upload area
    marginBottom: '0',
    flex: '0 0 160px', // Fixed width for the image area
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align items to the top
    paddingTop: '10px', // Add some padding at the top
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555', // Slightly softer label color
    fontSize: '0.95em',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '1em',
  },
  textarea: {
     width: '100%',
     padding: '10px',
     border: '1px solid #ccc',
     borderRadius: '4px',
     boxSizing: 'border-box',
     minHeight: '80px',
     fontSize: '1em',
  },
   select: {
     width: '100%',
     padding: '10px',
     border: '1px solid #ccc',
     borderRadius: '4px',
     boxSizing: 'border-box',
     backgroundColor: '#fff',
     fontSize: '1em',
   },
  imageUploadContainer: {
    width: '130px', // Slightly larger circle
    height: '130px',
    borderRadius: '50%',
    border: '2px dashed #007bff', // More visible dashed border
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    backgroundColor: '#e9f5ff', // Light blue background
    marginBottom: '10px',
    marginTop: '5px', // Add space above the circle
  },
  fileInputHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    border: 0,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  imagePlaceholder: {
    textAlign: 'center',
    color: '#007bff', // Placeholder text color
    fontSize: '0.9em',
  },
  placeholderIcon: {
     fontSize: '50px', // Larger icon
     color: '#007bff',
     marginBottom: '5px',
  },
   buttonContainer: {
      width: '100%',
      marginTop: '30px', // More space above the button
      textAlign: 'center',
   },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '12px 30px', // Increased padding
    border: 'none',
    borderRadius: '5px', // Slightly larger border radius
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
   buttonDisabled: {
    backgroundColor: '#cccccc',
    color: '#666666',
    padding: '12px 30px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'not-allowed',
    fontSize: '1em',
    fontWeight: 'bold',
   },
   requiredLabel: { // Style for the required asterisk
       color: 'red',
       marginLeft: '4px',
       fontWeight: 'normal',
   },
   errorMessage: { // Style for validation error messages
       color: 'red',
       fontSize: '0.8em',
       marginTop: '4px',
   }
};
// --- End Enhanced Styling ---


const CreateStudentForm = () => {
  const { staffToken, backendUrl } = useContext(StaffContext);

  // State for form input values, including virtualId and password
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    email: '',
    phoneNumber: '',
    course: '',
    yearSemester: '',
    dateOfBirth: '',
    gender: '',
    hostelBlockRoom: '',
    guardianContact: '',
    address: '',
    bloodGroup: '',
    medicalHistory: '',
    isVaccinated: false,

    virtualId: '', // Added virtualId
    password: '', // Added password

    dateOfAdmission: '',
    attendancePercentage: '',
    libraryCardNumber: '',
    clubMemberships: '',
    achievementsCertifications: '',
  });

  // State for image file and preview
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // State for loading indicator and validation errors
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // State to hold validation errors

  // Effect for image preview URL
   useEffect(() => {
       if (profileImageFile) {
           const url = URL.createObjectURL(profileImageFile);
           setPreviewImageUrl(url);
           return () => URL.revokeObjectURL(url); // Clean up URL
       } else {
           setPreviewImageUrl(null);
       }
   }, [profileImageFile]);

  // Generic input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Optional: Clear specific error message when the user starts typing in a field
    if (formErrors[name]) {
        setFormErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  // File input change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
     if (file && file.type.startsWith('image/')) {
       setProfileImageFile(file);
       if (formErrors.profileImage) { // Clear image error if present
           setFormErrors(prevErrors => {
               const newErrors = { ...prevErrors };
               delete newErrors.profileImage;
               return newErrors;
           });
       }
     } else {
        setProfileImageFile(null);
        setPreviewImageUrl(null); // Clear preview if non-image file selected
        if (file) toast.error('Please select a valid image file.');
     }
  };

  // Basic Frontend Validation Function
  const validateForm = (data) => {
      const errors = {};

      // Required Fields based on your Mongoose schema
      if (!data.fullName.trim()) errors.fullName = 'Full Name is required';
      if (!data.rollNumber.trim()) errors.rollNumber = 'Roll Number/ID is required';
      if (!data.email.trim()) errors.email = 'Email is required';
      // Basic email format check (optional, backend is definitive)
      if (data.email.trim() && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email.trim())) {
          errors.email = 'Please enter a valid email address';
      }
      if (!data.phoneNumber.trim()) errors.phoneNumber = 'Phone Number is required';
      if (!data.course.trim()) errors.course = 'Course/Program is required';
      if (!data.yearSemester.trim()) errors.yearSemester = 'Year/Semester is required';
      if (!data.dateOfBirth) errors.dateOfBirth = 'Date of Birth is required'; // Date input value is string 'YYYY-MM-DD'
      if (!data.gender) errors.gender = 'Gender is required';
      if (!data.guardianContact.trim()) errors.guardianContact = 'Guardian Contact is required';
      if (!data.address.trim()) errors.address = 'Address is required';
      if (!data.bloodGroup) errors.bloodGroup = 'Blood Group is required';
      // isVaccinated is boolean with default, required in schema. Frontend should ideally have this checked or a specific 'select' type if mandatory on form. Assuming checkbox needs interaction if required. Let's skip frontend validation for boolean required for simplicity unless it's a select.
      // if (data.isVaccinated === undefined) errors.isVaccinated = 'Vaccination status is required'; // This check is tricky for checkboxes, better rely on backend required + default: false

      // New Required Fields
      if (!data.virtualId.trim()) {
          errors.virtualId = 'Virtual ID is required';
      } else if (!/^\d{6}$/.test(data.virtualId.trim())) {
          errors.virtualId = 'Virtual ID must be exactly 6 digits';
      }
      if (!data.password) errors.password = 'Password is required'; // Assuming plain text input here

      // Check file type if uploaded (basic check handled in handleFileChange, but double check)
      // if (profileImageFile && !profileImageFile.type.startsWith('image/')) {
      //     errors.profileImage = 'Invalid file type. Please upload an image.';
      // }
      // Note: Mongoose schema doesn't require profileImage, so it's not added to errors if missing.

      // Optional fields validation (e.g., min/max for attendance, format for others if needed)
      if (data.attendancePercentage !== '' && (data.attendancePercentage < 0 || data.attendancePercentage > 100)) {
          errors.attendancePercentage = 'Attendance must be between 0 and 100';
      }
       // Add validation for library card uniqueness if needed, but unique checks are best left to backend.

      return errors;
  };


  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!staffToken) {
      toast.error('Authentication token missing. Please log in.');
      return;
    }

    // --- Frontend Validation ---
    const validationErrors = validateForm(formData);
    setFormErrors(validationErrors); // Update error state

    // If there are any errors, stop submission
    if (Object.keys(validationErrors).length > 0) {
        toast.error('Please fix the errors in the form.');
        console.log('Validation Errors:', validationErrors); // Log errors for debugging
        return; // Stop execution
    }
     // --- End Frontend Validation ---


    // --- Prepare data for submission using FormData ---
    const dataToSubmit = new FormData();

    // Append all formData fields
    Object.keys(formData).forEach(key => {
        const value = formData[key];

        // Special handling for clubMemberships (comma-separated string to array)
        if (key === 'clubMemberships' && typeof value === 'string') {
            // Split by comma, trim whitespace, filter out empty strings
            const clubArray = value.split(',').map(item => item.trim()).filter(item => item !== '');
            // Append each item in the array under the same key name for express-formidable or similar body parsers
            // OR stringify the array if your backend expects it as a single JSON string
            // For typical multipart/form-data handling with arrays like Express Multer,
            // you'd append multiple fields with the same name:
            // Example: clubMemberships=Club A, clubMemberships=Club B
            // Let's append them individually if the array is not empty
            if (clubArray.length > 0) {
                 clubArray.forEach(club => dataToSubmit.append(key, club));
            }
            // If the array is empty, we don't append the key, which is fine for optional array fields.

        } else if (value !== null && value !== '') { // Don't append null or empty strings (except for boolean default)
             dataToSubmit.append(key, value);
        } else if (typeof value === 'boolean') {
             // Always append boolean value even if false, as it's required
             dataToSubmit.append(key, value);
        }
         // Note: Empty strings for optional fields like hostelBlockRoom, medicalHistory, etc. are skipped,
         // which is fine as they are not required by schema and will be saved as null/undefined by Mongoose.
    });


    if (profileImageFile) {
      // Use the key 'image' to match backend upload.single('image')
      dataToSubmit.append('image', profileImageFile);
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/student/createstudent`, {
        method: 'POST',
        headers: {
          // IMPORTANT: Do NOT set Content-Type to 'multipart/form-data' here.
          // The browser sets it automatically when using FormData, including the boundary.
          'Authorization': `Bearer ${staffToken}`,
        },
        body: dataToSubmit, // Send the FormData object
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || response.statusText || 'Failed to create student.';
         toast.error(errorMessage);
         const error = new Error(errorMessage);
         error.response = result; // Attach backend response for more context if needed
         throw error; // Throw to enter the catch block for consistent error logging
      }

      toast.success('Student created successfully!');
      // Reset the form
      setFormData({
        fullName: '', rollNumber: '', email: '', phoneNumber: '', course: '',
        yearSemester: '', dateOfBirth: '', gender: '', hostelBlockRoom: '',
        guardianContact: '', address: '', bloodGroup: '', medicalHistory: '',
        isVaccinated: false, virtualId: '', password: '', dateOfAdmission: '',
        attendancePercentage: '', libraryCardNumber: '', clubMemberships: '',
        achievementsCertifications: '',
      });
      setProfileImageFile(null); // Clear the file input state
      setFormErrors({}); // Clear any lingering errors

    } catch (err) {
      console.error('Error creating student:', err);
      let userMessage = 'An unexpected error occurred during submission.';

      // Refine error message based on the error object
      if (err.response && typeof err.response.message === 'string') {
           userMessage = err.response.message; // Use the message from our backend response
      } else if (err.message && typeof err.message === 'string') {
          userMessage = err.message; // Use the error message thrown from fetch or the initial check
      } else if (err instanceof TypeError) {
          userMessage = 'Network error or server is unreachable.';
      } else if (err.name === 'AbortError') {
           userMessage = 'Request was cancelled.'; // Handle potential request cancellations
      }


      // If the backend sends validation errors in a specific format, you could parse them here
      // Example: if result.errors exists (like from express-validator), you could update formErrors state
      // if (err.response && err.response.errors) {
      //    // Assuming err.response.errors is an object like { fieldName: 'Error message' }
      //    setFormErrors(err.response.errors);
      //    userMessage = 'Please check the highlighted fields.'; // Change toast message
      // } else {
          toast.error(userMessage); // Show the general or parsed error message
      // }


    } finally {
      setIsLoading(false); // Stop loading state
    }
  };

  if (!staffToken) {
    return <div style={formStyles.container}>Please log in as staff to access this form.</div>;
  }

  // Render the form
  return (
    <div style={formStyles.container}>
      <h2>Create New Student Record</h2>
      {/* Removed conditional rendering of success/error messages */}

      <form onSubmit={handleSubmit} noValidate> {/* Added noValidate to rely on React validation */}
        <div style={formStyles.formLayoutFlex}>

           {/* --- Row 1: Image & Basic Personal Info --- */}
           <div style={formStyles.formRow}>
               <div style={formStyles.imageFormGroup}>
                  <label style={formStyles.label} htmlFor="profileImage">Profile Image:</label>
                   <label htmlFor="profileImage" style={formStyles.imageUploadContainer}>
                       <input
                           type="file"
                           id="profileImage"
                           name="image" // Must match backend multer field name
                           onChange={handleFileChange}
                           style={formStyles.fileInputHidden}
                           accept="image/*"
                       />
                       {previewImageUrl ? (
                           <img src={previewImageUrl} alt="Profile Preview" style={formStyles.imagePreview} />
                       ) : (
                           <div style={formStyles.imagePlaceholder}>
                                <FaUserCircle style={formStyles.placeholderIcon} />
                                Click to Upload
                           </div>
                       )}
                   </label>
                    {/* Display image upload error if any */}
                   {formErrors.profileImage && <div style={formStyles.errorMessage}>{formErrors.profileImage}</div>}
               </div>

               {/* Personal Info Group (takes remaining space) */}
               <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div style={formStyles.formGroup}>
                       <label style={formStyles.label} htmlFor="fullName">Full Name:<span style={formStyles.requiredLabel}>*</span></label>
                       <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} style={formStyles.input} required />
                       {formErrors.fullName && <div style={formStyles.errorMessage}>{formErrors.fullName}</div>}
                   </div>
                   <div style={formStyles.formGroup}>
                       <label style={formStyles.label} htmlFor="dateOfBirth">Date of Birth:<span style={formStyles.requiredLabel}>*</span></label>
                       <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} style={formStyles.input} required />
                        {formErrors.dateOfBirth && <div style={formStyles.errorMessage}>{formErrors.dateOfBirth}</div>}
                   </div>
                   <div style={formStyles.formGroup}>
                       <label style={formStyles.label} htmlFor="gender">Gender:<span style={formStyles.requiredLabel}>*</span></label>
                       <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} style={formStyles.select} required >
                           <option value="">Select Gender</option>
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                           <option value="Other">Other</option>
                           <option value="Prefer not to say">Prefer not to say</option>
                       </select>
                       {formErrors.gender && <div style={formStyles.errorMessage}>{formErrors.gender}</div>}
                   </div>
               </div>
           </div> {/* End formRow */}

           {/* --- Row 2: Contact Information --- */}
           <div style={formStyles.formRow}>
               <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="email">Email Address:<span style={formStyles.requiredLabel}>*</span></label>
                   <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} style={formStyles.input} required />
                    {formErrors.email && <div style={formStyles.errorMessage}>{formErrors.email}</div>}
               </div>
                <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="phoneNumber">Phone Number:<span style={formStyles.requiredLabel}>*</span></label>
                   <input type="text" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} style={formStyles.input} required />
                   {formErrors.phoneNumber && <div style={formStyles.errorMessage}>{formErrors.phoneNumber}</div>}
                </div>
           </div> {/* End formRow */}

           {/* --- Row 3: Address and Guardian --- */}
            <div style={formStyles.formRow}>
                <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="address">Address:<span style={formStyles.requiredLabel}>*</span></label>
                   <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} style={formStyles.textarea} required />
                    {formErrors.address && <div style={formStyles.errorMessage}>{formErrors.address}</div>}
                </div>
                 <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="guardianContact">Guardian Contact:<span style={formStyles.requiredLabel}>*</span></label>
                   <input type="text" id="guardianContact" name="guardianContact" value={formData.guardianContact} onChange={handleInputChange} style={formStyles.input} required />
                   {formErrors.guardianContact && <div style={formStyles.errorMessage}>{formErrors.guardianContact}</div>}
                </div>
            </div> {/* End formRow */}

           {/* --- Row 4: Enrollment Details --- */}
           <div style={formStyles.formRow}>
                <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="rollNumber">Roll Number / ID:<span style={formStyles.requiredLabel}>*</span></label>
                   <input type="text" id="rollNumber" name="rollNumber" value={formData.rollNumber} onChange={handleInputChange} style={formStyles.input} required />
                    {formErrors.rollNumber && <div style={formStyles.errorMessage}>{formErrors.rollNumber}</div>}
                </div>
                <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="course">Course / Program:<span style={formStyles.requiredLabel}>*</span></label>
                   <input type="text" id="course" name="course" value={formData.course} onChange={handleInputChange} style={formStyles.input} required />
                   {formErrors.course && <div style={formStyles.errorMessage}>{formErrors.course}</div>}
                </div>
           </div> {/* End formRow */}

            {/* --- Row 5: Year/Semester & Admission Date --- */}
            <div style={formStyles.formRow}>
                 <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="yearSemester">Year / Semester:<span style={formStyles.requiredLabel}>*</span></label>
                   <input type="text" id="yearSemester" name="yearSemester" value={formData.yearSemester} onChange={handleInputChange} style={formStyles.input} required />
                    {formErrors.yearSemester && <div style={formStyles.errorMessage}>{formErrors.yearSemester}</div>}
                 </div>
                 <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="dateOfAdmission">Date of Admission:</label>
                   <input type="date" id="dateOfAdmission" name="dateOfAdmission" value={formData.dateOfAdmission} onChange={handleInputChange} style={formStyles.input} />
                    {/* No frontend error message needed as it's not required */}
                 </div>
            </div> {/* End formRow */}

            {/* --- Row 6: NEW Virtual ID & Password --- */}
            <div style={formStyles.formRow}>
                <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="virtualId">Virtual ID (6 digits):<span style={formStyles.requiredLabel}>*</span></label>
                   <input
                        type="text" // Use type="text" for precise control over input format
                        id="virtualId"
                        name="virtualId"
                        value={formData.virtualId}
                        onChange={handleInputChange}
                        style={formStyles.input}
                        required
                        maxLength={6} // Hint at 6 digits and prevent more input
                        pattern="\d{6}" // Basic browser pattern validation (redundant with JS validation, but good practice)
                     />
                    {formErrors.virtualId && <div style={formStyles.errorMessage}>{formErrors.virtualId}</div>}
                </div>
                <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="password">Password:<span style={formStyles.requiredLabel}>*</span></label>
                   <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} style={formStyles.input} required />
                   {formErrors.password && <div style={formStyles.errorMessage}>{formErrors.password}</div>}
                </div>
           </div> {/* End formRow */}


           {/* --- Row 7: Health & Medical --- */}
           <div style={formStyles.formRow}>
                <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="bloodGroup">Blood Group:<span style={formStyles.requiredLabel}>*</span></label>
                    <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} style={formStyles.select} required >
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
                    {formErrors.bloodGroup && <div style={formStyles.errorMessage}>{formErrors.bloodGroup}</div>}
                </div>
                 <div style={{...formStyles.formGroup, flex: 1, display: 'flex', alignItems: 'center', paddingTop: '20px'}}> {/* Align vertically */}
                   <label style={formStyles.label} htmlFor="isVaccinated" > 
                      <input type="checkbox" id="isVaccinated" name="isVaccinated" checked={formData.isVaccinated} onChange={handleInputChange} style={{marginRight: '8px', transform: 'scale(1.2)'}} /> {/* Style checkbox */}
                      Is Vaccinated<span style={formStyles.requiredLabel}>*</span>
                   </label>
                   {/* No frontend error message for required boolean unless using select */}
                </div>
           </div> {/* End formRow */}

            {/* --- Row 8: Medical History --- */}
            <div style={formStyles.formRow}>
                 <div style={formStyles.formGroup}> {/* This form group takes full width */}
                   <label style={formStyles.label} htmlFor="medicalHistory">Medical History (if any):</label>
                   <textarea id="medicalHistory" name="medicalHistory" value={formData.medicalHistory} onChange={handleInputChange} style={formStyles.textarea} />
                 </div>
            </div> {/* End formRow */}


           {/* --- Row 9: Optional Extras (Part 1) --- */}
            <div style={formStyles.formRow}>
                 <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="hostelBlockRoom">Hostel Block / Room:</label>
                   <input type="text" id="hostelBlockRoom" name="hostelBlockRoom" value={formData.hostelBlockRoom} onChange={handleInputChange} style={formStyles.input} />
                 </div>
                  <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="attendancePercentage">Attendance %:</label>
                   <input type="number" id="attendancePercentage" name="attendancePercentage" value={formData.attendancePercentage} onChange={handleInputChange} style={formStyles.input} min="0" max="100" />
                   {formErrors.attendancePercentage && <div style={formStyles.errorMessage}>{formErrors.attendancePercentage}</div>}
                 </div>
            </div> {/* End formRow */}

            {/* --- Row 10: Optional Extras (Part 2) --- */}
            <div style={formStyles.formRow}>
                 <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="libraryCardNumber">Library Card Number:</label>
                   <input type="text" id="libraryCardNumber" name="libraryCardNumber" value={formData.libraryCardNumber} onChange={handleInputChange} style={formStyles.input} />
                 </div>
                 <div style={formStyles.formGroup}>
                   <label style={formStyles.label} htmlFor="clubMemberships">Club/Society Memberships (comma-separated):</label>
                    <input type="text" id="clubMemberships" name="clubMemberships" value={formData.clubMemberships} onChange={handleInputChange} style={formStyles.input} placeholder="e.g., Chess Club, Debate Society" />
                 </div>
            </div> {/* End formRow */}

             {/* --- Row 11: Achievements/Certifications --- */}
             <div style={formStyles.formRow}>
                 <div style={formStyles.formGroup}> {/* This form group takes full width */}
                   <label style={formStyles.label} htmlFor="achievementsCertifications">Achievements / Certifications:</label>
                   <textarea id="achievementsCertifications" name="achievementsCertifications" value={formData.achievementsCertifications} onChange={handleInputChange} style={formStyles.textarea} />
                 </div>
             </div> {/* End formRow */}


        </div> {/* End formLayoutFlex */}

        {/* Submit Button */}
        <div style={formStyles.buttonContainer}>
            <button
              type="submit"
              style={isLoading ? formStyles.buttonDisabled : formStyles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Student'}
            </button>
        </div>

      </form>
    </div>
  );
};

export default CreateStudentForm;