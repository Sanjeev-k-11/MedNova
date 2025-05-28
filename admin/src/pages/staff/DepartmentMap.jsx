import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import HeroSection from '../../components/HeroSection';
import { MapPin, Phone, Users, Bed, Clock } from 'lucide-react';
import Navbar from '../../components/DNavbar';

// Assuming your backend URL is correctly configured
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// You no longer need the static 'locations' array here
// const locations = [...]

const DepartmentMap = () => {
  // State to hold the fetched locations
  const [locations, setLocations] = useState([]);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  // State for error handling
  const [error, setError] = useState(null);

  // Get the staff authentication token from localStorage
  // NOTE: This makes the public map require staff login.
  // For a truly public map, the backend endpoint should NOT require authentication.
  const staffToken = localStorage.getItem('authToken') || ''; // Still needed if the backend route requires it

  // --- Fetch Locations from Backend ---
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true); // Start loading
      setError(null); // Clear previous errors

      // Check if staffToken exists, as the backend route requires it
      if (!staffToken) {
          setIsLoading(false);
          setError("Authentication token not found. Cannot fetch locations.");
          // You might want to redirect to login or show a specific message
          return;
      }


      try {
        // *** Fetching from the backend API endpoint ***
        const response = await fetch(`${backendUrl}/api/staff/departmentlocations/list`, {
           headers: {
             'Authorization': `Bearer ${staffToken}`, // Include staff token as required by your backend route
             'Content-Type': 'application/json', // Although GET doesn't need body, good practice
           },
        });

        if (!response.ok) {
          // If the response is not okay (e.g., 401, 404, 500)
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Assuming the response structure is { success: true, data: [...] }
        setLocations(data.data);

      } catch (err) {
        console.error("Error fetching department locations:", err);
        setError(`Failed to load department locations: ${err.message}`);
      } finally {
        setIsLoading(false); // Finish loading regardless of success or failure
      }
    };

    fetchLocations(); // Call the fetch function when the component mounts

  }, [staffToken]); // Dependency array: re-run effect if staffToken changes (unlikely here)


  // --- Render Method ---
  // Show loading message while data is being fetched
  if (isLoading) {
    return <div className="pt-16 text-center text-gray-700">Loading department map...</div>;
  }

  // Show error message if fetching failed and no locations were loaded
  if (error) {
     return (
       <div className="pt-16 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
           <strong className="font-bold">Error:</strong>
           <span className="block sm:inline"> {error}</span>
         </div>
       </div>
     );
  }


  // Render the map content if data loaded successfully (even if empty)
  return (
    <>
    <Navbar /> 
    <div className="pt-16">
      {/* Hero Section (can remain static or be fetched if configurable) */}
      <HeroSection
        title="Department Map"
        subtitle="Navigate the nursing wing facilities and locations"
        image="https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg"
      />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Floor Plan Overview</h2>
            <p className="mt-2 text-gray-600">
              The Nursing Wing is located on the 3rd floor of the hospital's main building.
              Use this guide to locate different areas within the department.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Map over the fetched locations */}
              {locations.length > 0 ? (
                 locations.map((location) => (
                    <div
                      // Use Mongoose _id as the key, fall back to index if needed
                      key={location._id || location.id}
                      className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start">
                        <MapPin className="h-6 w-6 text-cyan-600 mt-1 shrink-0" /> {/* Use shrink-0 to prevent icon scaling */}
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{location.name}</h3>
                          <p className="text-sm text-cyan-600 mb-2">{location.floor}</p>
                          <p className="text-sm text-gray-600 mb-4">{location.description}</p>

                          <div className="space-y-2">
                            {location.contact && ( // Only display if contact exists
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-4 w-4 mr-2 shrink-0" />
                                  <span>{location.contact}</span>
                                </div>
                            )}


                            {(location.capacity || (location.name && (location.name.includes('Conference') || location.name.includes('Bed') || location.name.includes('Room')))) && (
                              <div className="flex items-center text-sm text-gray-600">
                                {location.name && location.name.includes('Conference') ? (
                                  <Users className="h-4 w-4 mr-2 shrink-0" />
                                ) : (
                                  <Bed className="h-4 w-4 mr-2 shrink-0" />
                                )}
                                <span>Capacity: {location.capacity || 'Not Specified'}</span>
                              </div>
                            )}


                            {location.hours && ( // Only display if hours exists
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="h-4 w-4 mr-2 shrink-0" />
                                  <span>Hours: {location.hours}</span>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                 // Message if no locations are found after loading
                 !isLoading && (
                    <div className="md:col-span-full lg:col-span-full text-center text-gray-600"> {/* Use full span for message */}
                        No department locations configured.
                    </div>
                 )
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tips (can remain static) */}
        <div className="bg-cyan-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-cyan-900 mb-2">Navigation Tips</h3>
          <ul className="space-y-2 text-cyan-800">
            <li className="flex items-center">
              <span className="h-2 w-2 bg-cyan-600 rounded-full mr-2 shrink-0"></span>
              Follow the color-coded signs throughout the floor
            </li>
            <li className="flex items-center">
              <span className="h-2 w-2 bg-cyan-600 rounded-full mr-2 shrink-0"></span>
              Main nursing station staff can provide directions
            </li>
            <li className="flex items-center">
              <span className="h-2 w-2 bg-cyan-600 rounded-full mr-2 shrink-0"></span>
              Emergency exits are clearly marked in red
            </li>
          </ul>
        </div>
      </div>
    </div>
    </>
  );
};

export default DepartmentMap;