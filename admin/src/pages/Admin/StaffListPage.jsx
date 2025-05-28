// src/pages/StaffListPage.jsx

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react'; // Added useCallback, useMemo
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext'; // Adjust path if needed
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaToggleOn, FaToggleOff, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Loader2, Download, Search, X } from 'lucide-react'; // Added Download, Search, X

// --- Import Excel Libraries ---
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Simple Spinner component using Lucide
const Spinner = ({ size = 'h-8 w-8', color = 'text-indigo-600 dark:text-indigo-400' }) => ( // Added size and color props
    <div className="flex justify-center items-center py-10">
        <Loader2 className={`animate-spin ${size} ${color}`} />
    </div>
);

const StaffListPage = () => {
    const [staffList, setStaffList] = useState([]); // Original full list
    const [filteredStaffList, setFilteredStaffList] = useState([]); // List after filtering and sorting
    const [loading, setLoading] = useState(true); // Initial fetch loading
    const [actionLoading, setActionLoading] = useState(false); // Generic action loading state (for delete/status toggle)
    const [updatingStatusId, setUpdatingStatusId] = useState(null); // Specific ID for status update loading
    const [deletingId, setDeletingId] = useState(null); // Specific ID for deletion loading
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    // Default sort by creation date desc. Changed key to 'createdAt' for sort consistency with display.
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
    const { backendUrl, token } = useContext(AdminContext);

    // Use a single loading state that indicates if *any* async operation is ongoing
    const isBusy = loading || actionLoading;

    // --- Fetch Initial Data ---
    // Wrap fetchStaff in useCallback as it's a dependency for useEffect
    const fetchStaff = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!token) {
            setError("Authentication token not found. Please log in.");
            setLoading(false);
            toast.error("Authentication required.");
            setStaffList([]);
            return;
        }
        try {
            const response = await axios.get(`${backendUrl}/api/staff/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setStaffList(Array.isArray(response.data.staffList) ? response.data.staffList : []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch staff list');
            }
        } catch (err) {
            console.error("Error fetching staff:", err);
            const status = err.response?.status;
            let message = err.response?.data?.message || err.message || "An error occurred while fetching staff.";
            if (status === 401 || status === 403) {
                 message = "Authentication failed or insufficient permissions. Please re-login.";
            }
            setError(message);
            toast.error(`Error fetching staff: ${message}`);
            setStaffList([]);
        } finally {
            setLoading(false);
        }
    }, [backendUrl, token]); // Dependencies for useCallback


    // Fetch data on component mount and when token/backendUrl change
    useEffect(() => {
        if (token && backendUrl) {
            fetchStaff();
        } else if (!token) {
             setError("Authentication token not found. Please log in.");
             setLoading(false);
             setStaffList([]);
        }
    }, [token, backendUrl, fetchStaff]); // Added fetchStaff as dependency because it's wrapped in useCallback


    // --- Filtering and Sorting Logic (using useMemo for efficiency) ---
    const filteredAndSortedStaff = useMemo(() => {
         let processedList = [...staffList]; // Start with a copy of the original staff list

         // 1. Filter
         if (searchTerm) {
           const lowerCaseSearchTerm = searchTerm.toLowerCase();
           processedList = processedList.filter(staff =>
             // Check if name, email, VID, or role includes the search term (case-insensitive)
             (staff.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
             (staff.email?.toLowerCase().includes(lowerCaseSearchTerm)) ||
             (staff.vid?.toLowerCase().includes(lowerCaseSearchTerm)) ||
             (staff.role?.toLowerCase().includes(lowerCaseSearchTerm))
           );
         }

         // 2. Sort (apply sorting to the filtered list)
         if (sortConfig.key !== null) {
           processedList.sort((a, b) => {
             const aValue = a[sortConfig.key];
             const bValue = b[sortConfig.key];

             // Handle nulls/undefineds (put them last in ascending, first in descending)
             if (aValue == null && bValue == null) return 0;
             if (aValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
             if (bValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;

             // Basic comparison (handles strings and numbers)
             if (aValue < bValue) {
               return sortConfig.direction === 'ascending' ? -1 : 1;
             }
             if (aValue > bValue) {
               return sortConfig.direction === 'ascending' ? 1 : -1;
             }
             return 0;
           });
         }

         // Return the processed list
         return processedList;

     }, [staffList, searchTerm, sortConfig]); // Re-run when staffList, searchTerm, or sortConfig changes


    // Update filteredStaffList state *after* useMemo recalculates
    useEffect(() => {
        setFilteredStaffList(filteredAndSortedStaff);
    }, [filteredAndSortedStaff]);


    // --- Sorting Handler ---
    const requestSort = (key) => {
        let direction = 'ascending';
        // If already sorting by this key
        if (sortConfig.key === key) {
             // If currently ascending, switch to descending
            if (sortConfig.direction === 'ascending') {
                 direction = 'descending';
            } else {
                // If currently descending, reset sort (optional, but a common pattern)
                // setSortConfig({ key: null, direction: 'ascending' });
                // return; // Exit after resetting
                 // Or just loop: If currently descending, switch to ascending
                 direction = 'ascending';
            }
        }
        setSortConfig({ key, direction });
    };

    // --- Get Sort Icon ---
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="inline ml-1 text-gray-400 dark:text-gray-500" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="inline ml-1 text-indigo-600 dark:text-indigo-400" />;
        return <FaSortDown className="inline ml-1 text-indigo-600 dark:text-indigo-400" />;
    };

    // --- Delete Handler ---
    const handleDelete = async (staffId, staffName) => {
        // Prevent multiple actions at once or action without token
        if (actionLoading || !token) {
            if(!token) toast.warn("Cannot delete: Missing authentication token.");
            return;
        }
        const name = staffName || `staff (ID: ${staffId})`;
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

        setActionLoading(true); // Set generic action loading
        setDeletingId(staffId); // Indicate which staff is being deleted specifically
        try {
            const response = await axios.delete(`${backendUrl}/api/staff/${staffId}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
             });
            if (response.data.success) {
                toast.success(`${name} deleted successfully.`);
                // Update staffList by removing the deleted staff
                setStaffList(prevList => prevList.filter(staff => staff._id !== staffId));
                // filteredStaffList will be updated by the useEffect
            } else {
                 toast.error(response.data.message || `Failed to delete ${name}.`);
             }
        } catch (err) {
            console.error("Error deleting staff:", err);
            const status = err.response?.status;
            let message = err.response?.data?.message || err.message || "An error occurred while deleting.";
            if (status === 401 || status === 403) message = "Authorization failed or insufficient permissions to delete staff.";
            if (status === 404) message = "Staff member not found or already deleted.";
            toast.error(`Delete failed: ${message}`);
        } finally {
             setActionLoading(false); // Reset generic action loading
             setDeletingId(null); // Reset specific deleting state
        }
    };

     // --- Status Toggle Handler ---
    const handleToggleActive = async (staffId, currentStatus, staffName) => {
        // Prevent multiple actions at once or action without token
        if (actionLoading || !token) {
             if(!token) toast.warn("Cannot update status: Missing authentication token.");
             return;
         }
        const newStatus = !currentStatus;
        const action = newStatus ? 'activate' : 'deactivate';
        const name = staffName || `staff (ID: ${staffId})`;
        if (!window.confirm(`Are you sure you want to ${action} ${name}?`)) return;

        setActionLoading(true); // Set generic action loading
        setUpdatingStatusId(staffId); // Indicate which staff is being updated specifically
        try {
            const response = await axios.patch(
                `${backendUrl}/api/staff/${staffId}/status`,
                { isActive: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(`${name} ${action}d successfully.`);
                // Update staffList with the new status
                setStaffList(prevList =>
                    prevList.map(staff =>
                        staff._id === staffId ? { ...staff, isActive: newStatus } : staff
                    )
                );
                // filteredStaffList will be updated by the useEffect
            } else {
                toast.error(response.data.message || `Failed to ${action} ${name}.`);
            }
        } catch (err) {
            console.error(`Error ${action}ing staff:`, err);
            const status = err.response?.status;
            let message = err.response?.data?.message || err.message || "An error occurred.";
            if (status === 401 || status === 403) message = "Authorization failed or insufficient permissions to update status.";
            if (status === 404) message = "Staff member not found.";
            toast.error(`${action.charAt(0).toUpperCase() + action.slice(1)} failed: ${message}`);
        } finally {
            setActionLoading(false); // Reset generic action loading
            setUpdatingStatusId(null); // Reset specific updating state
        }
     };

     // --- Excel Export Function ---
     const handleExportToExcel = useCallback(() => {
        if (!filteredStaffList || filteredStaffList.length === 0) {
            toast.info("No staff data matching current filters to export.");
            return;
        }

        // Prepare data for the worksheet
        const dataForExport = filteredStaffList.map(staff => {
            return {
                'Staff ID (VID)': staff.vid || 'N/A', // VID as first column
                'Name': staff.name || 'N/A',
                'Email Address': staff.email || 'N/A',
                'Role': (staff.role || 'N/A').charAt(0).toUpperCase() + (staff.role || '').slice(1),
                'Phone Number': staff.phone || 'N/A',
                'Account Status': staff.isActive ? 'Active' : 'Inactive',
                'Created Date': staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A',
                // Include original ID if needed, but maybe not user-friendly
                // '_id': staff._id
            };
        });

        // Define the desired headers explicitly for order and labels
        const headers = [
             'Staff ID (VID)',
             'Name',
             'Email Address',
             'Role',
             'Phone Number',
             'Account Status',
             'Created Date'
        ];

        // Create a worksheet from the data with headers
        const ws = XLSX.utils.json_to_sheet(dataForExport, { header: headers });

         // Optional: Auto-fit column widths - simple estimate
         const colWidths = headers.map(header => {
             const maxLength = Math.max(header.length, ...dataForExport.map(row => String(row[header]).length));
             return { wch: Math.min(maxLength + 2, 60) }; // Add a little padding, cap width
         });
         ws['!cols'] = colWidths;

        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Staff List"); // Sheet name

        // Generate the Excel file (Blob)
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        // Generate filename
        let filename = 'staff_export';
        if (searchTerm) filename += '_search';
        filename += `_${new Date().toISOString().slice(0, 10)}.xlsx`; // Add current date

        // Trigger download using file-saver
        saveAs(blob, filename);

        toast.success(`Exported ${filteredStaffList.length} staff members.`);

    }, [filteredStaffList, searchTerm]); // Dependencies: filteredStaffList, searchTerm (for filename)


    // --- Render Logic ---
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Staff Management</h1>
                <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center space-x-4"> {/* Flex container for buttons */}
                     {/* Link to Add New Staff Page */}
                     <Link to="/staf-add" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition ease-in-out duration-150">
                        + Add New Staff
                    </Link>
                     {/* Export to Excel Button */}
                    <button
                         onClick={handleExportToExcel}
                         disabled={isBusy || filteredStaffList.length === 0} // Disable when busy or no data
                         className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150"
                         title="Export staff list to Excel"
                         aria-label={`Export ${filteredStaffList.length} staff members to Excel`}
                     >
                        <Download size={16} className="mr-2"/>
                        Export ({filteredStaffList.length})
                    </button>
                </div>
            </div>

            {/* Search Bar */}
             <div className="mb-5 relative">
                 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                 <input
                    id="search-staff" type="text" placeholder="Search by Name, Email, VID, Role..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full md:w-1/2 lg:w-1/3 pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    aria-label="Search staff by keyword"
                />
                 {searchTerm && (
                    <button onClick={() => setSearchTerm('')} title="Clear Search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" aria-label="Clear search input">
                        <X size={16} />
                    </button>
                 )}
            </div>

            {/* Loading State */}
            {loading && <Spinner />}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 p-4 mb-4 rounded-md shadow" role="alert">
                    <p className="font-bold text-red-800 dark:text-red-200">Error</p>
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

             {/* Table Container */}
            {/* Only render table if not loading and no critical error */}
            {!loading && !error && (
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                     { [
                                         { key: null, label: 'Photo', className: 'px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider' },
                                         { key: 'name', label: 'Name', className: 'px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' },
                                         { key: 'vid', label: 'VID', className: 'px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' },
                                         { key: 'email', label: 'Email', className: 'px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' },
                                         { key: 'role', label: 'Role', className: 'px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' },
                                         { key: 'phone', label: 'Phone', className: 'px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell' },
                                         { key: 'isActive', label: 'Status', className: 'px-5 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' },
                                         { key: 'createdAt', label: 'Created', className: 'px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' },
                                         { key: null, label: 'Actions', className: 'px-5 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider' }
                                       ].map(header => (
                                            <th key={header.label} scope="col" className={header.className} onClick={header.key ? () => requestSort(header.key) : undefined}>
                                                {header.label} {header.key && getSortIcon(header.key)}
                                            </th>
                                        ))
                                    }
                                </tr>
                           </thead>
                           <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {/* Conditional rendering for no results or data */}
                                {filteredStaffList.length === 0 && !loading ? ( // Check loading state here for correct message
                                    <tr>
                                        <td colSpan="9" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                            {staffList.length > 0 && searchTerm ? 'No staff match search criteria.' :
                                             'No staff found.'} {/* Simpler message if list is empty and no search */}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaffList.map((staff) => (
                                        <tr key={staff._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm text-gray-800 dark:text-gray-300">
                                            {/* Photo */}
                                             <td className="px-5 py-3 whitespace-nowrap"><img className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 bg-gray-200 dark:bg-gray-600" src={staff.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name||'S')}&background=random&color=fff&font-size=0.5`} alt={staff.name||'Staff'} onError={(e) => { e.target.onerror = null; e.target.src='https://ui-avatars.com/api/?name=S&background=random&color=fff&font-size=0.5'; }}/></td> {/* Added border and onError fallback */}
                                             {/* Name */}
                                             <td className="px-5 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">{staff.name||'N/A'}</td>
                                             {/* VID */}
                                             <td className="px-5 py-3 whitespace-nowrap hidden sm:table-cell">{staff.vid||'N/A'}</td>
                                             {/* Email */}
                                             <td className="px-5 py-3 whitespace-nowrap hidden lg:table-cell">{staff.email||'N/A'}</td>
                                             {/* Role Badge */}
                                             <td className="px-5 py-3 whitespace-nowrap">
                                                 <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                     staff.role==='admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                     staff.role==='doctor' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                                                     staff.role==='nurse' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                     staff.role==='receptionist' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                     'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                 }`}>
                                                     {(staff.role||'N/A').charAt(0).toUpperCase()+(staff.role||'N/A').slice(1)}
                                                 </span>
                                             </td> {/* Added doctor color */}
                                             {/* Phone */}
                                             <td className="px-5 py-3 whitespace-nowrap hidden md:table-cell">{staff.phone||'N/A'}</td>
                                             {/* Status Toggle */}
                                             <td className="px-5 py-3 whitespace-nowrap text-center">
                                                 {updatingStatusId === staff._id ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500 dark:text-indigo-400 inline-block"/>
                                                 ) : (
                                                    <button
                                                        onClick={()=>handleToggleActive(staff._id, staff.isActive, staff.name)}
                                                        disabled={isBusy} // Disable if any action is loading
                                                        className={`cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-full p-1 disabled:opacity-50 disabled:cursor-not-allowed ${staff.isActive ? 'text-green-500 hover:text-green-700 focus:ring-green-500':'text-gray-400 hover:text-gray-600 focus:ring-gray-500'}`}
                                                        title={staff.isActive?'Active (Click to Deactivate)':'Inactive (Click to Activate)'}
                                                        aria-label={staff.isActive?`Deactivate ${staff.name||'staff'}`:`Activate ${staff.name||'staff'}`}
                                                    >
                                                        {staff.isActive ? <FaToggleOn size={22}/> : <FaToggleOff size={22}/>}
                                                    </button>
                                                 )}
                                             </td>
                                             {/* Created At */}
                                             <td className="px-5 py-3 whitespace-nowrap hidden xl:table-cell">{staff.createdAt?new Date(staff.createdAt).toLocaleDateString():'N/A'}</td>
                                             {/* Action Buttons */}
                                             <td className="px-5 py-3 whitespace-nowrap text-center text-sm font-medium space-x-3">
                                                {/* Link to Edit Staff Page */}
                                                <Link
                                                    to={`/admin/staff/edit/${staff._id}`}
                                                    className={`text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition inline-block ${isBusy?'opacity-50 cursor-not-allowed pointer-events-none':''}`}
                                                    title="Edit Staff"
                                                    aria-disabled={isBusy}
                                                    tabIndex={isBusy?-1:0}
                                                >
                                                    <FaEdit size={18}/>
                                                </Link>
                                                {/* Delete Button */}
                                                <button
                                                    onClick={()=>handleDelete(staff._id, staff.name)}
                                                    disabled={isBusy} // Disable if any action is loading
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition inline-block disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete Staff"
                                                    aria-label={`Delete ${staff.name||'staff'}`}
                                                >
                                                     {deletingId===staff._id ? <Loader2 className="h-4 w-4 animate-spin inline-block"/> : <FaTrashAlt size={16}/>}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                           </tbody>
                        </table>
                    </div>
                    {/* Optional: Message if initial load completed but list is empty (no data at all) */}
                    {!loading && staffList.length === 0 && !error && (
                         <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                             No staff members found.
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StaffListPage;