import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";
import { FaTrash } from "react-icons/fa";
import { Loader2, Download, Search, X, Info } from 'lucide-react'; // Added icons

// --- Import Excel Libraries ---
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Simple Spinner component (can be reused or replace with your app's standard spinner)
const Spinner = ({ size = 'h-8 w-8', color = 'text-indigo-600 dark:text-indigo-400' }) => (
    <div className="flex justify-center items-center py-10">
        <Loader2 className={`animate-spin ${size} ${color}`} />
    </div>
);


const DoctorList = () => {
    // Assuming AdminContext provides doctors, token, loadingDoctors, and functions
    // Added loadingDoctors which is common when fetching data via context
    const { doctors, token, getAllDoctors, changeAvailability, deleteDoctor, loadingDoctors } = useContext(AdminContext);
    const [search, setSearch] = useState("");
    const [availableFilter, setAvailableFilter] = useState("all");
    const [showDelete, setShowDelete] = useState(false);
    const navigate = useNavigate();

    // Use loadingDoctors from context if available, otherwise manage local loading if context doesn't provide it
    const isLoading = loadingDoctors; // Assuming loadingDoctors is provided by context


    useEffect(() => {
        // Ensure token and the fetch function are available before calling
        if (token && getAllDoctors) {
            getAllDoctors();
        }
    }, [token, getAllDoctors]); // Dependency on token and getAllDoctors


    // Calculate counts based on the full list (not filtered)
    const availableCount = doctors.filter(doc => doc.available).length;
    const unavailableCount = doctors.length - availableCount;

    // Memoize the filtering logic for performance
    const filteredDoctors = useMemo(() => {
        return doctors.filter((doc) => {
            const lowerSearch = search.toLowerCase();
            // Added more fields to search for better usability
            const matchesSearch =
                (doc.name?.toLowerCase() || '').includes(lowerSearch) ||
                (doc.speciality?.toLowerCase() || '').includes(lowerSearch) ||
                (doc.email?.toLowerCase() || '').includes(lowerSearch) ||
                (doc.phone?.toLowerCase() || '').includes(lowerSearch);


            const matchesAvailability =
                availableFilter === "all" ||
                (availableFilter === "available" && doc.available) ||
                (availableFilter === "notAvailable" && !doc.available);

            return matchesSearch && matchesAvailability;
        });
    }, [doctors, search, availableFilter]); // Dependencies for memoization


    // --- Excel Export Function ---
     const handleExportToExcel = useCallback(() => {
        if (!filteredDoctors || filteredDoctors.length === 0) {
            toast.info("No doctor data matching current filters to export.");
            return;
        }

        // Prepare data for the worksheet
        const dataForExport = filteredDoctors.map(doctor => {
            return {
                'Name': doctor.name || 'N/A',
                'Speciality': doctor.speciality || 'N/A',
                'Email Address': doctor.email || 'N/A',
                'Phone Number': doctor.phone || 'N/A',
                'Available': doctor.available ? 'Yes' : 'No', // Convert boolean to readable string
                'Created Date': doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A', // Format date
                // Include other relevant fields if needed
                // '_id': doctor._id, // Can include ID if necessary
                // 'Address': doctor.address || 'N/A',
                // 'City': doctor.city || 'N/A',
                // 'State': doctor.state || 'N/A',
                // 'Zip Code': doctor.zipCode || 'N/A',
            };
        });

        // Define the desired headers explicitly for order and labels in the Excel file
        const headers = [
             'Name',
             'Speciality',
             'Email Address',
             'Phone Number',
             'Available',
             'Created Date'
             // Add headers for any other fields added above
        ];

        // Create a worksheet from the data with headers
        const ws = XLSX.utils.json_to_sheet(dataForExport, { header: headers });

         // Optional: Auto-fit column widths - simple estimate
         const colWidths = headers.map(header => {
             const maxLength = Math.max(header.length, ...dataForExport.map(row => String(row[header]).length));
             // Provide a base width and cap it at a reasonable size (e.g., 40-50)
             return { wch: Math.min(maxLength + 2, 50) };
         });
         ws['!cols'] = colWidths;


        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Doctors List"); // Sheet name

        // Generate the Excel file (Blob)
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        // Generate a filename based on filters (optional, provides context)
        let filename = 'doctors_export';
        if (search) filename += '_search';
        if (availableFilter !== 'all') filename += `_${availableFilter}`;
        // Add current date to the filename
        filename += `_${new Date().toISOString().slice(0, 10)}.xlsx`;

        // Trigger download using file-saver
        saveAs(blob, filename);

        toast.success(`Exported ${filteredDoctors.length} doctors.`);

    }, [filteredDoctors, search, availableFilter]); // Dependencies for useCallback


    // Render message when no doctors found after initial loading
     const renderNoDoctorsMessage = () => {
         let message = "No doctor records found.";
         // If the full list has items but the filtered list is empty, indicate filters caused it
         if (doctors.length > 0 && filteredDoctors.length === 0) {
             message = "No doctors match the current filter criteria.";
         }

         return (
              <div className="flex flex-col items-center justify-center py-16 text-center col-span-full bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                 <Info className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                 <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Doctors Found</h3>
                 <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">{message}</p>
                 {/* Optional: Add a button to clear filters if applicable */}
                 {(search || availableFilter !== 'all') && (
                      <button
                         onClick={() => { setSearch(''); setAvailableFilter('all'); }}
                         className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 dark:focus:ring-offset-gray-900"
                      >
                          <X className="mr-2 h-4 w-4" /> Clear Filters
                      </button>
                 )}
             </div>
         );
     };


    // Show initial loading spinner if no data yet
    if (isLoading && doctors.length === 0) {
        return <Spinner />;
    }


    return (
        // Changed overflow-y-scroll to overflow-y-auto for better browser default behavior
        <div className="container mx-auto p-4 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3"> {/* Use flex-col/row for responsiveness */}
                <div className="flex items-center gap-4">
                     {/* Display total count from the *full* list */}
                     <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All Doctors ({doctors.length})</h1>
                     {/* Display counts based on the full list */}
                     <span className="text-sm text-gray-600 dark:text-gray-400">
                         Available: {availableCount} | Unavailable: {unavailableCount}
                     </span>
                </div>

                <div className="flex items-center gap-4"> {/* Container for action buttons */}
                     {/* Export to Excel Button */}
                     <button
                         onClick={handleExportToExcel}
                         disabled={isLoading || filteredDoctors.length === 0} // Disable when loading or no data to export
                         className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150"
                         title="Export filtered doctor list to Excel"
                         aria-label={`Export ${filteredDoctors.length} doctors to Excel`}
                     >
                         <Download size={16} className="mr-2"/>
                         Export ({filteredDoctors.length}) {/* Show count of filtered doctors */}
                     </button>

                     {/* Toggle Delete Mode Button */}
                    <button
                         onClick={() => setShowDelete(!showDelete)}
                         className={`px-4 py-2 border rounded-md text-sm font-medium shadow-sm transition-colors duration-150 ${showDelete
                             ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500 dark:border-red-700'
                             : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 focus:ring-indigo-500'
                         } focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
                         title={showDelete ? "Hide Delete Buttons" : "Show Delete Buttons"}
                         aria-pressed={showDelete} // For accessibility
                    >
                         <FaTrash className={`inline-block mr-2 ${showDelete ? 'text-white' : 'text-red-500'}`}/> {/* Icon color changes */}
                         {showDelete ? 'Hide Delete' : 'Show Delete'}
                     </button>
                </div>
            </div>

            <hr className="border-gray-300 dark:border-gray-700 mb-4"/>


            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4"> {/* Use flex-col/row for responsiveness */}
                <div className="relative w-full sm:w-1/2"> {/* Full width on small, half on medium+ */}
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, specialty, email, or phone..." // Updated placeholder
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                         aria-label="Search doctors by keyword" // Accessibility label
                    />
                     {/* Clear Search Button */}
                     {search && (
                        <button onClick={() => setSearch('')} title="Clear Search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" aria-label="Clear search input">
                            <X size={16} />
                        </button>
                     )}
                </div>

                 {/* Availability Filter */}
                <select
                    value={availableFilter}
                    onChange={(e) => setAvailableFilter(e.target.value)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 sm:w-auto w-full" // Full width on small, auto on medium+
                     aria-label="Filter by availability status" // Accessibility label
                >
                    <option value="all">All</option>
                    <option value="available">Available</option>
                    <option value="notAvailable">Not Available</option>
                </select>
            </div>

            {/* Doctor List Grid */}
            {/* Conditional rendering based on loading state and filtered results */}
            {isLoading && filteredDoctors.length === 0 ? (
                 // Show spinner only if initial load and no data
                 <Spinner />
            ) : (
                 // Show doctors grid or no results message
                 <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-5"> {/* Responsive grid columns */}
                     {isLoading && filteredDoctors.length > 0 && (
                         // Show subtle spinner overlay if refreshing data but list isn't empty
                         <div className="col-span-full flex justify-center items-center py-5">
                              <Spinner size="h-6 w-6" color="text-blue-500 dark:text-blue-400"/>
                              <span className="ml-3 text-gray-700 dark:text-gray-300">Updating list...</span>
                         </div>
                     )}

                     {filteredDoctors.length > 0 ? (
                         filteredDoctors.map((item) => ( // Removed index, use _id for key
                             <div
                                 key={item._id} // Use _id as key
                                 className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-md transition duration-300 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer flex flex-col" // Added flex-col
                                 onClick={() => navigate(`/doctor-details/${item._id}`)}
                             >
                                 {/* Image Container */}
                                 <div className="relative w-full h-56 overflow-hidden rounded-t-lg flex-shrink-0"> {/* flex-shrink-0 to prevent image squishing */}
                                     <img
                                         src={item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name||'D')}&background=random&color=fff&font-size=0.5`} // Fallback avatar
                                         alt={item.name || 'Doctor'}
                                         className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                          onError={(e) => { e.target.onerror = null; e.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(item.name||'D')}&background=random&color=fff&font-size=0.5`; }} // Handle image errors
                                     />
                                     <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 transition duration-300"></div> {/* Slightly less opaque overlay */}
                                 </div>

                                 {/* Doctor Info */}
                                 <div className="p-4 text-center flex flex-col items-center flex-grow"> {/* flex-grow to push delete button down */}
                                     <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{item.name || 'N/A'}</p>
                                     <p className="text-sm text-gray-500 dark:text-gray-400">{item.speciality || 'N/A'}</p>

                                     {/* Availability Toggle */}
                                     {/* Made toggle container clickable and added stopPropagation */}
                                     <div
                                         className="flex items-center justify-center mt-3 cursor-pointer select-none"
                                         onClick={(e) => {
                                             e.stopPropagation(); // Prevent card click when clicking toggle
                                             changeAvailability(item._id);
                                         }}
                                          aria-label={item.available ? `Toggle ${item.name||'doctor'} unavailable` : `Toggle ${item.name||'doctor'} available`}
                                     >
                                         <input
                                             type="checkbox"
                                             checked={item.available}
                                             // ReadOnly because the parent div handles the click
                                             readOnly
                                             className="mr-2 accent-blue-500 cursor-pointer h-4 w-4" // Added h-4 w-4 for larger click area
                                         />
                                         <p className="text-sm text-gray-600 dark:text-gray-300">Available</p>
                                     </div>

                                     {/* Delete Button (Conditional) */}
                                     {showDelete && (
                                         <button
                                             onClick={(e) => {
                                                 e.stopPropagation(); // Prevent card click
                                                 if (window.confirm(`Are you sure you want to delete Dr. ${item.name}? This action cannot be undone.`)) {
                                                     deleteDoctor(item._id);
                                                 }
                                             }}
                                             disabled={isLoading} // Disable delete button while overall list is loading/updating
                                             className="mt-auto px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed" // Added mt-auto, disabled state
                                             aria-label={`Delete Dr. ${item.name||'doctor'}`}
                                         >
                                             Delete
                                         </button>
                                     )}
                                 </div>
                             </div>
                         ))
                     ) : (
                         // Show no results message if not loading and the filtered list is empty
                         !isLoading && renderNoDoctorsMessage()
                     )}
                 </div>
            )}
        </div>
    );
};

export default DoctorList;