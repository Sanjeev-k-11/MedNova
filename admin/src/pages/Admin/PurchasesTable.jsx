import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"; // Added useRef
import axios from "axios";
import { toast } from "react-toastify";
import {
    Loader2, Package, CalendarDays, Receipt, Hash, Check, Ban, Info, Filter, DollarSign, ShoppingCart, X, Search,
    BarChart3,
    TrendingUp,
    CheckSquare,
    Boxes,
    Download // Added Download icon
} from "lucide-react";
import { useTheme } from '../../context/ThemeContext';
import PurchaseCard from "./PurchaseCard";
import useDebounce from "../../components/useDebounce";

// --- Import Excel Libraries ---
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'; // For saving the Blob

// --- Helper Functions (Keep these) ---
const safeFormatDateTime = (dateInput) => {
    if (!dateInput) return "N/A";
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (e) {
        console.error("Error formatting date:", dateInput, e);
        return "Error";
    }
};

const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        return "$0.00"; // Or handle as needed
    }
     // Return a formatted string for display
    return numericAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};


const Spinner = ({ size = 'h-4 w-4' }) => <Loader2 className={`animate-spin text-blue-500 dark:text-blue-400 ${size}`} />;

const STATUS_OPTIONS = [
    'All', 'Pending', 'Paid', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Completed', 'Canceled', 'Failed', 'Refunded', 'Partially Refunded', 'Partially Canceled'
];

// --- Main Component ---
const Purchases = () => {
    const { currentTheme } = useTheme(); // Using useTheme context
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({ purchaseId: null, type: null });
    const [filterMonthYear, setFilterMonthYear] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isTodayFilterActive, setIsTodayFilterActive] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // --- Data Fetching ---
    const fetchPurchases = useCallback(async () => {
        setActionLoading({ purchaseId: null, type: null });
        setLoading(true);
        try {
            if (!token) {
                toast.error("Authentication token not found. Please log in again.");
                setLoading(false); return;
            }
            const response = await axios.get(`${backendUrl}/api/admin/purchases`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                const processedPurchases = response.data.purchases.map(p => ({
                    ...p,
                    effectiveDate: p.dateOfPurchase || p.createdAt // Use dateOfPurchase if available, fallback to createdAt
                }));
                const sortedPurchases = processedPurchases.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
                setPurchases(sortedPurchases);
            } else {
                toast.error(response.data.message || "Failed to fetch purchases (API Error)");
                setPurchases([]);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
             if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                 toast.error("Unauthorized or Forbidden. Please log in again.");
             } else {
                 toast.error(error.response?.data?.message || "An error occurred while fetching purchases.");
             }
            setPurchases([]);
        } finally {
            setLoading(false);
        }
    }, [backendUrl, token]);

    // --- Action Handlers ---
    const handleConfirmPurchase = useCallback(async (purchaseId) => {
        setActionLoading({ purchaseId, type: 'confirm' });
        try {
            if (!token) { toast.error("Token missing"); setActionLoading({ purchaseId: null, type: null }); return; }
            const url = `${backendUrl}/api/admin/purchases/${purchaseId}/confirm`;
            const { data } = await axios.patch(url, {}, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                toast.success(`Purchase confirmed`);
                await fetchPurchases();
            } else {
                toast.error(data.message || `Failed confirm`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Error confirming`);
        } finally {
            setActionLoading({ purchaseId: null, type: null });
        }
    }, [backendUrl, token, fetchPurchases]);

    const handleCancelPurchase = useCallback(async (purchaseId) => {
        const purchaseInfo = purchases.find(p => p._id === purchaseId);
        const userName = purchaseInfo?.userId?.name || purchaseInfo?.userName || 'this user';
        if (!window.confirm(`Cancel purchase ${purchaseId} for ${userName}? This action cannot be undone.`)) return; // Stronger confirmation

        setActionLoading({ purchaseId, type: 'cancel' });
        try {
            if (!token) { toast.error("Token missing"); setActionLoading({ purchaseId: null, type: null }); return; }
            const url = `${backendUrl}/api/admin/cancel-order/${purchaseId}`;
            const { data } = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                toast.success(`Purchase canceled`);
                await fetchPurchases();
            } else {
                toast.error(data.message || `Failed cancel`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Error canceling`);
        } finally {
            setActionLoading({ purchaseId: null, type: null });
        }
    }, [backendUrl, token, fetchPurchases, purchases]);


    // --- Filtering Logic (using useMemo) ---
    const filteredPurchases = useMemo(() => {
        let currentFiltered = [...purchases];
        const today = new Date(); // Get today's date once

        // --- Date Filtering ---
        if (isTodayFilterActive) {
            // Filter for Today
            currentFiltered = currentFiltered.filter(p => {
                if (!p.effectiveDate) return false;
                try {
                    return isSameDay(new Date(p.effectiveDate), today);
                } catch (e) {
                     console.warn("Error parsing date for 'Today' filtering:", p.effectiveDate, e);
                     return false;
                }
            });
        } else if (filterMonthYear) {
            // Filter by Selected Month/Year (only if Today is not active)
            currentFiltered = currentFiltered.filter(p => {
                if (!p.effectiveDate) return false;
                try {
                    return new Date(p.effectiveDate).toISOString().slice(0, 7) === filterMonthYear;
                } catch (e) {
                    console.warn("Error parsing date for month filtering:", p.effectiveDate, e);
                    return false;
                }
            });
        }
        // If neither Today nor Month is active, no date filtering is applied here.

        // --- Status Filtering ---
        if (statusFilter !== 'All') {
            currentFiltered = currentFiltered.filter(p => (p.paymentStatus || 'Pending') === statusFilter);
        }

        // --- Search Term Filtering (Debounced) ---
        if (debouncedSearchTerm) {
            const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
            currentFiltered = currentFiltered.filter(p => {
                const userName = (p.userId?.name || p.userName || '').toLowerCase();
                const userEmail = (p.userId?.email || p.email || '').toLowerCase();
                const userPhone = (p.userId?.phoneNumber || p.phoneNumber || '').toLowerCase();
                const purchaseId = (p._id || '').toLowerCase();
                const paymentId = (p.razorpayPaymentId || '').toLowerCase();
                // Added check for nested medicine data safety
                const hasMatchingMedicine = p.medicines?.some(med => {
                    const medicineName = (med.medicineId?.name || med.name || '').toLowerCase();
                    return medicineName.includes(lowerCaseSearch);
                });


                return userName.includes(lowerCaseSearch) ||
                       userEmail.includes(lowerCaseSearch) ||
                       userPhone.includes(lowerCaseSearch) ||
                       purchaseId.includes(lowerCaseSearch) ||
                       paymentId.includes(lowerCaseSearch) ||
                       hasMatchingMedicine;
            });
        }

        return currentFiltered;
    }, [purchases, filterMonthYear, isTodayFilterActive, statusFilter, debouncedSearchTerm]); // Added isTodayFilterActive dependency


    // --- Filtered Summary Stats ---
    const filteredSummaryStats = useMemo(() => {
        let revenue = 0;
        let items = 0;
        filteredPurchases.forEach(purchase => {
             const revenueContributingStatuses = ['Paid', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Completed'];
             if (revenueContributingStatuses.includes(purchase.paymentStatus)) {
                // Calculate revenue from individual items, excluding canceled/refunded items
                let orderRevenue = purchase.medicines?.reduce((sum, med) =>
                    !['Canceled', 'Refunded'].includes(med.status) ? sum + ((med.price || 0) * (med.quantity || 0)) : sum, 0) || 0;
                 // Use totalAmount if available and positive, otherwise use calculated item revenue
                 revenue += (purchase.totalAmount > 0 ? purchase.totalAmount : orderRevenue);
             }
             // Calculate items delivered/completed based on purchase status
             const completedItemStatuses = ['Delivered', 'Completed'];
            if (completedItemStatuses.includes(purchase.paymentStatus)) {
                 // Count items based on individual item status (not canceled/refunded)
                 items += purchase.medicines?.reduce((sum, med) =>
                    !['Canceled', 'Refunded'].includes(med.status) ? sum + (med.quantity || 0) : sum, 0) || 0;
            }
        });
        return { totalRevenue: revenue, totalItemsSold: items };
    }, [filteredPurchases]);

    // --- Overall Summary Stats ---
    const overallSummaryStats = useMemo(() => {
        let completedRevenue = 0;
        let completedOrdersCount = 0;
        let completedItemsCount = 0;
        const completedStatuses = ['Completed', 'Delivered'];

        purchases.forEach(purchase => {
            if (completedStatuses.includes(purchase.paymentStatus)) {
                completedOrdersCount++;
                let orderRevenue = 0;
                let orderItems = 0;
                purchase.medicines?.forEach(med => {
                    if (!['Canceled', 'Refunded'].includes(med.status)) { // Consider only non-canceled/non-refunded items
                        orderRevenue += (med.price || 0) * (med.quantity || 0);
                        orderItems += (med.quantity || 0);
                    }
                });
                 // Use totalAmount if available and positive, otherwise use calculated item revenue
                completedRevenue += (purchase.totalAmount > 0 ? purchase.totalAmount : orderRevenue);
                completedItemsCount += orderItems;
            }
        });
        return {
            totalCompletedRevenue: completedRevenue,
            totalCompletedOrders: completedOrdersCount,
            totalCompletedItems: completedItemsCount
        };
    }, [purchases]);


    // --- Excel Export Function ---
    const handleExportToExcel = useCallback(() => {
        if (!filteredPurchases || filteredPurchases.length === 0) {
            toast.info("No purchase data matching current filters to export.");
            return;
        }

        // Prepare data for the worksheet
        const dataForExport = filteredPurchases.map(purchase => {
            // Summarize medicine items for a single cell in the Excel row
            const medicineSummary = purchase.medicines
                ?.map(item => {
                    const name = item.medicineId?.name || item.name || 'Unknown';
                    const qty = item.quantity || 0;
                    const price = formatCurrency(item.price || 0); // Format price for display in summary
                    const status = item.status || 'N/A';
                    return `${name} (x${qty}, ${price}/item, Status: ${status})`;
                })
                .join('\n') || 'No items'; // Use newline for readability in cell

            // Combine user info for better readability in export
            const userInfo = `Name: ${purchase.userId?.name || purchase.userName || 'N/A'}\nEmail: ${purchase.userId?.email || purchase.email || 'N/A'}\nPhone: ${purchase.userId?.phoneNumber || purchase.phoneNumber || 'N/A'}`;


            return {
                'Purchase ID': purchase._id,
                'Date': safeFormatDateTime(purchase.effectiveDate),
                'Status': purchase.paymentStatus || 'N/A',
                'Total Amount': purchase.totalAmount || 0, // Use raw number for Excel to format
                'Payment ID': purchase.razorpayPaymentId || 'N/A',
                'User Info': userInfo, // Combined user info
                'Items Purchased (Name, Qty, Price/Item, Status)': medicineSummary, // Detailed items summary
                // Add more fields from the purchase object as needed
            };
        });

        // Define the column headers (matching keys in dataForExport objects)
        const headers = [
            'Purchase ID',
            'Date',
            'Status',
            'Total Amount',
            'Payment ID',
            'User Info',
            'Items Purchased (Name, Qty, Price/Item, Status)'
        ];

        // Create a worksheet from the data
        const ws = XLSX.utils.json_to_sheet(dataForExport, { header: headers });

         // Optional: Auto-fit column widths - this can be tricky, simple estimate
         const colWidths = headers.map(header => {
            // Estimate width based on header and max data length in that column
             const maxLength = Math.max(...dataForExport.map(row => String(row[header]).length), header.length);
             return { wch: Math.min(maxLength, 60) }; // Cap width at 60 characters to avoid excessively wide columns
         });
         ws['!cols'] = colWidths;

        // Apply text wrapping to the 'Items Purchased' and 'User Info' columns
         const itemsColIndex = headers.indexOf('Items Purchased (Name, Qty, Price/Item, Status)');
         const userColIndex = headers.indexOf('User Info');

         if (itemsColIndex !== -1) {
             // Assuming row 1 is headers (0-indexed) and data starts from row 2
             for(let R = 1; R <= dataForExport.length; ++R) {
                 const cellAddress = XLSX.utils.encode_cell({r: R, c: itemsColIndex});
                 if (ws[cellAddress]) {
                     ws[cellAddress].s = { alignment: { wrapText: true } };
                 }
             }
         }
          if (userColIndex !== -1) {
             for(let R = 1; R <= dataForExport.length; ++R) {
                 const cellAddress = XLSX.utils.encode_cell({r: R, c: userColIndex});
                 if (ws[cellAddress]) {
                     ws[cellAddress].s = { alignment: { wrapText: true } };
                 }
             }
         }


        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Purchases"); // Sheet name

        // Generate the Excel file (Blob)
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        // Determine filename based on filters for context (optional)
        let filename = 'purchases_export';
        if (isTodayFilterActive) filename += '_today';
        else if (filterMonthYear) filename += `_${filterMonthYear}`;
        if (statusFilter !== 'All') filename += `_${statusFilter}`;
        if (debouncedSearchTerm) filename += '_search'; // Could add search term, but might be long
        filename += `_${new Date().toISOString().slice(0, 10)}.xlsx`; // Add date

        // Trigger download using file-saver
        saveAs(blob, filename);

        toast.success(`Exported ${filteredPurchases.length} purchases to Excel!`);

    }, [filteredPurchases, safeFormatDateTime, formatCurrency, isTodayFilterActive, filterMonthYear, statusFilter, debouncedSearchTerm]); // Dependencies for useCallback


    // --- Initial Fetch Effect ---
    useEffect(() => {
        if (token) { fetchPurchases(); }
        else { setLoading(false); toast.warn("Not logged in."); }
    }, [token, fetchPurchases]);

    // --- Event Handlers ---
    const handleMonthFilterChange = (event) => {
        const monthValue = event.target.value;
        setFilterMonthYear(monthValue);
        if (monthValue) {
            setIsTodayFilterActive(false);
        }
    };

    const handleTodayFilterClick = () => {
        setIsTodayFilterActive(true);
        setFilterMonthYear('');
    };

     const handleClearDateFilters = () => {
         setIsTodayFilterActive(false);
         setFilterMonthYear('');
     }


    const handleStatusChange = (event) => setStatusFilter(event.target.value);
    const handleSearchChange = (event) => setSearchTerm(event.target.value);

    // Combined check for any active filter for UI logic
    const hasActiveFilters = isTodayFilterActive || filterMonthYear || statusFilter !== 'All' || searchTerm;

    const handleClearAllFilters = () => {
        setFilterMonthYear('');
        setIsTodayFilterActive(false);
        setStatusFilter('All');
        setSearchTerm('');
    };


    // --- Render Logic ---
     const renderNoPurchasesMessage = () => {
        let message = "No purchase records have been made yet.";
         // Check if the base purchase list is non-empty but the filtered list is empty
        if (purchases.length > 0 && filteredPurchases.length === 0) {
            message = "No purchases match the current filter criteria.";
            if (isTodayFilterActive) {
                 message = "No purchases found for today that match other filters.";
            } else if (filterMonthYear) {
                message = `No purchases found for ${filterMonthYear} that match other filters.`
            }
        }
        // Specific message if only date filters yield no results, even with base data
        else if (isTodayFilterActive && purchases.length > 0 && !filteredPurchases.length) {
             message = "No purchases were made today.";
        } else if (filterMonthYear && purchases.length > 0 && !filteredPurchases.length) {
            message = `No purchases were made in ${filterMonthYear}.`;
        }


        return (
            <div className="flex flex-col items-center justify-center py-16 text-center col-span-1 md:col-span-2 xl:col-span-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Purchases Found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">{message}</p>
                {hasActiveFilters && ( // Show Clear Filters button if filters are active and no results
                     <button
                        onClick={handleClearAllFilters}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 dark:focus:ring-offset-gray-900"
                     >
                         <X className="mr-2 h-4 w-4" /> Clear All Filters
                     </button>
                )}
            </div>
        );
    };


    // Initial Loading Screen
    if (loading && purchases.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Spinner size="w-10 h-10" />
                <span className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading Purchase Data...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> User Purchases
                </h2>
                 <button
                    onClick={() => fetchPurchases()}
                    disabled={loading}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150 ${loading && purchases.length > 0 ? 'animate-pulse' : ''}`} // Added subtle pulse on refresh
                    aria-label="Reload Purchase Data"
                >
                    {loading && purchases.length > 0 ? <Spinner size="h-4 w-4 mr-1.5" /> : <Loader2 size={14} className="mr-1.5"/>}
                    {loading && purchases.length > 0 ? 'Refreshing...' : 'Reload Data'}
                </button>
            </div>


            {/* Overall Summary Stats Section */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/80 shadow-md space-y-4">
                 <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 border-b pb-2 dark:border-gray-600 flex items-center gap-2">
                     <BarChart3 size={18} className="text-gray-500 dark:text-gray-400" /> Overall Performance Summary
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {/* Stats Blocks (Revenue, Orders, Items) - Kept as before */}
                     <div className="flex items-center gap-3 bg-white dark:bg-gray-700/60 p-3.5 rounded-lg border border-gray-200 dark:border-gray-600/80 shadow-sm hover:shadow-md transition-shadow duration-200">
                         <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex-shrink-0"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                         <div>
                             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Completed Revenue</p>
                             <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(overallSummaryStats.totalCompletedRevenue)}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3 bg-white dark:bg-gray-700/60 p-3.5 rounded-lg border border-gray-200 dark:border-gray-600/80 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="p-2.5 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex-shrink-0"><CheckSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /></div>
                          <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Completed Orders</p>
                              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{overallSummaryStats.totalCompletedOrders.toLocaleString()}</p>
                          </div>
                     </div>
                     <div className="flex items-center gap-3 bg-white dark:bg-gray-700/60 p-3.5 rounded-lg border border-gray-200 dark:border-gray-600/80 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="p-2.5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex-shrink-0"><Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
                          <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Completed Items</p>
                              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{overallSummaryStats.totalCompletedItems.toLocaleString()}</p>
                          </div>
                     </div>
                 </div>
                 <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic pt-2">
                     Overall stats reflect all historical purchases considered 'Completed' or 'Delivered'. Filter settings do not affect these numbers.
                 </p>
            </div>


            {/* Filter and Filtered Summary Section */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shadow-sm space-y-5">
                 <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1 border-b pb-2 dark:border-gray-600/50 flex items-center gap-2">
                    <Filter size={18} className="text-gray-500 dark:text-gray-400" /> Filters & Current View Summary
                 </h3>

                 {/* Filter Controls Row */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    {/* Search Input */}
                    <div className="relative">
                         <label htmlFor="searchFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Search Purchases</label>
                         <div className="relative">
                             <Search size={18} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                             <input
                                type="text" id="searchFilter" placeholder="User, Email, Phone, ID, Item..." value={searchTerm} onChange={handleSearchChange}
                                className="p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                                aria-label="Search purchases by keyword"
                            />
                           {searchTerm && (<button onClick={() => setSearchTerm('')} title="Clear Search" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" aria-label="Clear search input"><X size={16} /></button>)}
                        </div>
                    </div>

                    {/* Date Filters (Month & Today) */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Filter by Date</label>
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap"> {/* Allow wrap on small screens */}
                            {/* Month Input */}
                            <input
                                type="month" id="monthFilter" value={filterMonthYear} onChange={handleMonthFilterChange} disabled={isTodayFilterActive}
                                className={`p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 w-full min-w-[140px] ${isTodayFilterActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label={isTodayFilterActive ? "Month filter disabled when Today is active" : "Filter purchases by month"}
                            />
                            {/* Clear Month/Today Button - Combined */}
                             {(filterMonthYear || isTodayFilterActive) && (
                                 <button onClick={handleClearDateFilters} title="Clear Date Filters" className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0" aria-label="Clear date filters">
                                     <X size={18} />
                                 </button>
                             )}
                            {/* Today Button */}
                            <button
                                onClick={handleTodayFilterClick} title="Filter for Today"
                                className={`px-3 py-2 border rounded-md text-sm shadow-sm flex-shrink-0 flex items-center gap-1 transition-colors whitespace-nowrap ${isTodayFilterActive
                                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 ring-2 ring-offset-1 ring-indigo-400 dark:ring-offset-gray-800' // Highlight active Today
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                aria-pressed={isTodayFilterActive}
                            > <CalendarDays size={14} /> Today
                            </button>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                         <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Filter by Status</label>
                        <div className="flex items-center gap-2">
                            <select
                                id="statusFilter" value={statusFilter} onChange={handleStatusChange}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 w-full capitalize"
                                aria-label="Filter purchases by status"
                            >
                                {STATUS_OPTIONS.map(status => (<option key={status} value={status} className="capitalize">{status.replace(/_/g, ' ')}</option>))}
                            </select>
                            {statusFilter !== 'All' && (<button onClick={() => setStatusFilter('All')} title="Clear Status Filter" className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0" aria-label="Clear status filter"><X size={18} /></button>)}
                         </div>
                    </div>
                 </div>

                 {/* Filter Actions Row (Clear All & Export) */}
                 <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600/50">
                    {/* Clear All Filters Button */}
                    {hasActiveFilters && (
                         <button
                            onClick={handleClearAllFilters}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition ease-in-out duration-150"
                            aria-label="Clear all active filters"
                         >
                             <X className="mr-1.5 h-4 w-4" /> Clear All Filters
                         </button>
                    )}
                    {/* Spacer if no clear filters button */}
                    {!hasActiveFilters && <div></div>}

                    {/* Export to Excel Button */}
                     <button
                        onClick={handleExportToExcel}
                        disabled={filteredPurchases.length === 0} // Disable if no data to export
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150"
                         aria-label={`Export ${filteredPurchases.length} purchases to Excel`}
                    >
                        <Download size={14} className="mr-1.5"/>
                        Export to Excel ({filteredPurchases.length})
                    </button>
                 </div>


                {/* Filtered Summary Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600/50"> {/* Added border-t */}
                    {/* Filtered Revenue */}
                     <div className="flex items-center gap-3 bg-white dark:bg-gray-700/60 p-3 rounded-md border border-gray-200 dark:border-gray-600/80 shadow-sm">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50 flex-shrink-0"><DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Revenue (Current View)</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(filteredSummaryStats.totalRevenue)}</p>
                        </div>
                    </div>
                    {/* Filtered Items */}
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-700/60 p-3 rounded-md border border-gray-200 dark:border-gray-600/80 shadow-sm">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 flex-shrink-0"><ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Items Delivered (Current View)</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{filteredSummaryStats.totalItemsSold.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                {/* Info about filtered stats */}
                {hasActiveFilters && filteredPurchases.length > 0 && ( // Only show info if filters applied AND there are results
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic pt-1">
                        Summary stats above reflect the currently applied filters ({filteredPurchases.length} purchases).
                    </p>
                )}
            </div>


            {/* Purchase Cards Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative min-h-[300px]">
                 {/* Refreshing Overlay */}
                 {loading && purchases.length > 0 && (
                     <div className="absolute inset-0 bg-gray-100/60 dark:bg-gray-900/60 flex justify-center items-center z-10 rounded-lg backdrop-blur-sm">
                         <Spinner size="w-7 h-7" />
                         <span className="ml-3 text-gray-700 dark:text-gray-300">Refreshing Data...</span>
                     </div>
                 )}

                {/* Conditional Rendering: Cards or No Purchases Message */}
                {!loading && filteredPurchases.length > 0 ? (
                    filteredPurchases.map((purchase) => (
                        <PurchaseCard
                            key={purchase._id}
                            purchase={purchase}
                            onConfirm={handleConfirmPurchase}
                            onCancel={handleCancelPurchase}
                            actionLoading={actionLoading}
                            formatCurrency={formatCurrency}
                            safeFormatDateTime={safeFormatDateTime}
                        />
                    ))
                ) : (
                   !loading && renderNoPurchasesMessage() // Show message if not loading and no results
                )}
            </div>
        </div>
    );
};

export default Purchases;