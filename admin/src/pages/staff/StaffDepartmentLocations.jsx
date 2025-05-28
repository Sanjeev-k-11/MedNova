// src/components/StaffDepartmentLocations.js
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Users, Bed, Clock, PlusCircle, Edit, Trash2, X } from 'lucide-react';

// Assuming your backend URL is correctly configured
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Optional: Basic modal component (can be more sophisticated)
const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto overflow-hidden">
                <div className="flex justify-between items-center border-b px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};


const StaffDepartmentLocations = () => {
    const staffToken = localStorage.getItem('authToken') || '';

    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // State for Modal/Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null); // null for Add, object for Edit
    const [formData, setFormData] = useState({
        name: '',
        floor: '',
        description: '',
        contact: '',
        hours: '',
        capacity: '',
        order: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Fetch Locations ---
    const fetchLocations = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // *** CORRECTED URL: Added '/departmentlocations' ***
            const response = await fetch(`${backendUrl}/api/staff/departmentlocations/list`, {
                headers: { 'Authorization': `Bearer ${staffToken}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setLocations(data.data); // Assuming data.data is the array of locations

        } catch (err) {
            console.error("Error fetching locations:", err);
            setError(`Failed to fetch locations: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (staffToken) {
            fetchLocations();
        } else {
            setIsLoading(false);
            setError("Staff authentication token not found. Please log in.");
        }
    }, [staffToken]); // Fetch on mount or if token changes

    // --- Form Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openAddModal = () => {
        setEditingLocation(null); // Ensure we're in add mode
        setFormData({ // Reset form fields
            name: '',
            floor: '',
            description: '',
            contact: '',
            hours: '',
            capacity: '',
            order: locations.length > 0 ? Math.max(...locations.map(loc => loc.order || 0)) + 1 : 0, // Suggest next order
        });
        setIsModalOpen(true);
        setError(null); // Clear errors from previous actions
        setSuccessMessage(null);
    };

    const openEditModal = (location) => {
        setEditingLocation(location); // Set the location being edited
        setFormData({ // Populate form with location data
            name: location.name || '',
            floor: location.floor || '',
            description: location.description || '',
            contact: location.contact || '',
            hours: location.hours || '',
            capacity: location.capacity || '',
            order: location.order || 0,
        });
        setIsModalOpen(true);
        setError(null); // Clear errors
        setSuccessMessage(null);
    };

    const closeLodal = () => { // Changed function name to avoid conflict
        setIsModalOpen(false);
        setEditingLocation(null); // Clear editing state
        setFormData({ // Reset form state
            name: '', floor: '', description: '', contact: '', hours: '', capacity: '', order: 0
        });
        // Don't clear main error/success here, only within modal context if applicable
    };


    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        const method = editingLocation ? 'PUT' : 'POST';
        // *** CORRECTED URLS: Added '/departmentlocations' for both POST and PUT ***
        const url = editingLocation
            ? `${backendUrl}/api/staff/departmentlocations/${editingLocation._id}` // PUT URL
            : `${backendUrl}/api/staff/departmentlocations/create`; // POST URL


        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${staffToken}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // If successful, refetch data and close modal
            await fetchLocations(); // Simple approach: refetch all
            setSuccessMessage(`Location ${editingLocation ? 'updated' : 'added'} successfully!`);
            closeLodal(); // Close the modal

            // Clear success message after a delay
            setTimeout(() => setSuccessMessage(null), 5000);

        } catch (err) {
            console.error(`Error ${editingLocation ? 'updating' : 'creating'} location:`, err);
            setError(`Failed to ${editingLocation ? 'update' : 'add'} location: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Delete Location ---
    const handleDeleteLocation = async (locationId) => {
        if (!window.confirm('Are you sure you want to delete this location?')) {
            return;
        }

        setIsLoading(true); // Could use a more specific state for deleting one item
        setError(null);
        setSuccessMessage(null);

        try {
            // *** CORRECTED URL: Added '/departmentlocations' ***
            const response = await fetch(`${backendUrl}/api/staff/departmentlocations/${locationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${staffToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // Remove the deleted location from state directly or refetch
            // Option 1: Refetch (simpler)
            await fetchLocations();
            setSuccessMessage("Location deleted successfully!");
             // Clear success message after a delay
            setTimeout(() => setSuccessMessage(null), 5000);


            // Option 2: Filter from state (more performant for large lists)
            // setLocations(prevLocations => prevLocations.filter(loc => loc._id !== locationId));
            // setIsLoading(false);
            // setSuccessMessage("Location deleted successfully!");

        } catch (err) {
            console.error("Error deleting location:", err);
            setError(`Failed to delete location: ${err.message}`);
            setIsLoading(false); // Stop loading indicator if using option 1 error occurred
        }
    };


    // --- Render Method ---
    // Keep the initial loading/error checks
    if (isLoading && locations.length === 0 && !error) {
        return <div className="p-6 text-center text-gray-700">Loading department locations...</div>;
    }

    if (error && locations.length === 0) {
         // If initial fetch failed AND there are no locations to display from a previous load
         // Note: The main error state is shown outside the modal below.
         // This check is primarily for the very first load failing.
        return <div className="p-6 text-center text-red-600">Error loading locations: {error}</div>;
    }


    return (
        <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Department Locations</h2>

            {/* Main Error/Success Messages (Outside Modal) */}
            {error && isModalOpen === false && ( // Only show main error if modal is closed
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

            {/* Add New Button */}
            <div className="mb-6 text-right">
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add New Location
                </button>
            </div>

            {/* Locations List */}
            {/* Only show list or empty message if not in the initial loading state */}
            {!isLoading && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.length > 0 ? (
                        locations.map((location) => (
                            <div
                                key={location._id} // Use Mongoose _id as key
                                className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
                            >
                                <div> {/* Content area */}
                                    <div className="flex items-start">
                                        <MapPin className="h-6 w-6 text-cyan-600 mt-1 shrink-0" /> {/* Use shrink-0 */}
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">{location.name}</h3>
                                            <p className="text-sm text-cyan-600 mb-2">{location.floor}</p>
                                            <p className="text-sm text-gray-600 mb-4">{location.description}</p>

                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone className="h-4 w-4 mr-2 shrink-0" /> {/* Use shrink-0 */}
                                                    <span>{location.contact || 'N/A'}</span> {/* Display N/A if empty */}
                                                </div>

                                                {(location.capacity || location.name.includes('Conference') || location.name.includes('Bed') || location.name.includes('Room')) && ( // Check if capacity exists or name suggests capacity
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        {location.name.includes('Conference') ? (
                                                            <Users className="h-4 w-4 mr-2 shrink-0" />
                                                        ) : (
                                                            <Bed className="h-4 w-4 mr-2 shrink-0" />
                                                        )}
                                                        <span>Capacity: {location.capacity || 'Not Specified'}</span> {/* Display if capacity exists */}
                                                    </div>
                                                )}

                                                {(location.hours || location.name.includes('24/7')) && ( // Check if hours exists or name suggests hours
                                                     <div className="flex items-center text-sm text-gray-600">
                                                        <Clock className="h-4 w-4 mr-2 shrink-0" />
                                                        <span>Hours: {location.hours || 'Not Specified'}</span> {/* Display if hours exists */}
                                                    </div>
                                                )}

                                                {/* Optional: Display Order */}
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <span>Order: {location.order || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Area */}
                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                                    <button
                                        onClick={() => openEditModal(location)}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        disabled={isSubmitting || isLoading}
                                    >
                                        <Edit className="h-4 w-4 mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLocation(location._id)}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                         disabled={isSubmitting || isLoading}
                                    >
                                         {isLoading ? 'Deleting...' : (<><Trash2 className="h-4 w-4 mr-1" /> Delete</>)} {/* Show deleting state */}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                         // Only show empty message if not loading and no locations
                         !isLoading && !error && (
                             <div className="md:col-span-2 lg:col-span-3 text-center text-gray-600">
                                 No department locations found. Click "Add New Location" to add one.
                             </div>
                         )
                    )}
                </div>
            )}


            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeLodal}
                title={editingLocation ? 'Edit Location' : 'Add New Location'}
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                        />
                    </div>
                     <div>
                        <label htmlFor="floor" className="block text-sm font-medium text-gray-700">Floor</label>
                        <input
                            type="text"
                            id="floor"
                            name="floor"
                            value={formData.floor}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                        />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleInputChange}
                             required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact (Optional)</label>
                        <input
                            type="text"
                            id="contact"
                            name="contact"
                            value={formData.contact}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                        />
                    </div>
                     <div>
                        <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Hours (Optional)</label>
                        <input
                            type="text"
                            id="hours"
                            name="hours"
                            value={formData.hours}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                        />
                    </div>
                     <div>
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity (Optional, e.g. "12 beds", "20 people")</label>
                        <input
                            type="text"
                            id="capacity"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="order" className="block text-sm font-medium text-gray-700">Display Order</label>
                        <input
                            type="number"
                            id="order"
                            name="order"
                            value={formData.order}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                        />
                    </div>


                    {/* Error message shown only WITHIN the modal */}
                    {error && isModalOpen && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                           <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={closeLodal}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                             disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (editingLocation ? 'Update Location' : 'Add Location')}
                        </button>
                    </div>
                </form>
            </Modal>

             {/* Optional: Original static DepartmentMap content can go here if you want to keep it below the management section */}
             {/* <div className="mt-12">
                 <h2 className="text-2xl font-bold mb-6 text-gray-800">Current Public View Structure (Static)</h2>
                 // ... paste your original DepartmentMap JSX here if needed for reference or display
             </div> */}

        </div>
    );
};

export default StaffDepartmentLocations;