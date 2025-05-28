import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { StaffContext } from '../../context/StaffContext'; // Adjust import path if necessary

// --- Reusable Styles (Keep existing styles) ---
const styles = /* Your existing styles object here */ {
    // Display Styles
    displayContainer: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', padding: '40px', backgroundColor: '#FFCDD2', fontFamily: 'Arial, sans-serif', color: '#444', gap: '40px', maxWidth: '1200px', margin: '20px auto', borderRadius: '8px', position: 'relative' },
    displayImageSection: { flex: 1, maxWidth: '45%' },
    displayImage: { width: '100%', height: 'auto', borderRadius: '8px', display: 'block', objectFit: 'cover' },
    displayContentSection: { flex: 1.2, display: 'flex', flexDirection: 'column', gap: '30px' },
    displayBlock: {},
    displayHeading: { fontWeight: 'bold', color: '#D32F2F', fontSize: '1.4em', marginBottom: '15px' },
    displayContactUsHeading: { textAlign: 'left', fontWeight: 'bold', color: '#D32F2F', fontSize: '1.8em', marginBottom: '20px' },
    displaySubHeading: { margin: '5px 0', fontSize: '1.1em', color: '#555' },
    displayLink: { color: '#1976D2', textDecoration: 'none', display: 'block', margin: '5px 0', fontSize: '1.1em', wordBreak: 'break-word' },
    displayParagraph: { lineHeight: '1.6', fontSize: '1em', color: '#666', marginBottom: '10px', whiteSpace: 'pre-wrap'},
    displayButton: { display: 'inline-block', padding: '12px 25px', backgroundColor: '#303F9F', color: 'white', textDecoration: 'none', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '1em', marginTop: '10px', transition: 'background-color 0.3s ease' },
    editButton: { position: 'absolute', top: '20px', right: '20px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', zIndex: 10 },
    // Form Styles
    formContainer: { padding: '20px', maxWidth: '800px', margin: '20px auto', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    fieldset: { border: '1px solid #eee', borderRadius: '5px', padding: '15px', backgroundColor: '#fff' },
    formGroup: { marginBottom: '15px', display: 'flex', flexDirection: 'column' },
    label: { marginBottom: '5px', fontWeight: 'bold' },
    input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
    textarea: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', minHeight: '80px', width: '100%', boxSizing: 'border-box', resize: 'vertical' },
    imagePreviewContainer: { marginTop: '10px', textAlign: 'center', border: '1px dashed #ccc', padding: '10px', position: 'relative' },
    imagePreview: { maxWidth: '200px', maxHeight: '200px', display: 'block', margin: '10px auto', border: '1px solid #eee', objectFit: 'contain' },
    removeButton: { marginTop: '5px', padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'},
    saveButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    cancelButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    // General Messages
    errorMsg: { color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', border: '1px solid red', marginBottom: '15px', textAlign: 'center', wordBreak: 'break-word' },
    successMsg: { color: 'green', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px', border: '1px solid green', marginBottom: '15px', textAlign: 'center' },
    loadingMsg: { textAlign: 'center', padding: '30px', fontSize: '1.2em' }
};

// Define the keys that correspond to actual form fields to be sent
const formFieldKeys = [
    'officeHeading', 'contactName', 'location', 'primaryPhoneNumber',
    'secondaryPhoneNumber', 'email', 'careersHeading', 'careersDescription',
    'careersButtonText', 'careersButtonLink', 'supportHeading', 'supportDescription'
];


function EditableContactDisplay() {
    const { staffToken, backendUrl } = useContext(StaffContext);
    const fileInputRef = useRef(null);

    const [displayData, setDisplayData] = useState(null);
    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [fetchLoading, setFetchLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const defaultContactStructure = {
        officeHeading: 'OUR OFFICE', contactName: '', location: '', primaryPhoneNumber: '',
        secondaryPhoneNumber: '', email: '', contactImage: null, careersHeading: 'CAREERS AT MEDNOVA',
        careersDescription: '', careersButtonText: 'Explore Jobs', careersButtonLink: '',
        supportHeading: 'RELIABILITY & SUPPORT', supportDescription: ''
    };

    // --- Fetch Initial Data ---
    const fetchContactData = useCallback(async () => {
        console.log("Fetching contact data...");
        if (!backendUrl) {
            setError("Backend URL not configured.");
            setFetchLoading(false);
            return;
        }
        if (!staffToken) { // Assuming GET also needs token for consistency
            setError("Authentication token not available.");
            setFetchLoading(false);
            setDisplayData(defaultContactStructure);
            setFormData(defaultContactStructure);
            setImagePreview(null);
            return;
        }

        setFetchLoading(true);
        setError(null);
        setSuccess(null);

        // --- CORRECTED GET URL ---
        const targetGetUrl = `${backendUrl}/api/staff/contect-data`;
        console.log(`GET request to: ${targetGetUrl}`);
        // --- END CORRECTION ---

        try {
            const response = await axios.get(targetGetUrl, {
                headers: { 'Authorization': `Bearer ${staffToken}` }
            });

            if (response.data?.success) {
                const fetchedData = response.data.data || defaultContactStructure;
                console.log("Fetched data:", fetchedData);
                setDisplayData(fetchedData);
                setFormData(fetchedData);
                setImagePreview(fetchedData.contactImage || null);
            } else {
                console.log("Fetch successful but no data or success false:", response.data);
                setError(response.data?.message || "Failed to retrieve valid contact data.");
                setDisplayData(defaultContactStructure);
                setFormData(defaultContactStructure);
                setImagePreview(null);
            }
        } catch (err) {
            console.error("Error fetching contact data:", err);
            if (err.response?.status === 404) {
                 setError(`Fetch Error: Endpoint not found (${targetGetUrl}). Check backend routes/URL.`);
            } else if (err.response?.status === 401 || err.response?.status === 403) {
                 setError("Fetch Error: Authentication failed.");
            } else {
                 setError(err.response?.data?.message || "An error occurred while fetching contact details.");
            }
            setDisplayData(defaultContactStructure);
            setFormData(defaultContactStructure);
            setImagePreview(null);
        } finally {
            setFetchLoading(false);
        }
    }, [backendUrl, staffToken]); // Added staffToken dependency

    useEffect(() => {
        fetchContactData();
    }, [fetchContactData]);


    // --- Edit Mode Toggling ---
    const handleEditClick = () => {
        console.log("Entering edit mode.");
        setFormData(displayData ? { ...displayData } : { ...defaultContactStructure });
        setImagePreview(displayData?.contactImage || null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setError(null);
        setSuccess(null);
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        console.log("Canceling edit.");
        setIsEditing(false);
        setSelectedFile(null);
        setImagePreview(displayData?.contactImage || null);
        setError(null);
    };

    // --- Form Input Handling ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                 setError('Please select an image file.'); return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('File size exceeds 5MB limit.'); return;
            }
            console.log("File selected:", file.name);
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    const handleRemoveImage = () => {
        console.log("Remove image clicked.");
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted.");
        if (!staffToken || !backendUrl) {
            setError("Authentication token or Backend URL missing.");
            return;
        }
        setSubmitLoading(true);
        setError(null);
        setSuccess(null);

        const dataToSubmit = new FormData();

        console.log("Appending form data fields:");
        formFieldKeys.forEach(key => {
            const valueToAppend = formData[key] ?? '';
            dataToSubmit.append(key, valueToAppend);
            console.log(`  ${key}: ${valueToAppend}`);
        });

        if (selectedFile) {
            dataToSubmit.append('image', selectedFile);
            console.log(`Appending NEW file as 'image': ${selectedFile.name}`);
        } else if (!imagePreview && displayData?.contactImage) {
            dataToSubmit.append('contactImage', '');
            console.log("Signaling image REMOVAL by sending contactImage=''");
        } else {
            console.log("No new file selected or removed, keeping existing image (if any).");
        }

        console.log("--- Final FormData Content ---");
        for (let [key, value] of dataToSubmit.entries()) {
            console.log(`${key}: ${value instanceof File ? `[File] ${value.name}` : value}`);
        }
        console.log("-----------------------------");

        // --- CORRECTED POST URL ---
        const targetPostUrl = `${backendUrl}/api/staff/contact`;
        console.log(`POSTing to URL: ${targetPostUrl}`);
        // --- END CORRECTION ---

        try {
            const response = await axios.post(targetPostUrl, dataToSubmit, { // Use corrected URL
                headers: { 'Authorization': `Bearer ${staffToken}` }
            });

            console.log("Submit response received:", response.data);
            if (response.data?.success) {
                setSuccess("Contact information updated successfully!");
                const updatedData = response.data.data;
                setDisplayData(updatedData);
                setFormData(updatedData);
                setImagePreview(updatedData?.contactImage || null);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setIsEditing(false);
            } else {
                 if (response.data?.errors) {
                     setError(`Validation Failed: ${response.data.errors.join(', ')}`);
                 } else {
                    setError(response.data?.message || "Update failed. Please check the details.");
                 }
            }
        } catch (err) {
            console.error("Error submitting contact data:", err);
             if (err.response) {
                 console.error("Axios Error Response Data:", err.response.data);
                 console.error("Axios Error Response Status:", err.response.status);
                 if (err.response.status === 404) {
                    setError(`Submit Error: Endpoint not found (${targetPostUrl}). Check backend routes/URL.`);
                 } else if (err.response.status === 401 || err.response.status === 403) {
                    setError("Submit Error: Authentication failed.");
                 } else if (err.response.data?.errors) {
                     setError(`Validation Failed: ${err.response.data.errors.join(', ')}`);
                 } else {
                    setError(err.response.data?.message || `Submission error (Status: ${err.response.status}).`);
                 }
            } else if (err.request) {
                 console.error("Axios Error Request:", err.request);
                 setError("Network Error: Could not connect to the server.");
            } else {
                setError(`An unexpected error occurred: ${err.message}`);
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    // --- Render Logic ---

    if (fetchLoading) {
        return <div style={styles.loadingMsg}>Loading Contact Information...</div>;
    }

    // --- EDIT MODE ---
    if (isEditing) {
        return (
            <div style={styles.formContainer}>
                <h2>Edit Contact Information</h2>
                {error && <p style={styles.errorMsg}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Image Upload */}
                    <fieldset style={styles.fieldset}>
                        <legend>Contact Image</legend>
                        <div style={styles.formGroup}>
                            <label htmlFor="contactImageInput" style={styles.label}>Upload/Replace Image (Max 5MB):</label>
                            <input type="file" id="contactImageInput" name="image" accept="image/png, image/jpeg, image/gif, image/webp"
                                onChange={handleFileChange} ref={fileInputRef} style={styles.input} />
                            {imagePreview && (
                                <div style={styles.imagePreviewContainer}>
                                    <p>Preview:</p>
                                    <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
                                    <button type="button" onClick={handleRemoveImage} style={styles.removeButton}>
                                        Remove Image
                                    </button>
                                </div>
                            )}
                             {!imagePreview && <p style={{textAlign: 'center', marginTop: '10px', fontStyle: 'italic'}}>No image selected or current image removed.</p>}
                        </div>
                    </fieldset>

                    {/* Office Details - Ensure 'required' attributes match backend schema if needed */}
                    <fieldset style={styles.fieldset}>
                        <legend>Office Details</legend>
                        <div style={styles.formGroup}>
                            <label htmlFor="officeHeading" style={styles.label}>Section Heading:</label>
                            <input style={styles.input} type="text" id="officeHeading" name="officeHeading" value={formData.officeHeading || ''} onChange={handleChange} required />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="contactName" style={styles.label}>Contact Name:</label>
                            <input style={styles.input} type="text" id="contactName" name="contactName" value={formData.contactName || ''} onChange={handleChange} />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="location" style={styles.label}>Location:</label>
                            <input style={styles.input} type="text" id="location" name="location" value={formData.location || ''} onChange={handleChange} />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="primaryPhoneNumber" style={styles.label}>Primary Phone:</label>
                            <input style={styles.input} type="tel" id="primaryPhoneNumber" name="primaryPhoneNumber" value={formData.primaryPhoneNumber || ''} onChange={handleChange} />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="secondaryPhoneNumber" style={styles.label}>Secondary Phone:</label>
                            <input style={styles.input} type="tel" id="secondaryPhoneNumber" name="secondaryPhoneNumber" value={formData.secondaryPhoneNumber || ''} onChange={handleChange} />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="email" style={styles.label}>Email:</label>
                            <input style={styles.input} type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} />
                        </div>
                    </fieldset>

                    {/* Careers Section */}
                    <fieldset style={styles.fieldset}>
                        <legend>Careers Section</legend>
                        <div style={styles.formGroup}>
                            <label htmlFor="careersHeading" style={styles.label}>Section Heading:</label>
                            <input style={styles.input} type="text" id="careersHeading" name="careersHeading" value={formData.careersHeading || ''} onChange={handleChange} required />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="careersDescription" style={styles.label}>Description:</label>
                            <textarea style={styles.textarea} id="careersDescription" name="careersDescription" value={formData.careersDescription || ''} onChange={handleChange} rows="3" />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="careersButtonText" style={styles.label}>Button Text:</label>
                            <input style={styles.input} type="text" id="careersButtonText" name="careersButtonText" value={formData.careersButtonText || ''} onChange={handleChange} required />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="careersButtonLink" style={styles.label}>Button Link (URL):</label>
                            <input style={styles.input} type="url" id="careersButtonLink" name="careersButtonLink" value={formData.careersButtonLink || ''} onChange={handleChange} placeholder="https://example.com/careers"/>
                        </div>
                    </fieldset>

                    {/* Support Section */}
                    <fieldset style={styles.fieldset}>
                        <legend>Support Section</legend>
                        <div style={styles.formGroup}>
                            <label htmlFor="supportHeading" style={styles.label}>Section Heading:</label>
                            <input style={styles.input} type="text" id="supportHeading" name="supportHeading" value={formData.supportHeading || ''} onChange={handleChange} required />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="supportDescription" style={styles.label}>Description:</label>
                            <textarea style={styles.textarea} id="supportDescription" name="supportDescription" value={formData.supportDescription || ''} onChange={handleChange} rows="3" />
                        </div>
                    </fieldset>

                    {/* Actions */}
                    <div style={styles.formActions}>
                        <button type="button" onClick={handleCancelClick} style={styles.cancelButton} disabled={submitLoading}>
                            Cancel
                        </button>
                        <button type="submit" style={{...styles.saveButton, ...(submitLoading ? styles.buttonDisabled : {})}} disabled={submitLoading}>
                            {submitLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }


    // --- DISPLAY MODE ---
    return (
        <div style={styles.displayContainer}>
            {staffToken && (
                <button onClick={handleEditClick} style={styles.editButton} disabled={fetchLoading}>
                    Edit Contact Info
                </button>
            )}

            {error && !isEditing && <p style={styles.errorMsg}>{error}</p>}
            {success && <p style={{...styles.successMsg, position: 'absolute', top: '70px', right: '20px', zIndex: 5, maxWidth: 'calc(100% - 40px)' }}>{success}</p>}

            {!displayData ? (
                 <div style={styles.loadingMsg}>Contact information not available.</div>
             ) : (
                 <>
                     {/* Image */}
                     <div style={styles.displayImageSection}>
                         {displayData.contactImage ? (
                             <img src={displayData.contactImage} alt="Contact illustration" style={styles.displayImage} />
                         ) : ( <div style={{ border: '1px dashed #ccc', padding: '20px', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '8px' }}> Image not set </div> )}
                     </div>

                     {/* Text Content */}
                     <div style={styles.displayContentSection}>
                         <h1 style={styles.displayContactUsHeading}> CONTACT <span style={{ color: '#1976D2' }}>US</span> </h1>
                         {/* Office Block */}
                         <div style={styles.displayBlock}>
                             <h2 style={styles.displayHeading}>{displayData.officeHeading || 'Office Info'}</h2>
                             {displayData.contactName && <p style={styles.displaySubHeading}>{displayData.contactName}</p>}
                             {displayData.location && <p style={styles.displaySubHeading}>{displayData.location}</p>}
                             {displayData.primaryPhoneNumber && <a href={`tel:${displayData.primaryPhoneNumber}`} style={styles.displayLink}> Tel: {displayData.primaryPhoneNumber} </a>}
                             {displayData.secondaryPhoneNumber && <a href={`tel:${displayData.secondaryPhoneNumber}`} style={styles.displayLink}> Tel: {displayData.secondaryPhoneNumber} </a>}
                             {displayData.email && <a href={`mailto:${displayData.email}`} style={styles.displayLink}> Email: {displayData.email} </a>}
                         </div>
                         {/* Careers Block */}
                         <div style={styles.displayBlock}>
                             <h2 style={styles.displayHeading}>{displayData.careersHeading || 'Careers'}</h2>
                             {displayData.careersDescription && <p style={styles.displayParagraph}>{displayData.careersDescription}</p>}
                             {displayData.careersButtonLink && displayData.careersButtonText && (
                                 <a href={displayData.careersButtonLink} target="_blank" rel="noopener noreferrer" style={styles.displayButton}>
                                     {displayData.careersButtonText || 'Learn More'}
                                 </a>
                             )}
                         </div>
                         {/* Support Block */}
                         <div style={styles.displayBlock}>
                             <h2 style={styles.displayHeading}>{displayData.supportHeading || 'Support'}</h2>
                             {displayData.supportDescription && <p style={styles.displayParagraph}>{displayData.supportDescription}</p>}
                         </div>
                     </div>
                 </>
             )}
        </div>
    );
}

export default EditableContactDisplay;