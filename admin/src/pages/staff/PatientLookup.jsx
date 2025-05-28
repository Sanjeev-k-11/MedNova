// src/components/PatientLookup.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSearch, FaFilter, FaTimes, FaUser, FaCalendarAlt, FaStethoscope,
  FaArrowRight, FaSpinner, FaExclamationCircle, FaUserClock, FaStar, FaUserPlus
} from 'react-icons/fa';

// --- Mock Patient Data (Replace with API Data) ---
const mockPatients = [
  { id: 'P1001', name: 'Alice Wonderland', age: 34, gender: 'Female', lastVisit: '2023-10-15', condition: 'Migraine', avatar: null },
  { id: 'P1002', name: 'Bob The Builder', age: 52, gender: 'Male', lastVisit: '2023-09-28', condition: 'Hypertension', avatar: null },
  { id: 'P1003', name: 'Charlie Chaplin', age: 65, gender: 'Male', lastVisit: '2023-10-20', condition: 'Arthritis', avatar: null },
  { id: 'P1004', name: 'Diana Prince', age: 29, gender: 'Female', lastVisit: '2023-08-05', condition: 'Asthma', avatar: null },
  { id: 'P1005', name: 'Edward Scissorhands', age: 41, gender: 'Male', lastVisit: '2023-10-26', condition: 'Check-up', avatar: null },
];

// --- Helper Function (Simulated API call) ---
const fetchPatientsAPI = async (searchTerm, filters) => {
  console.log("Fetching patients with:", { searchTerm, filters });
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 700));

  // Basic filtering simulation (implement robust filtering on backend)
  let results = mockPatients.filter(p => {
    const term = searchTerm.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(term);
    const idMatch = p.id.toLowerCase().includes(term);
    // Add phone/email match if data exists

    // Basic filter matching (example)
    let filterMatch = true;
    if (filters.diagnosis && filters.diagnosis !== '' && p.condition.toLowerCase() !== filters.diagnosis.toLowerCase()) {
        filterMatch = false;
    }
    if (filters.ageMin && p.age < parseInt(filters.ageMin)) {
        filterMatch = false;
    }
     if (filters.ageMax && p.age > parseInt(filters.ageMax)) {
        filterMatch = false;
    }
    // Add more filter logic (date ranges etc.)

    return (nameMatch || idMatch) && filterMatch;
  });

  // Simulate potential error
  // if (searchTerm.toLowerCase() === 'error') {
  //   throw new Error("Simulated API Error");
  // }

  return results;
};


// --- Patient Card Component ---
function PatientCard({ patient, onViewRecord }) {
    // Placeholder avatar color based on name
    const avatarColor = (name) => {
        const colors = ['bg-blue-200', 'bg-green-200', 'bg-red-200', 'bg-yellow-200', 'bg-indigo-200', 'bg-purple-200', 'bg-pink-200'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
     const darkAvatarColor = (name) => {
        const colors = ['dark:bg-blue-800', 'dark:bg-green-800', 'dark:bg-red-800', 'dark:bg-yellow-800', 'dark:bg-indigo-800', 'dark:bg-purple-800', 'dark:bg-pink-800'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
      {/* Left side: Avatar and Info */}
      <div className="flex items-center space-x-3 flex-grow">
        {/* Avatar Placeholder */}
        <div className={`w-12 h-12 rounded-full flex-shrink-0 ${avatarColor(patient.name)} ${darkAvatarColor(patient.name)} flex items-center justify-center`}>
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">{getInitials(patient.name)}</span>
        </div>
        {/* Patient Details */}
        <div className="flex-grow">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{patient.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {patient.age} years old, {patient.gender} - ID: {patient.id}
          </p>
           <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs items-center">
             <span className="flex items-center text-gray-500 dark:text-gray-400">
               <FaCalendarAlt className="mr-1" /> Last Visit: {patient.lastVisit || 'N/A'}
             </span>
              <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-medium">
                <FaStethoscope className="mr-1" /> {patient.condition || 'No Diagnosis'}
              </span>
          </div>
        </div>
      </div>

      {/* Right side: Action Button */}
      <div className="w-full sm:w-auto flex-shrink-0">
        <button
          onClick={() => onViewRecord(patient.id)}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-150 ease-in-out"
        >
          View Record <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
}


// --- Main Patient Lookup Component ---
function PatientLookup() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    ageMin: '',
    ageMax: '',
    diagnosis: '',
    // Add more filters as needed
  });
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false); // Track if initial search/filter applied

  // Debounce search term (optional but recommended for real API)
  // Implement debouncing here if needed using lodash/debounce or custom hook

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
     setFilters({ dateFrom: '', dateTo: '', ageMin: '', ageMax: '', diagnosis: '' });
     // Optionally trigger search again with cleared filters if needed
     // fetchPatients(searchTerm, {}); // Uncomment if auto-search on clear is desired
  };

  const fetchPatients = useCallback(async (term, currentFilters) => {
    setIsLoading(true);
    setError(null);
    setSearchPerformed(true); // Mark that a search attempt was made
    try {
      const results = await fetchPatientsAPI(term, currentFilters);
      setPatients(results);
    } catch (err) {
      setError(err.message || "Failed to fetch patient data.");
      setPatients([]); // Clear previous results on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies for useCallback if needed

  // Handle search/filter submission
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Prevent form submission if wrapped in form
    fetchPatients(searchTerm, filters);
  };

  // Initial Load (Optional: fetch recent patients or trigger empty search)
  // useEffect(() => {
  //   // fetchPatients('', {}); // Example: Load initial view
  // }, [fetchPatients]);

  return (
    <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-5">
        Patient Lookup
      </h1>

      {/* --- Search and Filter Section --- */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Name, ID, Phone, Email..."
            className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          {/* Optional: Add explicit search button if not using onSubmit */}
           {/* <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 ...">Search</button> */}
        </form>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
        >
          <FaFilter className="mr-1.5" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Filter Controls (Conditional Rendering) */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Example Filters */}
            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</label>
              <input type="text" name="diagnosis" id="diagnosis" value={filters.diagnosis} onChange={handleFilterChange} className="filter-input" placeholder="e.g., Hypertension" />
            </div>
            <div>
              <label htmlFor="ageMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Age</label>
              <input type="number" name="ageMin" id="ageMin" value={filters.ageMin} onChange={handleFilterChange} className="filter-input" placeholder="e.g., 30" />
            </div>
             <div>
              <label htmlFor="ageMax" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Age</label>
              <input type="number" name="ageMax" id="ageMax" value={filters.ageMax} onChange={handleFilterChange} className="filter-input" placeholder="e.g., 65" />
            </div>
             <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visit Date From</label>
              <input type="date" name="dateFrom" id="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="filter-input" />
            </div>
             <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visit Date To</label>
              <input type="date" name="dateTo" id="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="filter-input" />
            </div>

            {/* Filter Actions */}
            <div className="col-span-full flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
                 <button
                    onClick={clearFilters}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center"
                  >
                   <FaTimes className="mr-1.5" /> Clear Filters
                 </button>
                 <button
                    onClick={handleSearchSubmit} // Re-use search submit logic to apply filters
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center"
                  >
                    <FaFilter className="mr-1.5" /> Apply Filters
                 </button>
            </div>
          </div>
        )}
      </div>

       {/* --- Optional Shortcuts --- */}
        <div className="mb-6 flex flex-wrap gap-2">
             <button className="shortcut-button">
                <FaUserClock className="mr-1.5" /> Recently Viewed
             </button>
              <button className="shortcut-button">
                <FaStar className="mr-1.5 text-yellow-500" /> Critical Patients
             </button>
              <button className="shortcut-button">
                <FaUserPlus className="mr-1.5" /> New Registrations
             </button>
        </div>

      {/* --- Results Section --- */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex justify-center items-center py-10 text-gray-500 dark:text-gray-400">
            <FaSpinner className="animate-spin text-2xl mr-3" />
            <span>Loading patients...</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-r-md shadow-sm" role="alert">
            <div className="flex items-center">
              <FaExclamationCircle className="mr-2" />
              <p className="font-semibold">Error:</p>
            </div>
            <p className="text-sm ml-6">{error}</p>
          </div>
        )}

        {!isLoading && !error && searchPerformed && patients.length === 0 && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">No patients found</p>
            <p className="text-sm">Try adjusting your search term or filters.</p>
          </div>
        )}
         {!isLoading && !error && !searchPerformed && patients.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 italic">
            <p>Enter a search term or apply filters to find patients.</p>
          </div>
        )}

        {!isLoading && !error && patients.length > 0 && (
          patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onViewRecord={(id) => alert(`Navigate to patient record: ${id}`)} // Replace with actual navigation
            />
          ))
        )}
      </div>

      {/* Helper CSS Classes (Optional) */}
       <style jsx global>{`
        .filter-input {
           display: block;
           width: 100%;
           padding: 0.5rem 0.75rem;
           font-size: 0.875rem;
           line-height: 1.25rem;
           color: #1f2937; /* text-gray-800 */
           background-color: #ffffff; /* bg-white */
           border: 1px solid #d1d5db; /* border-gray-300 */
           border-radius: 0.375rem; /* rounded-md */
           box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        }
        .dark .filter-input {
            color: #f3f4f6; /* dark:text-gray-100 */
            background-color: #374151; /* dark:bg-gray-700 */
            border-color: #4b5563; /* dark:border-gray-600 */
            /* Fix for date input text color in dark mode */
             color-scheme: dark;
        }
        .filter-input:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            border-color: #3b82f6; /* focus:border-blue-500 */
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* focus:ring-blue-500 focus:ring-opacity-50 */
        }
         .shortcut-button {
            display: inline-flex;
            align-items: center;
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
            font-weight: 500;
            color: #4b5563; /* text-gray-600 */
            background-color: #f3f4f6; /* bg-gray-100 */
            border: 1px solid #e5e7eb; /* border-gray-200 */
            border-radius: 9999px; /* rounded-full */
            transition: all 0.15s ease-in-out;
         }
          .dark .shortcut-button {
            color: #d1d5db; /* dark:text-gray-300 */
            background-color: #374151; /* dark:bg-gray-700 */
             border-color: #4b5563; /* dark:border-gray-600 */
         }
          .shortcut-button:hover {
             background-color: #e5e7eb; /* hover:bg-gray-200 */
             border-color: #d1d5db; /* hover:border-gray-300 */
             color: #1f2937; /* hover:text-gray-800 */
          }
           .dark .shortcut-button:hover {
             background-color: #4b5563; /* dark:hover:bg-gray-600 */
             border-color: #6b7280; /* dark:hover:border-gray-500 */
             color: #f9fafb; /* dark:hover:text-gray-50 */
          }
           .shortcut-button:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 */
           }
      `}</style>
    </div>
  );
}

export default PatientLookup;