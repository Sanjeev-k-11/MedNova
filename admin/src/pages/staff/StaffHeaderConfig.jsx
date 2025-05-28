// src/components/StaffHeaderConfig.js
import React, { useState, useEffect } from 'react';

// Assuming your backend URL is correctly configured
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const StaffHeaderConfig = () => {
  // Get the staff authentication token from localStorage
  const staffToken = localStorage.getItem('authToken') || ''; // Ensure this token is sent with requests

  const [headerConfig, setHeaderConfig] = useState(null);
  // Store the original fetched config to revert on Cancel
  const [originalHeaderConfig, setOriginalHeaderConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // New state to track edit mode
  const [isUploadingNewImages, setIsUploadingNewImages] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState([]); // Files selected but not yet uploaded
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // --- Fetch Header Configuration on Component Mount ---
  useEffect(() => {
    const fetchHeaderConfig = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${backendUrl}/api/staff/configheader`, {
          headers: {
            'Authorization': `Bearer ${staffToken}`, // Send auth token
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Store both current and original config
        setHeaderConfig(data.data);
        setOriginalHeaderConfig(data.data);

      } catch (err) {
        console.error("Error fetching header config:", err);
        setError(`Failed to fetch configuration: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (staffToken) { // Only fetch if token exists
       fetchHeaderConfig();
    } else {
       setIsLoading(false);
       setError("Staff authentication token not found. Please log in.");
    }

  }, [staffToken]); // Refetch if token changes (though it shouldn't change here)

  // --- Handlers for Input Changes (Only active when isEditing is true) ---
  const handleContentChange = (section, field, value) => {
    if (!isEditing) return; // Prevent changes if not editing
    setHeaderConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [field]: value
      }
    }));
  };

  const handleButtonChange = (section, field, value) => {
     if (!isEditing) return; // Prevent changes if not editing
    setHeaderConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [field]: value
      }
    }));
  };

  const handleImageAltTextChange = (index, value) => {
    if (!isEditing) return; // Prevent changes if not editing
    setHeaderConfig(prevConfig => {
      const updatedImages = [...prevConfig.images];
      updatedImages[index] = { ...updatedImages[index], altText: value };
      return { ...prevConfig, images: updatedImages };
    });
  };

  // --- Handler for Selecting New Image Files ---
  const handleNewImageFileChange = (e) => {
     if (!isEditing) return; // Prevent changes if not editing
    setNewImageFiles([...e.target.files]); // Store the File objects
    setError(null); // Clear previous errors
  };

  // --- Handler for Uploading Selected New Images ---
  const handleUploadNewImages = async () => {
      if (!isEditing) return; // Prevent upload if not editing

      if (newImageFiles.length === 0) {
          setError("No new files selected for upload.");
          return;
      }

      setIsUploadingNewImages(true);
      setError(null);
      const uploadedImageConfigs = []; // To collect successful uploads

      for (const file of newImageFiles) {
          const formData = new FormData();
          formData.append('image', file); // 'image' must match the field name in multer config (`upload.single('image')`)

          try {
              const response = await fetch(`${backendUrl}/api/staff/upload-image`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${staffToken}`, // Send auth token
                    // Do NOT set 'Content-Type' header for FormData - browser does it correctly
                  },
                  body: formData,
              });

              if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              // Add the new image URL and default alt text to our temporary list
              uploadedImageConfigs.push({ url: data.imageUrl, altText: file.name || '' }); // Use filename as default alt

          } catch (err) {
              console.error("Error uploading file:", file.name, err);
              setError(`Failed to upload ${file.name}: ${err.message}`);
              // Decide if you want to stop on first error or continue
              // For now, we'll continue but report the error.
          }
      }

      // Add successfully uploaded images to the main header config state
      setHeaderConfig(prevConfig => ({
          ...prevConfig,
          images: [...(prevConfig.images || []), ...uploadedImageConfigs] // Add new images to the end, handle potential initial empty array
      }));

      setNewImageFiles([]); // Clear the list of files waiting to be uploaded
      setIsUploadingNewImages(false);
      if (uploadedImageConfigs.length > 0 && !error) {
         setSuccessMessage(`Successfully uploaded ${uploadedImageConfigs.length} image(s). Remember to click "Save Configuration" to finalize changes.`);
         // Clear success message after a few seconds
         setTimeout(() => setSuccessMessage(null), 5000);
      }
  };


  // --- Handler for Removing an Existing Image ---
  const handleRemoveImage = (indexToRemove) => {
     if (!isEditing) return; // Prevent removal if not editing
    setHeaderConfig(prevConfig => ({
      ...prevConfig,
      images: prevConfig.images.filter((_, index) => index !== indexToRemove)
    }));
    // Note: This only removes it from the DB config on Save.
    // You'd need a separate backend call and logic to delete the *actual* file from storage.
    // For this example, removal is only finalized on Save.
  };

  // --- Handler for Saving the Entire Configuration ---
  const handleSaveConfig = async (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!headerConfig || !isEditing) return; // Don't save if config hasn't loaded or not in edit mode

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${backendUrl}/api/staff/updateheader`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${staffToken}`, // Send auth token
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(headerConfig), // Send the entire current state
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Update state with the potentially refreshed config from backend
      setHeaderConfig(data.data);
      setOriginalHeaderConfig(data.data); // Update original config as well

      setSuccessMessage("Header configuration updated successfully!");
      // Clear success message after a few seconds
      setTimeout(() => setSuccessMessage(null), 5000);

      setIsEditing(false); // Exit edit mode after successful save

    } catch (err) {
      console.error("Error saving header config:", err);
      setError(`Failed to save configuration: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handler for Canceling Edits ---
  const handleCancelEdit = () => {
    // Revert state to the original fetched configuration
    setHeaderConfig(originalHeaderConfig);
    setNewImageFiles([]); // Clear any pending new files
    setError(null); // Clear errors
    setSuccessMessage(null); // Clear messages
    setIsEditing(false); // Exit edit mode
  };


  // --- Render Method ---
  if (isLoading) {
    return <div className="p-6 text-center text-gray-700">Loading header configuration...</div>;
  }

  if (error && !headerConfig) { // Show error if no config was loaded at all
     return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  // If config is loaded, display the form (read-only or editable)
  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Header Configuration</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
       {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      {headerConfig && ( // Ensure headerConfig is not null before rendering the form
        <>
          {/* Edit/Save/Cancel Buttons */}
          <div className="mb-6 flex justify-end gap-4">
              {!isEditing && (
                  <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                      Edit Configuration
                  </button>
              )}
              {isEditing && (
                  <>
                      <button
                          type="button"
                          onClick={handleCancelEdit}
                           disabled={isSaving || isUploadingNewImages}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus::ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Cancel
                      </button>
                      <button
                          type="button" // Changed to type="button" to prevent form submission interference
                          onClick={handleSaveConfig}
                          disabled={isSaving || isUploadingNewImages}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isSaving ? 'Saving...' : 'Save Configuration'}
                      </button>
                  </>
              )}
          </div>

          {/* Wrap the form fields and image management in a way that applies readOnly/disabled */}
          <form onSubmit={handleSaveConfig} className={`${!isEditing ? 'pointer-events-none select-none' : ''}`}> {/* Optional: Visually indicate read-only */}

            {/* --- Images Management --- */}
            <div className={`mb-8 p-4 border rounded-md bg-gray-50 ${!isEditing ? 'opacity-75' : ''}`}> {/* Optional styling */}
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Header Images</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {(headerConfig.images || []).map((image, index) => (
                        <div key={image.url || index} className="relative border rounded-md overflow-hidden group">
                            <img
                                src={image.url}
                                alt={image.altText || 'Header Image'}
                                className="w-full h-40 object-cover"
                            />
                             <div className="p-2 bg-white">
                                 <label htmlFor={`alt-text-${index}`} className="block text-sm font-medium text-gray-700">Alt Text:</label>
                                 <input
                                     type="text"
                                     id={`alt-text-${index}`}
                                     value={image.altText}
                                     onChange={(e) => handleImageAltTextChange(index, e.target.value)}
                                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                     readOnly={!isEditing} // Read-only when not editing
                                 />
                             </div>
                            {isEditing && ( // Only show remove button when editing
                              <button
                                  type="button" // Important: Prevent form submission
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-100 group-hover:opacity-100 transition-opacity duration-200" // Always visible when editing
                                  aria-label={`Remove image ${index + 1}`}
                                  disabled={isSaving || isUploadingNewImages} // Disable while saving/uploading
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                              </button>
                            )}
                        </div>
                    ))}
                </div>

                <h4 className="text-lg font-medium mb-3 text-gray-700">Add New Images:</h4>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        multiple // Allow multiple file selection
                        onChange={handleNewImageFileChange}
                        className="block w-full text-sm text-gray-500
                                   file:mr-4 file:py-2 file:px-4
                                   file:rounded-full file:border-0
                                   file:text-sm file:font-semibold
                                   file:bg-indigo-50 file:text-indigo-700
                                   hover:file:bg-indigo-100"
                        disabled={!isEditing || isUploadingNewImages || isSaving} // Disable when not editing or busy
                    />
                    <button
                        type="button" // Important: Prevent form submission
                        onClick={handleUploadNewImages}
                        disabled={!isEditing || newImageFiles.length === 0 || isUploadingNewImages || isSaving} // Disable when not editing, no files, or busy
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploadingNewImages ? 'Uploading...' : `Upload ${newImageFiles.length} File(s)`}
                    </button>
                </div>
                {newImageFiles.length > 0 && isEditing && ( // Only show this helper text when editing and files are selected
                    <p className="text-sm text-gray-600 mt-2">
                        Selected for upload: {newImageFiles.map(f => f.name).join(', ')}
                    </p>
                )}
            </div>


            {/* --- Logged Out Content --- */}
            <div className={`mb-8 p-4 border rounded-md bg-gray-50 ${!isEditing ? 'opacity-75' : ''}`}> {/* Optional styling */}
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Logged Out Content</h3>
              <div className="mb-4">
                <label htmlFor="loggedOutHeading" className="block text-sm font-medium text-gray-700">Heading</label>
                <input
                  type="text"
                  id="loggedOutHeading"
                  value={headerConfig.loggedOutContent.heading}
                  onChange={(e) => handleContentChange('loggedOutContent', 'heading', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  readOnly={!isEditing} // Read-only when not editing
                />
              </div>
              <div>
                <label htmlFor="loggedOutParagraph" className="block text-sm font-medium text-gray-700">Paragraph</label>
                <textarea
                  id="loggedOutParagraph"
                  rows="3"
                  value={headerConfig.loggedOutContent.paragraph}
                  onChange={(e) => handleContentChange('loggedOutContent', 'paragraph', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  readOnly={!isEditing} // Read-only when not editing
                ></textarea>
              </div>
            </div>

            {/* --- Logged In Content --- */}
            <div className={`mb-8 p-4 border rounded-md bg-gray-50 ${!isEditing ? 'opacity-75' : ''}`}> {/* Optional styling */}
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Logged In Content</h3>
               <div className="mb-4">
                <label htmlFor="loggedInHeading" className="block text-sm font-medium text-gray-700">Heading (Appears before Username)</label>
                <input
                  type="text"
                  id="loggedInHeading"
                  value={headerConfig.loggedInContent.heading}
                  onChange={(e) => handleContentChange('loggedInContent', 'heading', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  readOnly={!isEditing} // Read-only when not editing
                />
              </div>
              <div>
                <label htmlFor="loggedInParagraph" className="block text-sm font-medium text-gray-700">Paragraph</label>
                <textarea
                  id="loggedInParagraph"
                  rows="3"
                  value={headerConfig.loggedInContent.paragraph}
                  onChange={(e) => handleContentChange('loggedInContent', 'paragraph', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                   readOnly={!isEditing} // Read-only when not editing
                ></textarea>
              </div>
            </div>

            {/* --- Logged Out Button --- */}
             <div className={`mb-8 p-4 border rounded-md bg-gray-50 ${!isEditing ? 'opacity-75' : ''}`}> {/* Optional styling */}
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Logged Out Button</h3>
              <div className="mb-4">
                <label htmlFor="loggedOutButtonText" className="block text-sm font-medium text-gray-700">Button Text</label>
                <input
                  type="text"
                  id="loggedOutButtonText"
                  value={headerConfig.loggedOutButton.text}
                  onChange={(e) => handleButtonChange('loggedOutButton', 'text', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                   readOnly={!isEditing} // Read-only when not editing
                />
              </div>
              <div>
                <label htmlFor="loggedOutButtonLink" className="block text-sm font-medium text-gray-700">Button Link (e.g., /#speciality or full URL)</label>
                <input
                  type="text"
                  id="loggedOutButtonLink"
                  value={headerConfig.loggedOutButton.link}
                  onChange={(e) => handleButtonChange('loggedOutButton', 'link', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                   readOnly={!isEditing} // Read-only when not editing
                />
              </div>
            </div>

            {/* --- Logged In Button --- */}
            <div className={`mb-8 p-4 border rounded-md bg-gray-50 ${!isEditing ? 'opacity-75' : ''}`}> {/* Optional styling */}
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Logged In Button</h3>
              <div className="mb-4">
                <label htmlFor="loggedInButtonText" className="block text-sm font-medium text-gray-700">Button Text</label>
                <input
                  type="text"
                  id="loggedInButtonText"
                  value={headerConfig.loggedInButton.text}
                  onChange={(e) => handleButtonChange('loggedInButton', 'text', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                   readOnly={!isEditing} // Read-only when not editing
                />
              </div>
              <div>
                <label htmlFor="loggedInButtonLink" className="block text-sm font-medium text-gray-700">Button Link (e.g., /#doctor-search-section or full URL)</label>
                <input
                  type="text"
                  id="loggedInButtonLink"
                  value={headerConfig.loggedInButton.link}
                  onChange={(e) => handleButtonChange('loggedInButton', 'link', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                   readOnly={!isEditing} // Read-only when not editing
                />
              </div>
            </div>

            {/* Note: The main Save button is now outside the form, triggered by handleSaveConfig */}
             {/* The form is still here to manage field elements, but submission is manual */}


          </form>

        </>
      )}
    </div>
  );
};

export default StaffHeaderConfig;