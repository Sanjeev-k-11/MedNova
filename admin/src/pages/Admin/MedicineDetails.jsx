import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Assuming themes.js is in the same directory or adjust path
import { themes, getThemeClasses } from './themes';

// Assuming AdminContext provides token and backendUrl
import { AdminContext } from '../../context/AdminContext'; // Adjust path if needed

// Spinner component
const Spinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const MedicineDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { token, backendUrl } = useContext(AdminContext);

    const [medicine, setMedicine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({}); // State for form inputs (excluding image file)

    // --- Image Upload States ---
    const [selectedImageFile, setSelectedImageFile] = useState(null); // The actual file to upload
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);   // Local URL for preview
    const fileInputRef = useRef(null); // Ref for the hidden file input

    // --- Theme State ---
    const [currentThemeName, setCurrentThemeName] = useState(() => {
        return localStorage.getItem("medicineListTheme") || "Default";
    });
    const [activeTheme, setActiveTheme] = useState(() => getThemeClasses(currentThemeName));

    // Update activeTheme when currentThemeName changes
    useEffect(() => {
        setActiveTheme(getThemeClasses(currentThemeName));
    }, [currentThemeName]);


    // Cleanup effect for the local image preview URL
    // Revoke the object URL when imagePreviewUrl changes or component unmounts
    useEffect(() => {
        // Nothing to clean up if no preview URL exists
        if (!imagePreviewUrl) return;

        // Return a cleanup function
        return () => {
            URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]); // Re-run effect when imagePreviewUrl changes


    // Fetch medicine details on component mount or when 'id' changes
    useEffect(() => {
        const fetchMedicineDetails = async () => {
            if (!id) {
                setError("Medicine ID is missing.");
                setLoading(false);
                toast.error("Invalid request: Medicine ID missing.");
                return;
            }

            setLoading(true);
            setError(null); // Reset error state
            setSelectedImageFile(null); // Clear any pending file selection
            setImagePreviewUrl(null); // Clear any previous preview URL

            if (!token) {
                toast.error("Authentication token not found. Please log in.");
                setLoading(false);
                setError("Authentication required.");
                return;
            }

            try {
                const { data } = await axios.get(`${backendUrl}/api/admin/get-medicine/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (data.success && data.medicine) {
                    setMedicine(data.medicine);
                    // Initialize form data *without* the image URL initially
                    setFormData({
                         ...data.medicine,
                         strength: data.medicine.strength || '',
                         description: data.medicine.description || '',
                    });
                    // The image URL is handled separately for display (medicine.imageUrl)
                } else {
                    const errorMessage = data.message || "Failed to fetch medicine details.";
                    setError(errorMessage);
                    toast.error(errorMessage);
                }
            } catch (error) {
                console.error("Fetch medicine details error:", error);
                if (error.response && error.response.status === 404) {
                     setError("Medicine not found.");
                     toast.error("Medicine not found.");
                } else {
                    setError("An error occurred while fetching medicine details.");
                    toast.error("An error occurred while fetching medicine details.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (id && token && backendUrl) {
             fetchMedicineDetails();
        } else if (!token) {
            setLoading(false);
            setError("Authentication required.");
        }

    }, [id, backendUrl, token]);


    const handleGoBack = () => {
        navigate(-1);
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        setFormData(prevFormData => {
            let processedValue = value;
            if (type === 'number') {
                 if (value === '') {
                      // Convert empty string to null for optional number fields, 0 for others
                      if (name === 'originalPrice') processedValue = null;
                      else processedValue = 0; // Assume 0 for quantity, discountedPrice if cleared
                 } else {
                    processedValue = parseFloat(value);
                 }
            }

            return {
                ...prevFormData,
                [name]: processedValue,
            };
        });
    };

    // --- Image Upload Handlers ---
    const handleImageClick = () => {
        // Trigger the hidden file input click ONLY if in editing mode
        if(isEditing && fileInputRef.current) {
           fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            // Optional: Add client-side file type/size validation here
             if (!file.type.startsWith('image/')) {
                 toast.warning("Please select an image file.");
                 setSelectedImageFile(null);
                 setImagePreviewUrl(null);
                 e.target.value = null; // Clear input value
                 return;
             }
             if (file.size > 5 * 1024 * 1024) { // Example: 5MB limit
                 toast.warning("Image size exceeds 5MB limit.");
                 setSelectedImageFile(null);
                 setImagePreviewUrl(null);
                 e.target.value = null; // Clear input value
                 return;
             }

            setSelectedImageFile(file);
            // Create a local URL for previewing the image
            // This URL will be revoked later in the useEffect cleanup
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            // If file selection was canceled or failed
            setSelectedImageFile(null);
            setImagePreviewUrl(null); // Clears preview and triggers cleanup
        }

        // Reset the file input value so the same file can be selected again later
        e.target.value = null;
    };


    const handleEditClick = () => {
        setIsEditing(true);
        // Initialize form data with the current medicine data (excluding image URL)
        // Image URL display will use medicine.imageUrl until a new file is selected
        if (medicine) {
             setFormData({
                 ...medicine,
                 strength: medicine.strength || '',
                 description: medicine.description || '',
                 // Ensure numbers are treated correctly, although input handles them
                 originalPrice: medicine.originalPrice ?? '', // Use ?? to handle null/undefined, show empty for input
                 discountedPrice: medicine.discountedPrice ?? '',
                 quantity: medicine.quantity ?? '',
             });
             // selectedImageFile and imagePreviewUrl should be null at this point
        }
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        // Reset form data to the original medicine data state
        if (medicine) {
            setFormData({
                ...medicine,
                strength: medicine.strength || '',
                description: medicine.description || '',
                originalPrice: medicine.originalPrice ?? '',
                discountedPrice: medicine.discountedPrice ?? '',
                quantity: medicine.quantity ?? '',
             });
             // Image URL display reverts to medicine.imageUrl
        } else {
             // If medicine state is null, reset form to empty
             setFormData({});
        }
        // Clear any pending upload/preview state
        setSelectedImageFile(null);
        setImagePreviewUrl(null); // Triggers useEffect cleanup
    };


    const handleSaveClick = async () => {
         if (!id || !token || !backendUrl) {
             toast.error("Cannot save: Missing ID or authentication info.");
             return;
         }

         setLoading(true); // Show loading indicator
         setError(null); // Clear previous errors

         // --- Data Preparation using FormData ---
         // We use FormData to send both text fields and the file
         const formDataToSave = new FormData();

         // Append text/number fields from formData state
         // It's safer to explicitly append keys you expect, handling potential nulls
         // Backend should parse these correctly from multipart/form-data
         formDataToSave.append('name', formData.name || ''); // Required
         formDataToSave.append('manufacturer', formData.manufacturer || ''); // Required
         formDataToSave.append('strength', formData.strength || ''); // Optional, send empty string if null/undefined
         formDataToSave.append('description', formData.description || ''); // Optional, send empty string if null/undefined

         // Handle number fields - send them as numbers or convert appropriately if backend expects strings
         // Appending numbers directly to FormData usually works, backend parses them
         if (formData.originalPrice !== null && formData.originalPrice !== undefined && !isNaN(formData.originalPrice)) {
             formDataToSave.append('originalPrice', formData.originalPrice);
         } // else omit the field or append a specific null indicator if backend requires
         if (formData.discountedPrice !== null && formData.discountedPrice !== undefined && !isNaN(formData.discountedPrice)) {
             formDataToSave.append('discountedPrice', formData.discountedPrice);
         } // Required field validation is done below
          if (formData.quantity !== null && formData.quantity !== undefined && !isNaN(formData.quantity)) {
             formDataToSave.append('quantity', formData.quantity);
         } // Required field validation is done below


         // --- Append the selected image file if it exists ---
         // The backend endpoint must be configured to look for a file under the key 'image'
         if (selectedImageFile) {
             formDataToSave.append('image', selectedImageFile);
             // Optionally, also send a flag or the original URL if the backend logic needs it
             // e.g., formDataToSave.append('replaceImage', 'true');
         }
         // If no new file is selected, the backend should understand this and keep the existing image

         // Basic Required Field Validation (using formData state before sending)
         if (!formData.name || !formData.manufacturer || formData.quantity === null || formData.quantity === undefined || isNaN(formData.quantity) || formData.quantity < 0) {
             toast.warning("Name, Manufacturer, and positive Quantity are required.");
             setLoading(false); // Stop loading immediately
             return;
         }
         if (formData.discountedPrice === null || formData.discountedPrice === undefined || isNaN(formData.discountedPrice) || formData.discountedPrice < 0) {
              toast.warning("Selling Price is required and must be non-negative.");
              setLoading(false);
              return;
         }
          // Validation for optional originalPrice if it's present
          if (formData.originalPrice !== null && formData.originalPrice !== undefined && (isNaN(formData.originalPrice) || formData.originalPrice < 0)) {
              toast.warning("Original Price must be a non-negative number or left empty.");
               setLoading(false);
              return;
         }


         try {
             // Send PATCH request with FormData
             // Axios will automatically set Content-Type to multipart/form-data
             const { data } = await axios.patch(`${backendUrl}/api/admin/update-medicine/${id}`, formDataToSave, {
                 headers: {
                     Authorization: `Bearer ${token}`,
                     // DO NOT set 'Content-Type': 'multipart/form-data' manually.
                     // Axios handles it correctly with FormData.
                 },
             });

             if (data.success && data.medicine) {
                 toast.success(data.message || "Medicine updated successfully!");
                 setMedicine(data.medicine); // Update the displayed medicine data with the response (includes new imageUrl)
                 // Reset form data from the *saved* state
                  setFormData({
                      ...data.medicine,
                      strength: data.medicine.strength || '',
                      description: data.medicine.description || '',
                       originalPrice: data.medicine.originalPrice ?? '',
                       discountedPrice: data.medicine.discountedPrice ?? '',
                       quantity: data.medicine.quantity ?? '',
                 });
                 setIsEditing(false); // Exit edit mode
                 // Clear pending upload state on successful save
                 setSelectedImageFile(null);
                 setImagePreviewUrl(null); // Triggers useEffect cleanup
             } else {
                 // This block handles backend success: false or no medicine in response
                 const errorMessage = data.message || "Failed to update medicine.";
                 setError(errorMessage);
                 toast.error(errorMessage);
                 // Don't clear states on failure, allow user to correct and retry
             }
         } catch (error) {
             console.error("Update medicine error:", error);
             // This block handles network errors, 4xx/5xx responses from backend
              const apiErrorMessage = error.response?.data?.message || "An error occurred while saving medicine details.";
              setError(apiErrorMessage);
              toast.error(apiErrorMessage);
              // Don't clear states on failure, allow user to correct and retry
         } finally {
             setLoading(false); // Hide loading indicator
         }
    };


    // Determine the image source based on editing state and selected file
    const currentImageSrc = isEditing && imagePreviewUrl
        ? imagePreviewUrl
        : (medicine?.imageUrl || "/default-medicine.jpg");


    // --- JSX with Dynamic Theme Classes ---
    return (
        <div className={`container mx-auto p-4 md:p-6 max-h-[90vh] overflow-y-auto ${activeTheme.classes.containerBg}`}>
            {/* Header Section */}
            <div className={`flex justify-between items-center mb-6 pb-2 border-b ${activeTheme.classes.headerBorder}`}>
                <h1 className={`text-2xl md:text-3xl font-bold ${activeTheme.classes.headerText}`}>
                    {isEditing ? 'Edit Medicine' : 'Medicine Details'}
                </h1>
                {/* Action Buttons */}
                 <div className="flex items-center gap-4">
                    {/* Only show Edit/Save/Cancel if we successfully loaded medicine and are not in a loading state related to initial fetch/save */}
                    {!loading && !error && medicine && ( // Only show edit/save if medicine is loaded
                        <>
                         {isEditing ? (
                             <>
                                 <button
                                     onClick={handleSaveClick}
                                     className={`px-4 py-2 text-sm rounded-md transition duration-150 ease-in-out ${activeTheme.classes.buttonPrimaryBg} ${activeTheme.classes.buttonPrimaryHoverBg} text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 ${activeTheme.classes.focusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
                                     aria-label="Save changes"
                                     disabled={loading} // Disable save button while saving
                                 >
                                     Save
                                 </button>
                                  <button
                                     onClick={handleCancelClick}
                                     className={`px-4 py-2 text-sm rounded-md transition duration-150 ease-in-out ${activeTheme.classes.buttonSecondaryBg} ${activeTheme.classes.buttonSecondaryHoverBg} ${activeTheme.classes.buttonSecondaryText} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${activeTheme.classes.focusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
                                     aria-label="Cancel editing"
                                     disabled={loading} // Disable cancel button while saving
                                 >
                                     Cancel
                                 </button>
                             </>
                         ) : (
                             <button
                                 onClick={handleEditClick}
                                 className={`px-4 py-2 text-sm rounded-md transition duration-150 ease-in-out ${activeTheme.classes.buttonPrimaryBg} ${activeTheme.classes.buttonPrimaryHoverBg} text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 ${activeTheme.classes.focusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
                                 aria-label="Edit medicine details"
                                 disabled={loading} // Disable edit button while loading/saving
                             >
                                 Edit
                             </button>
                         )}
                        </>
                    )}
                    {/* Back Button - Always visible, disabled while loading/saving */}
                     <button
                        onClick={handleGoBack}
                        className={`px-4 py-2 text-sm rounded-md transition duration-150 ease-in-out ${activeTheme.classes.buttonSecondaryBg} ${activeTheme.classes.buttonSecondaryHoverBg} ${activeTheme.classes.buttonSecondaryText} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${activeTheme.classes.focusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Go back to medicine list"
                         disabled={loading}
                    >
                        Back to List
                    </button>
                 </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-20">
                    <Spinner />
                    <p className={`ml-2 ${activeTheme.classes.filterText}`}>Loading Details...</p>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className={`text-center p-10 rounded-lg ${activeTheme.classes.cardBg} ${activeTheme.classes.textDanger}`}>
                    <p className="font-semibold mb-2">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* No Medicine Found State */}
            {!loading && !error && !medicine && (
                 <div className={`text-center p-10 rounded-lg ${activeTheme.classes.cardBg} ${activeTheme.classes.textMuted}`}>
                    <p>Medicine not found.</p>
                 </div>
            )}

            {/* Medicine Details Content / Edit Form */}
            {/* Render only if medicine data is available and not in a blocking loading state */}
            {!loading && !error && medicine && (
                <div className={`rounded-lg shadow-md border overflow-hidden ${activeTheme.classes.cardBg} ${activeTheme.classes.cardBorder} flex flex-col md:flex-row gap-6 p-6`}>

                    {/* Image Section */}
                    <div className="w-full md:w-1/3 flex-shrink-0">
                         {/* Image container - clickable when editing */}
                         <div
                             className={`relative overflow-hidden rounded-md shadow-sm ${isEditing ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                             onClick={handleImageClick} // Always attach handler, it checks isEditing internally
                             aria-label={isEditing ? "Click to change image" : "Medicine image"}
                         >
                            <img
                                // Display the preview URL when editing and a file is selected, otherwise use the medicine's URL
                                src={currentImageSrc}
                                alt={medicine.name}
                                className="w-full h-auto object-cover"
                                // Handle broken image links by showing the default
                                onError={(e) => { e.target.onerror = null; e.target.src = "/default-medicine.jpg"; }}
                            />
                            {/* Optional: Overlay icon/text when editing */}
                            {isEditing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-lg font-semibold opacity-0 hover:opacity-100 transition-opacity">
                                     Change Image
                                </div>
                             )}
                         </div>

                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden" // Hide the actual input
                            accept="image/*" // Only allow image files
                        />

                        {/* Optional: Display current image URL below the image when NOT editing */}
                        {!isEditing && medicine.imageUrl && (
                             <div className="mt-4">
                                <p className={`text-sm font-semibold ${activeTheme.classes.textMuted}`}>Image URL:</p>
                                <p className={`text-xs truncate ${activeTheme.classes.cardSecondaryText}`}>{medicine.imageUrl}</p>
                             </div>
                        )}
                         {/* Optional: Indicate if a new file is selected when editing */}
                        {isEditing && selectedImageFile && (
                            <div className="mt-2 text-sm text-blue-600">
                                New file selected: {selectedImageFile.name}
                            </div>
                        )}
                    </div>

                    {/* Details Section / Form */}
                    <div className="w-full md:w-2/3 flex-grow flex flex-col">
                        {isEditing ? (
                            // --- Edit Form ---
                            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleSaveClick(); }}>
                                 <div>
                                     <label htmlFor="name" className={`block text-sm font-semibold mb-1 ${activeTheme.classes.textMuted}`}>Medicine Name:</label>
                                     <input
                                         type="text"
                                         id="name"
                                         name="name"
                                         value={formData.name || ''}
                                         onChange={handleInputChange}
                                         className={`w-full p-2 border rounded-md ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none`}
                                         required
                                     />
                                 </div>
                                 <div>
                                     <label htmlFor="manufacturer" className={`block text-sm font-semibold mb-1 ${activeTheme.classes.textMuted}`}>Manufacturer:</label>
                                     <input
                                         type="text"
                                         id="manufacturer"
                                         name="manufacturer"
                                         value={formData.manufacturer || ''}
                                         onChange={handleInputChange}
                                          className={`w-full p-2 border rounded-md ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none`}
                                         required
                                     />
                                 </div>
                                 <div>
                                     <label htmlFor="strength" className={`block text-sm font-semibold mb-1 ${activeTheme.classes.textMuted}`}>Strength:</label>
                                     <input
                                         type="text"
                                         id="strength"
                                         name="strength"
                                         value={formData.strength !== null && formData.strength !== undefined ? formData.strength : ''}
                                         onChange={handleInputChange}
                                         className={`w-full p-2 border rounded-md ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none`}
                                     />
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div>
                                         <label htmlFor="originalPrice" className={`block text-sm font-semibold mb-1 ${activeTheme.classes.textMuted}`}>Original Price (₹):</label>
                                         <input
                                             type="number"
                                             id="originalPrice"
                                             name="originalPrice"
                                             value={formData.originalPrice !== undefined && formData.originalPrice !== null ? formData.originalPrice : ''}
                                             onChange={handleInputChange}
                                             className={`w-full p-2 border rounded-md ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none`}
                                             min="0"
                                             step="0.01"
                                         />
                                     </div>
                                      <div>
                                         <label htmlFor="discountedPrice" className={`block text-sm font-semibold mb-1 ${activeTheme.classes.textMuted}`}>Selling Price (₹):</label>
                                         <input
                                             type="number"
                                             id="discountedPrice"
                                             name="discountedPrice"
                                             value={formData.discountedPrice !== undefined && formData.discountedPrice !== null ? formData.discountedPrice : ''}
                                             onChange={handleInputChange}
                                             className={`w-full p-2 border rounded-md ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none`}
                                             min="0"
                                             step="0.01"
                                             required
                                         />
                                     </div>
                                 </div>
                                  <div>
                                     <label htmlFor="quantity" className={`block text-sm font-semibold mb-1 ${activeTheme.classes.textMuted}`}>Available Quantity:</label>
                                     <input
                                         type="number"
                                         id="quantity"
                                         name="quantity"
                                         value={formData.quantity !== undefined && formData.quantity !== null ? formData.quantity : ''}
                                         onChange={handleInputChange}
                                         className={`w-full p-2 border rounded-md ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none`}
                                         min="0"
                                         required
                                     />
                                 </div>
                                  <div>
                                     <label htmlFor="description" className={`block text-sm font-semibold mb-1 ${activeTheme.classes.textMuted}`}>Description:</label>
                                     <textarea
                                         id="description"
                                         name="description"
                                         value={formData.description !== null && formData.description !== undefined ? formData.description : ''}
                                         onChange={handleInputChange}
                                         rows="4"
                                         className={`w-full p-2 border rounded-md ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none`}
                                     ></textarea>
                                 </div>
                                 {/* Save/Cancel buttons are in the header */}
                            </form>

                        ) : (
                            // --- View Details ---
                            <>
                                 <h2 className={`text-xl md:text-2xl font-bold mb-4 ${activeTheme.classes.cardTitleText}`}>
                                     {medicine.name}
                                 </h2>

                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                     <div>
                                         <p className={`text-sm font-semibold ${activeTheme.classes.textMuted}`}>Manufacturer:</p>
                                         <p className={`${activeTheme.classes.cardSecondaryText}`}>{medicine.manufacturer || 'N/A'}</p>
                                     </div>
                                     <div>
                                         <p className={`text-sm font-semibold ${activeTheme.classes.textMuted}`}>Strength:</p>
                                         <p className={`${activeTheme.classes.cardSecondaryText}`}>{medicine.strength || 'N/A'}</p>
                                     </div>
                                      {medicine.originalPrice !== undefined && medicine.originalPrice !== null && (
                                         <div>
                                             <p className={`text-sm font-semibold ${activeTheme.classes.textMuted}`}>Original Price:</p>
                                             <p className={`line-through ${activeTheme.classes.textMuted}`}>₹{medicine.originalPrice.toFixed(2)}</p>
                                         </div>
                                      )}
                                       {/* Always show selling price if available */}
                                      {medicine.discountedPrice !== undefined && medicine.discountedPrice !== null && (
                                         <div>
                                             <p className={`text-sm font-semibold ${activeTheme.classes.textMuted}`}>Selling Price:</p>
                                             <p className={`text-xl font-bold ${activeTheme.classes.cardPriceText}`}>₹{medicine.discountedPrice.toFixed(2)}</p>
                                         </div>
                                     )}
                                     <div>
                                         <p className={`text-sm font-semibold ${activeTheme.classes.textMuted}`}>Available Quantity:</p>
                                         <p className={`text-lg font-bold ${medicine.quantity > 0 ? activeTheme.classes.textHighlightGreen : activeTheme.classes.textHighlightRed}`}>
                                             {medicine.quantity !== undefined && medicine.quantity !== null ? medicine.quantity : 'N/A'}
                                         </p>
                                     </div>
                                      <div>
                                          <p className={`text-sm font-semibold ${activeTheme.classes.textMuted}`}>Stock Status:</p>
                                          <span className={`inline-block px-2 py-1 text-xs font-bold text-white rounded ${medicine.quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                              {medicine.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                          </span>
                                      </div>
                                 </div>

                                  {medicine.description && (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                          <p className={`text-sm font-semibold mb-2 ${activeTheme.classes.textMuted}`}>Description:</p>
                                          <p className={`${activeTheme.classes.cardSecondaryText} whitespace-pre-wrap`}>{medicine.description}</p>
                                      </div>
                                  )}
                             </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineDetailsPage;