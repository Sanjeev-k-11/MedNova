import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
// --- CHANGE 1: Import AdminContext instead of StaffContext ---
import { AdminContext } from '../../context/AdminContext'; // Adjust the path if needed
import {
    FaSearch, FaFilter, FaTimes, FaCalendarAlt, FaInfoCircle,
    FaChevronDown, FaChevronUp, FaUsers, FaChartBar
} from 'react-icons/fa';

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

// --- Main Patient List Component (Adapted for Admin) ---
function AdminPatientList() { // Renamed component
    // --- State (Remains the same) ---
    const [allPatients, setAllPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApptStatus, setSelectedApptStatus] = useState('All');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    // --- CHANGE 2: Use AdminContext and get 'token' and 'backendUrl' ---
    const { token, backendUrl } = useContext(AdminContext);

    // --- Define Filter Options (Remains the same) ---
    const appointmentStatuses = ['All', 'Scheduled', 'CheckedIn', 'Completed', 'Cancelled', 'N/A'];
    const paymentStatuses = ['All', 'Paid', 'Unpaid', 'Partial', 'Waived'];

    // --- Effect for Fetching Data ---
    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoading(true);
            setError(null);
            setAllPatients([]); // Clear previous data on fetch

            // --- CHANGE 3: Check for 'token' instead of 'staffToken' ---
            if (!token || !backendUrl) {
                setError("Admin configuration or authentication missing.");
                setIsLoading(false);
                return;
            }

            // --- CHANGE 4: Use the generic API endpoint (if applicable) ---
            // Assuming the backend uses /api/patients for both staff and admin (after auth)
            // If your backend requires a specific /api/admin/patients endpoint, change it here.
            const apiUrl = `${backendUrl}/api/patients`;

             try {
                 // --- CHANGE 5: Use 'token' in the Authorization header ---
                 const response = await fetch(apiUrl, { headers: {'Authorization': `Bearer ${token}`} });

                 if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                 const result = await response.json();
                 if (result && Array.isArray(result.patients)) {
                     // Sort patients by creation date (newest first) before setting state
                     const sortedPatients = result.patients.sort((a, b) =>
                         new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                     );
                     setAllPatients(sortedPatients);
                 } else { throw new Error("Invalid data format received."); }
             } catch (err) {
                 console.error("Error fetching patient data:", err);
                 setError(err.message || "An unknown error occurred while fetching patients.");
             } finally {
                 setIsLoading(false);
             }
        };
        fetchPatients();
     // --- CHANGE 6: Update useEffect dependencies ---
     }, [backendUrl, token]); // Depend on 'token'

    // --- Calculate Summary Statistics (Enhancement) ---
    const summaryStats = useMemo(() => {
        if (!allPatients || allPatients.length === 0) {
            return { total: 0, monthlyCounts: [] };
        }

        const monthly = {};
        allPatients.forEach(patient => {
            if (patient.createdAt) {
                try {
                    const date = new Date(patient.createdAt);
                    // Format as YYYY-MM for grouping
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    monthly[monthKey] = (monthly[monthKey] || 0) + 1;
                } catch (e) {
                    console.warn("Could not parse date for summary:", patient.createdAt);
                }
            }
        });

        // Convert to array and sort chronologically (most recent first)
        const monthlyCounts = Object.entries(monthly)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => b.month.localeCompare(a.month)); // Sort YYYY-MM descending

        return {
            total: allPatients.length,
            monthlyCounts: monthlyCounts
        };
    }, [allPatients]);

    // Function to format YYYY-MM into "Month Year"
    const formatMonthYear = (monthKey) => {
        try {
            const [year, month] = monthKey.split('-');
            const date = new Date(year, month - 1); // Month is 0-indexed
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } catch (e) {
            return monthKey; // Fallback
        }
    };


    // --- Filtering Logic (No changes needed) ---
    const filteredPatients = useMemo(() => {
        let patientsToFilter = [...allPatients];

        // 1. Search
        if (searchTerm.trim()) {
            const lowerSearchTerm = searchTerm.toLowerCase().trim();
            patientsToFilter = patientsToFilter.filter(p =>
                (p.name && p.name.toLowerCase().includes(lowerSearchTerm)) ||
                (p.phone && p.phone.includes(lowerSearchTerm))
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
        // 4. Date Range (Filters by createdAt/Registered Date)
        const start = startDate ? startDate : null;
        const end = endDate ? endDate : null;
        if (start || end) {
            patientsToFilter = patientsToFilter.filter(p => {
                if (!p.createdAt) return false;
                try {
                    // Compare only the date part, ignore time
                    const patientDateOnly = new Date(p.createdAt).toISOString().split('T')[0];
                    const afterStart = start ? patientDateOnly >= start : true;
                    const beforeEnd = end ? patientDateOnly <= end : true;
                    return afterStart && beforeEnd;
                } catch (e) { return false; }
            });
        }
        return patientsToFilter;
     }, [allPatients, searchTerm, selectedApptStatus, selectedPaymentStatus, startDate, endDate]);

    // --- Check if any filters are active (No changes needed) ---
    const filtersAreActive = searchTerm || selectedApptStatus !== 'All' || selectedPaymentStatus !== 'All' || startDate || endDate;

    // --- Helper to clear all filters (No changes needed) ---
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedApptStatus('All');
        setSelectedPaymentStatus('All');
        setStartDate('');
        setEndDate('');
    };

    // --- Format Date Helper (No changes needed) ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) { return 'Invalid Date'; }
    };

    // --- Render UI ---
    return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 text-center">
                    Admin Patient Dashboard
                </h1>
            </header>

            {/* --- ENHANCEMENT: Summary Statistics Card --- */}
            {!isLoading && !error && allPatients.length > 0 && (
                <Card className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                        <FaChartBar className="mr-2 text-indigo-600" /> Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Patients */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center space-x-3">
                            <FaUsers className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium text-blue-700">Total Patients</p>
                                <p className="text-2xl font-bold text-blue-900">{summaryStats.total}</p>
                            </div>
                        </div>

                        {/* Monthly Registrations (Show latest few or all if few) */}
                        <div className="md:col-span-2 bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm font-medium text-green-700 mb-2 flex items-center">
                                <FaCalendarAlt className="mr-1.5" /> Monthly Registrations (Newest First)
                            </p>
                            {summaryStats.monthlyCounts.length > 0 ? (
                                <ul className="space-y-1 max-h-32 overflow-y-auto text-sm text-green-800">
                                    {summaryStats.monthlyCounts.map(({ month, count }) => (
                                        <li key={month} className="flex justify-between">
                                            <span>{formatMonthYear(month)}:</span>
                                            <span className="font-semibold">{count}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No registration data available.</p>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* --- Filters Card (UI/Logic remains the same) --- */}
            <Card className="mb-8">
                {/* Card Header with Toggle Button */}
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                     <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                        <FaFilter className="mr-2 text-indigo-600" /> Filters & Search
                    </h2>
                    <button
                        onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-expanded={isFiltersVisible}
                    >
                        {isFiltersVisible ? <FaChevronUp className="mr-1.5 h-4 w-4" /> : <FaChevronDown className="mr-1.5 h-4 w-4" />}
                        {isFiltersVisible ? 'Hide' : 'Show'} Filters
                    </button>
                </div>

                {/* Collapsible Filter Controls Area */}
                {isFiltersVisible && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                        {/* Search Input */}
                        <div className="lg:col-span-1 xl:col-span-2">
                             <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search (Name/Phone)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="text" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Type to search..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        {/* Appointment Status Filter */}
                        <div>
                             <label htmlFor="apptStatus" className="block text-sm font-medium text-gray-700 mb-1">Appointment Status</label>
                            <select id="apptStatus" value={selectedApptStatus} onChange={(e) => setSelectedApptStatus(e.target.value)}
                                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                {appointmentStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                        {/* Payment Status Filter */}
                        <div>
                             <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select id="paymentStatus" value={selectedPaymentStatus} onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                {paymentStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                        {/* Start Date Filter (for Registered Date) */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Registered From</label>
                            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate || undefined}
                                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        {/* End Date Filter (for Registered Date) */}
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Registered To</label>
                            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined}
                                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                    </div>
                 )} {/* End of isFiltersVisible block */}

                 {/* Active Filters Display & Clear Button */}
                 <div className={`flex flex-wrap items-center justify-between gap-2 pt-4 ${isFiltersVisible ? 'border-t mt-4' : ''}`}>
                    <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                        {filtersAreActive && <span className="font-medium">Active Filters:</span>}
                        {searchTerm && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Search: "{searchTerm}"</span>}
                        {selectedApptStatus !== 'All' && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">Appt: {selectedApptStatus}</span>}
                        {selectedPaymentStatus !== 'All' && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Payment: {selectedPaymentStatus}</span>}
                        {startDate && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">From: {formatDate(startDate)}</span>}
                        {endDate && <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">To: {formatDate(endDate)}</span>}
                        {!filtersAreActive && !isFiltersVisible && <span className="text-gray-500 italic">No filters applied. Click 'Show Filters' to refine results.</span>}
                        {!filtersAreActive && isFiltersVisible && <span className="text-gray-500 italic">No filters applied.</span>}
                    </div>
                    <button
                        onClick={clearFilters}
                        className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${!filtersAreActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!filtersAreActive}
                        title="Clear all filters">
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
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Age</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">Gender</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Appt. Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell">Payment Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Registered</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {/* Table Body Rows (Mapped) */}
                                    {filteredPatients.length > 0 ? (
                                        filteredPatients.map((patient, index) => (
                                            <tr key={patient._id} className={index % 2 === 0 ? 'hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-100'}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{patient.name || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">{patient.age || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden md:table-cell">{patient.gender || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{patient.phone || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><StatusBadge status={patient.appointmentStatus} type="appointment" /></td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden lg:table-cell"><StatusBadge status={patient.paymentDetails?.status} type="payment" /></td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">{formatDate(patient.createdAt)}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6">
                                                    {/* --- CHANGE 7: Link destination might need review/change --- */}
                                                    {/* Assuming '/admin/patients/:id' or a generic '/patients/:id' detail page */}
                                                    <Link to={`/patients/${patient._id}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                                        View<span className="sr-only">, {patient.name}</span>
                                                    </Link>
                                                    {/* Consider adding Admin-specific actions here like Edit/Delete if needed */}
                                                    {/* Example:
                                                        <Link to={`/admin/patients/${patient._id}/edit`} className="ml-4 text-yellow-600 hover:text-yellow-900">Edit</Link>
                                                        <button onClick={() => handleDelete(patient._id)} className="ml-4 text-red-600 hover:text-red-900">Delete</button>
                                                    */}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // No Results Row
                                         <tr>
                                            <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <FaInfoCircle className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="font-medium">
                                                         {filtersAreActive ? 'No patients match the current filters.' : (allPatients.length === 0 ? 'No patient records found in the system.' : 'No patient records found.')}
                                                    </p>
                                                    {filtersAreActive && (
                                                        <button onClick={clearFilters} className="mt-2 text-sm text-indigo-600 hover:underline">
                                                            Clear filters
                                                        </button>
                                                    )}
                                                     {!filtersAreActive && !isFiltersVisible && allPatients.length > 0 && ( // Only show 'Show filters' if there's data to filter
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
                         {/* Optional: Add Pagination component here if needed */}
                    </Card>
                )}
            </main>
        </div>
    );
}

// --- CHANGE 8: Export the renamed component ---
export default AdminPatientList;