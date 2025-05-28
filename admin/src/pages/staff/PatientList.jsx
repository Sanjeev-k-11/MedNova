import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react'; // Added useCallback
import { Link } from 'react-router-dom';
import { StaffContext } from '../../context/StaffContext';
import {
    FaSearch, FaFilter, FaTimes, FaCalendarAlt, FaInfoCircle, FaDownload, // Added FaDownload
    FaChevronDown, FaChevronUp
} from 'react-icons/fa';

// --- Import Excel Libraries ---
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// --- Reusable Status Badge Component (Keep as is) ---
const StatusBadge = ({ status, type }) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    let defaultText = 'N/A';

    if (type === 'appointment') {
        defaultText = 'N/A';
        const normalizedStatus = status || defaultText;
        switch (normalizedStatus) {
            case 'Completed': bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
            case 'Scheduled': bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; break;
            case 'Cancelled': bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
            case 'CheckedIn': bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; break;
            default: break;
        }
        status = normalizedStatus;
    } else if (type === 'payment') {
        defaultText = 'Unpaid';
        const normalizedStatus = status || defaultText;
         switch (normalizedStatus) {
            case 'Paid': bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
            case 'Partial': bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; break;
            case 'Waived': bgColor = 'bg-purple-100'; textColor = 'text-purple-800'; break;
            case 'Unpaid': default: bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
        }
        status = normalizedStatus;
    }

    return (
        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
            {status}
        </span>
    );
};

// --- Simple Card Component (Keep as is) ---
const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6 ${className}`}>
        {children}
    </div>
);


// --- Main Patient List Component ---
function PatientList() {
    // --- State ---
    const [allPatients, setAllPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApptStatus, setSelectedApptStatus] = useState('All');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    // --- Context ---
    const { staffToken, backendUrl } = useContext(StaffContext);

    // --- Define Filter Options ---
    const appointmentStatuses = ['All', 'Scheduled', 'CheckedIn', 'Completed', 'Cancelled', 'N/A'];
    const paymentStatuses = ['All', 'Paid', 'Unpaid', 'Partial', 'Waived'];

    // --- Effect for Fetching Data ---
    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoading(true);
            setError(null);
            setAllPatients([]); // Clear previous data

            if (!staffToken || !backendUrl) {
                setError("Configuration or authentication missing.");
                setIsLoading(false);
                return;
            }
            const apiUrl = `${backendUrl}/api/staff/patients`;
             try {
                 const response = await fetch(apiUrl, { headers: {'Authorization': `Bearer ${staffToken}`} });
                 if (!response.ok) {
                     // Attempt to read error message from body
                     const errorBody = await response.json().catch(() => null);
                     const errorMessage = errorBody?.message || `HTTP error! status: ${response.status}`;
                     throw new Error(errorMessage);
                 }
                 const result = await response.json();
                 if (result && Array.isArray(result.patients)) {
                     setAllPatients(result.patients);
                 } else {
                     // Handle unexpected success response without patients array
                     throw new Error("Invalid data format received from API.");
                 }
             } catch (err) {
                 console.error("Fetch patients error:", err);
                 setError(err.message || "An unknown error occurred while fetching patients.");
             } finally {
                 setIsLoading(false);
             }
        };
        fetchPatients();
        // Dependencies: backendUrl, staffToken. Fetch is wrapped in useCallback if it had more complex logic.
        // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [backendUrl, staffToken]); // Add explicit dependencies


    // --- Filtering Logic (using useMemo) ---
    const filteredPatients = useMemo(() => {
        let patientsToFilter = [...allPatients];

        // 1. Search
        if (searchTerm.trim()) {
            const lowerSearchTerm = searchTerm.toLowerCase().trim();
            patientsToFilter = patientsToFilter.filter(p =>
                (p.name && p.name.toLowerCase().includes(lowerSearchTerm)) ||
                (p.phone && p.phone.includes(lowerSearchTerm)) // Assuming phone is a string
            );
        }
        // 2. Appt Status
        if (selectedApptStatus !== 'All') {
             patientsToFilter = patientsToFilter.filter(p => (p.appointmentStatus || 'N/A') === selectedApptStatus);
        }
        // 3. Payment Status
        if (selectedPaymentStatus !== 'All') {
            patientsToFilter = patientsToFilter.filter(p => (p.paymentDetails?.status || 'Unpaid') === selectedPaymentStatus);
        }
        // 4. Date Range (Filtering based on patient registration date - createdAt)
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start || end) {
            patientsToFilter = patientsToFilter.filter(p => {
                if (!p.createdAt) return false; // Patient must have a creation date
                try {
                    const patientCreationDate = new Date(p.createdAt);
                    // Set time to start/end of day for comparison
                    if (start) start.setHours(0, 0, 0, 0);
                    if (end) end.setHours(23, 59, 59, 999);


                    const afterStart = start ? patientCreationDate >= start : true;
                    const beforeEnd = end ? patientCreationDate <= end : true;

                    return afterStart && beforeEnd;

                } catch (e) {
                    console.error("Error parsing date for filtering:", p.createdAt, e);
                    return false; // Exclude if date is invalid
                }
            });
        }
        return patientsToFilter;
     }, [allPatients, searchTerm, selectedApptStatus, selectedPaymentStatus, startDate, endDate]); // Dependencies for memoization


    // --- Check if any filters are active ---
    const filtersAreActive = searchTerm || selectedApptStatus !== 'All' || selectedPaymentStatus !== 'All' || startDate || endDate;

    // --- Helper to clear all filters ---
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedApptStatus('All');
        setSelectedPaymentStatus('All');
        setStartDate('');
        setEndDate('');
    };

    // --- Format Date Helper ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) { return 'Invalid Date'; }
    };

    // --- Excel Export Function ---
     const handleExportToExcel = useCallback(() => {
        if (!filteredPatients || filteredPatients.length === 0) {
            // Use toast for feedback
            toast.info("No patient data matching current filters to export.");
            return;
        }

        // Prepare data for the worksheet
        const dataForExport = filteredPatients.map(patient => {
            return {
                'Name': patient.name || 'N/A',
                'Age': patient.age || 'N/A',
                'Gender': patient.gender || 'N/A',
                'Phone Number': patient.phone || 'N/A',
                'Appointment Status': patient.appointmentStatus || 'N/A', // Use the string status
                'Payment Status': patient.paymentDetails?.status || 'Unpaid', // Use the string status
                'Registered Date': patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A', // Formatted date
                // Add other relevant patient fields as needed
                // 'Patient ID': patient._id,
                // 'Address': patient.address || 'N/A',
                // 'City': patient.city || 'N/A',
                // 'State': patient.state || 'N/A',
                // 'Zip Code': patient.zipCode || 'N/A',
            };
        });

        // Define the desired headers explicitly for order and labels in the Excel file
        const headers = [
             'Name',
             'Age',
             'Gender',
             'Phone Number',
             'Appointment Status',
             'Payment Status',
             'Registered Date'
             // Add headers for any other fields added above
        ];

        // Create a worksheet from the data with headers
        const ws = XLSX.utils.json_to_sheet(dataForExport, { header: headers });

         // Optional: Auto-fit column widths - simple estimate
         const colWidths = headers.map(header => {
             const maxLength = Math.max(header.length, ...dataForExport.map(row => String(row[header]).length));
             // Provide a base width and cap it at a reasonable size (e.g., 30-40)
             return { wch: Math.min(maxLength + 2, 40) };
         });
         ws['!cols'] = colWidths;


        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Patient List"); // Sheet name for the sheet

        // Generate the Excel file (Blob)
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        // Generate a filename based on filters (optional, provides context)
        let filename = 'patient_list_export';
        if (searchTerm) filename += '_search'; // Indicate if search filter used
        if (selectedApptStatus !== 'All') filename += `_appt_${selectedApptStatus}`; // Indicate appt status filter
        if (selectedPaymentStatus !== 'All') filename += `_pay_${selectedPaymentStatus}`; // Indicate payment status filter
        if (startDate && endDate) filename += `_${startDate}_to_${endDate}`; // Indicate date range
        else if (startDate) filename += `_from_${startDate}`;
        else if (endDate) filename += `_to_${endDate}`;

        // Add current date to the filename
        filename += `_${new Date().toISOString().slice(0, 10)}.xlsx`;

        // Trigger download using file-saver
        saveAs(blob, filename);

        toast.success(`Exported ${filteredPatients.length} patients.`);

    }, [filteredPatients, searchTerm, selectedApptStatus, selectedPaymentStatus, startDate, endDate]); // Dependencies for useCallback


    // --- Render UI ---
    return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 text-center">
                    Patient Records Dashboard
                </h1>
            </header>

            {/* --- Filters Card --- */}
            <Card className="mb-8">
                {/* Card Header with Toggle Button and Export Button */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-2 mb-4 gap-3">
                    <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                        <FaFilter className="mr-2 text-indigo-600" /> Filters & Search
                    </h2>
                    <div className="flex items-center gap-4"> {/* Container for buttons */}
                         {/* Export to Excel Button */}
                         <button
                             onClick={handleExportToExcel}
                             disabled={isLoading || filteredPatients.length === 0} // Disable when loading or no data to export
                             className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150"
                              title="Export filtered patient list to Excel"
                             aria-label={`Export ${filteredPatients.length} patients to Excel`}
                         >
                             <FaDownload className="mr-1.5 h-4 w-4"/>
                             Export ({filteredPatients.length}) {/* Show count of filtered patients */}
                         </button>

                         {/* Show/Hide Filters Toggle Button */}
                        <button
                            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition ease-in-out duration-150"
                            aria-expanded={isFiltersVisible}
                            aria-controls="filters-area" // Associate with the collapsible area
                        >
                            {isFiltersVisible ? (
                                <>
                                    <FaChevronUp className="mr-1.5 h-4 w-4" /> Hide
                                </>
                            ) : (
                                 <>
                                    <FaChevronDown className="mr-1.5 h-4 w-4" /> Show
                                </>
                            )}
                             Filters
                        </button>
                     </div>
                </div>

                {/* Collapsible Filter Controls Area */}
                {/* Added id="filters-area" to associate with the toggle button */}
                {isFiltersVisible && (
                    <div id="filters-area" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4 animate-fade-in"> {/* Added simple animation class */}
                        {/* Search Input */}
                        <div className="lg:col-span-1 xl:col-span-2">
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search (Name/Phone)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="text" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Type to search..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    aria-label="Search patients by name or phone"
                                     />
                            </div>
                        </div>

                        {/* Appointment Status Filter */}
                        <div>
                            <label htmlFor="apptStatus" className="block text-sm font-medium text-gray-700 mb-1">Appointment Status</label>
                            <select id="apptStatus" value={selectedApptStatus} onChange={(e) => setSelectedApptStatus(e.target.value)}
                                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                aria-label="Filter by appointment status">
                                {appointmentStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>

                        {/* Payment Status Filter */}
                        <div>
                            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select id="paymentStatus" value={selectedPaymentStatus} onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                aria-label="Filter by payment status">
                                {paymentStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>

                        {/* Start Date Filter */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Registered From</label>
                            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate || undefined}
                                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                aria-label="Filter by registration start date"
                                />
                        </div>

                        {/* End Date Filter */}
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Registered To</label>
                            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined}
                                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                aria-label="Filter by registration end date"
                                />
                        </div>
                         {/* Added a placeholder div for layout if needed */}
                         {/* <div className="hidden lg:block"></div> */} {/* Example: if you want the date inputs to align neatly with other filters */}
                    </div>
                 )} {/* End of isFiltersVisible block */}

                 {/* Active Filters Display & Clear Button (Always Visible within the card) */}
                 <div className={`flex flex-wrap items-center justify-between gap-2 pt-4 ${isFiltersVisible && (searchTerm || selectedApptStatus !== 'All' || selectedPaymentStatus !== 'All' || startDate || endDate) ? 'border-t mt-4' : ''}`}> {/* Apply border-top only if filters visible AND active */}
                     <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                        {/* This section remains visible, showing active filters */}
                        {filtersAreActive && <span className="font-medium">Active Filters:</span>}
                        {searchTerm && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">Search: "{searchTerm}" <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800" aria-label="Clear search filter"><FaTimes size={12} /></button></span>}
                        {selectedApptStatus !== 'All' && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">Appt: {selectedApptStatus} <button onClick={() => setSelectedApptStatus('All')} className="ml-1 text-green-600 hover:text-green-800" aria-label="Clear appointment status filter"><FaTimes size={12} /></button></span>}
                        {selectedPaymentStatus !== 'All' && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">Payment: {selectedPaymentStatus} <button onClick={() => setSelectedPaymentStatus('All')} className="ml-1 text-yellow-600 hover:text-yellow-800" aria-label="Clear payment status filter"><FaTimes size={12} /></button></span>}
                        {startDate && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center">From: {formatDate(startDate)} <button onClick={() => setStartDate('')} className="ml-1 text-purple-600 hover:text-purple-800" aria-label="Clear start date filter"><FaTimes size={12} /></button></span>}
                        {endDate && <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">To: {formatDate(endDate)} <button onClick={() => setEndDate('')} className="ml-1 text-red-600 hover:text-red-800" aria-label="Clear end date filter"><FaTimes size={12} /></button></span>}

                        {!filtersAreActive && !isFiltersVisible && <span className="text-gray-500 italic">No filters applied. Click 'Show Filters' to refine results.</span>}
                        {!filtersAreActive && isFiltersVisible && <span className="text-gray-500 italic">No filters applied.</span>}
                     </div>
                    <button
                        onClick={clearFilters}
                        className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${!filtersAreActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!filtersAreActive}
                        title="Clear all filters"
                        aria-label="Clear all filters">
                        <FaTimes className="mr-1.5 h-4 w-4" /> Clear All
                    </button>
                 </div>
            </Card>

            {/* --- Main Content Area (Loading, Error, Table) --- */}
            <main>
                {/* --- Loading State --- */}
                {isLoading && ( <Card className="text-center py-10">
                    <div className="flex justify-center items-center space-x-2">
                            <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-lg text-indigo-600">Loading patient data...</p>
                        </div>
                </Card> )}

                {/* --- Error State --- */}
                {error && !isLoading && ( <Card className="border-l-4 border-red-400 bg-red-50 p-4">
                     <div className="flex">
                            <div className="flex-shrink-0">
                                <FaInfoCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Loading Error</h3>
                                <p className="mt-1 text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                </Card> )}

                {/* --- Table --- */}
                {!isLoading && !error && (
                    <Card className="overflow-hidden">
                         <div className="overflow-x-auto">
                             <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-100">
                                    {/* ... Table Headers ... */}
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Age</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Gender</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Appt. Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Payment Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Registered</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {/* --- Table Body Rows (Mapped) --- */}
                                    {filteredPatients.length > 0 ? (
                                        filteredPatients.map((patient, index) => (
                                            <tr key={patient._id || index} className={index % 2 === 0 ? 'hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-100'}> {/* Use _id as key if available */}
                                                {/* ... Table Data Cells ... */}
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{patient.name || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{patient.age || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{patient.gender || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{patient.phone || '-'}</td>
                                                {/* Render just the status string for the export data preparation */}
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><StatusBadge status={patient.appointmentStatus} type="appointment" /></td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><StatusBadge status={patient.paymentDetails?.status} type="payment" /></td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(patient.createdAt)}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6">
                                                    {/* Link to patient details */}
                                                    <Link to={`/patient/${patient._id}`} className="text-indigo-600 hover:text-indigo-900 hover:underline"> {/* Corrected link path */}
                                                        View<span className="sr-only">, {patient.name}</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // --- No Results Row ---
                                         <tr>
                                            {/* Colspan should match number of columns (8) */}
                                            <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <FaInfoCircle className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="font-medium">
                                                         {/* Show more specific message if filters are active */}
                                                         {filtersAreActive ? 'No patients match the current filters.' : 'No patient records found.'}
                                                    </p>
                                                    {filtersAreActive && (
                                                        <button onClick={clearFilters} className="mt-2 text-sm text-indigo-600 hover:underline">
                                                            Clear filters
                                                        </button>
                                                    )}
                                                     {/* Suggest showing filters if no results and filters are hidden */}
                                                     {!filtersAreActive && !isFiltersVisible && (
                                                        <button onClick={() => setIsFiltersVisible(true)} className="mt-2 text-sm text-indigo-600 hover:underline">
                                                            Show filters to refine results
                                                        </button>
                                                     )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </Card>
                )}
                 {/* Optional: Show a message if the initial load completed but the list is empty */}
                 {!isLoading && !error && allPatients.length === 0 && (
                     <Card className="text-center py-10">
                         <div className="flex flex-col items-center">
                            <FaInfoCircle className="w-10 h-10 text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-700">No patient records found in the system.</p>
                         </div>
                     </Card>
                 )}
            </main>
             {/* Simple style for fade-in animation */}
            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default PatientList;