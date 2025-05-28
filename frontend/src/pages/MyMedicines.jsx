import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle, XCircle, AlertTriangle, ShoppingBag, Loader2, ArrowLeft, Package, Calendar, Hash, Tag, Box, CircleDollarSign } from 'lucide-react'; // Added more icons
import { useTheme } from '../context/ThemeContext';

// Simple Spinner Component
const Spinner = ({ size = 'h-8 w-8' }) => (
    <Loader2 className={`animate-spin text-blue-500 ${size}`} />
);

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric' // e.g., 15 Jul 2023
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

// Helper to determine status display
const getItemStatusDisplay = (status) => {
    let icon, colorClass, text;
    switch (status) {
        case 'Canceled':
            icon = <XCircle className="w-4 h-4 mr-1.5" />;
            colorClass = "text-red-600 dark:text-red-400";
            text = "Canceled";
            break;
        case 'Paid':
        case 'Processing': // Consider if 'Processing' needs a different visual cue
            icon = <CheckCircle className="w-4 h-4 mr-1.5" />;
            colorClass = "text-green-600 dark:text-green-400";
            text = status; // Could customize 'Paid' to 'Order Placed' or similar if needed
            break;
        case 'Shipped': // Example: Add more statuses if available
             icon = <Package className="w-4 h-4 mr-1.5" />;
             colorClass = "text-blue-600 dark:text-blue-400";
             text = "Shipped";
             break;
        case 'Delivered': // Example: Add more statuses if available
             icon = <CheckCircle className="w-4 h-4 mr-1.5 text-teal-600 dark:text-teal-400" />;
             colorClass = "text-teal-600 dark:text-teal-400";
             text = "Delivered";
             break;
        default:
            icon = <AlertTriangle className="w-4 h-4 mr-1.5" />;
            colorClass = "text-yellow-600 dark:text-yellow-400";
            text = status || "Status Unknown";
    }
    return { icon, colorClass, text };
};


const MyMedicines = () => {
    const { token, backendUrl } = useContext(AppContext);
    const { currentTheme } = useTheme();
    const navigate = useNavigate();

    const [groupedPurchases, setGroupedPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    // Changed back to cancelingItemId to track individual item cancellation
    const [cancelingItemId, setCancelingItemId] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // --- Data Grouping and Fetching ---
    const groupAndSortMedicines = (medicines) => {
        if (!medicines || medicines.length === 0) return [];
        const grouped = medicines.reduce((acc, item) => {
            const key = item.purchaseId;
            if (!acc[key]) {
                acc[key] = { purchaseId: item.purchaseId, dateOfPurchase: item.dateOfPurchase, items: [] };
            }
            acc[key].items.push(item);
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => new Date(b.dateOfPurchase) - new Date(a.dateOfPurchase));
    };

    const fetchMyMedicines = useCallback(async (showLoadingIndicator = true) => {
        if (!token) {
            setLoading(false);
            setIsInitialLoad(false);
            setGroupedPurchases([]);
            return;
        }
        if (showLoadingIndicator) setLoading(true);
        try {
            const { data } = await axios.get(`${backendUrl}/api/medicine/my-medicines`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) {
                setGroupedPurchases(groupAndSortMedicines(data.medicines));
            } else {
                toast.error(data.message || "Failed to fetch purchases.");
                setGroupedPurchases([]);
            }
        } catch (error) {
            console.error("Error fetching medicines:", error);
            if (error.response?.status === 401) {
                 toast.warn("Session expired. Please log in again.");
                 navigate("/login");
            } else {
                toast.error(error.response?.data?.message || "Error fetching purchases.");
            }
            setGroupedPurchases([]);
        } finally {
             if (showLoadingIndicator) setLoading(false);
             setIsInitialLoad(false);
        }
    }, [token, backendUrl, navigate]);

    useEffect(() => {
        fetchMyMedicines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]); // Fetch only when token changes

    // --- Cancel Single Order Item Handler ---
    const handleCancelOrder = async (purchaseId, medicineItemId) => {
        // Using a simple confirm for now, replace with modal if needed
        if (!window.confirm("Are you sure you want to cancel this specific medicine item from your order? This cannot be undone.")) {
            return;
        }
        setCancelingItemId(medicineItemId); // Set loading state for this specific item
        try {
            const { data } = await axios.post(`${backendUrl}/api/medicine/cancel-order`,
                { purchaseId, medicineItemId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success("Item canceled. Refund processing initiated (if applicable).");
                await fetchMyMedicines(false); // Refresh without full load indicator
            } else {
                toast.error(data.message || "Failed to cancel item.");
            }
        } catch (error) {
            console.error("Error canceling item:", error);
            toast.error(error.response?.data?.message || "Error canceling item.");
        } finally {
            setCancelingItemId(null); // Clear loading state for this item
        }
    };

    // --- Render Logic ---

    // Login Prompt
    if (!isInitialLoad && !token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 rounded-lg" style={{ backgroundColor: currentTheme.background, color: currentTheme.textColor }}>
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-semibold mb-3">Authentication Required</h2>
                <p className="opacity-80 mb-6">Please log in to view your purchase history.</p>
                <button onClick={() => navigate("/login")} className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-colors duration-200">
                    Go to Login
                </button>
            </div>
        );
    }

    // Initial Loading State
    if (isInitialLoad && loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]" style={{ backgroundColor: currentTheme.background }}>
                <Spinner size="h-12 w-12" />
                <p className="mt-4 text-lg opacity-80" style={{ color: currentTheme.textColor }}>Loading your purchases...</p>
            </div>
        );
    }

    // No Purchases Found State
    if (!loading && groupedPurchases.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 rounded-lg" style={{ backgroundColor: currentTheme.background, color: currentTheme.textColor }}>
                <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-3">No Purchase History</h2>
                <p className="opacity-80 mb-6">You haven't bought anything yet. Time to shop!</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => navigate("/medicines")} className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-green-600 transition-colors duration-200">
                        Browse Medicines
                    </button>
                    <button onClick={() => navigate(-1)} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                    </button>
                 </div>
            </div>
        );
    }

    // Main Content
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8" style={{ color: currentTheme.textColor }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-8 gap-4"> {/* Increased bottom margin */}
                <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
                   <Package className="w-8 h-8 text-blue-600 dark:text-blue-400"/> My Purchases
                </h1>
                 <button onClick={() => navigate(-1)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200 flex items-center text-sm whitespace-nowrap dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
            </div>

            {/* Purchases List */}
            <div className="space-y-10"> {/* Increased spacing between orders */}
                {groupedPurchases.map((purchase) => (
                    <div key={purchase.purchaseId} className="rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        {/* Order Header */}
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                             <div className="flex items-center text-base font-semibold text-gray-800 dark:text-gray-200">
                                 <Hash className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                 Order ID: <span className="ml-1.5 font-mono text-gray-900 dark:text-gray-100">{purchase.purchaseId}</span>
                             </div>
                             <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4 mr-2"/>
                                Purchased On: <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{formatDate(purchase.dateOfPurchase)}</span>
                             </div>
                         </div>

                        {/* Items within the Order */}
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {purchase.items.map((item) => {
                                const totalPrice = (item.pricePaid * item.quantity).toFixed(2);
                                // Check if *this specific item* is being canceled
                                const isCancelingThis = cancelingItemId === item.medicineItemId;
                                const isCanceled = item.itemStatus === 'Canceled';
                                // Check if *this specific item* can be canceled (e.g., status is 'Paid')
                                const canCancel = item.itemStatus === 'Paid'; // Define your cancelable condition here
                                const { icon: statusIcon, colorClass: statusColor, text: statusText } = getItemStatusDisplay(item.itemStatus);

                                return (
                                    // Re-added the Actions div at the end of the flex row
                                    <div key={item.medicineItemId} className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                                        {/* Image */}
                                        <div className="flex-shrink-0 w-full sm:w-24 h-24 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center p-1">
                                            <img
                                                src={item.imageUrl || "/images/default-medicine.png"}
                                                alt={item.name}
                                                className="max-h-full max-w-full object-contain"
                                                onError={(e) => { e.target.onerror = null; e.target.src = '/images/default-medicine.png'; }}
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-grow">
                                            <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100" title={item.name}>{item.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">By: {item.manufacturer || "N/A"}</p>
                                            {/* Grid for Price, Qty, Total */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm mb-3 text-gray-700 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                   <Tag size={14} className="text-gray-400"/> <span className="font-medium">Price:</span> ₹{item.pricePaid.toFixed(2)}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                   <Box size={14} className="text-gray-400"/> <span className="font-medium">Qty:</span> {item.quantity}
                                                </div>
                                                <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                                                   <CircleDollarSign size={14} className="text-gray-400"/> <span className="font-medium">Item Total:</span> <span className="font-semibold text-blue-700 dark:text-blue-400">₹{totalPrice}</span>
                                                </div>
                                            </div>
                                             {/* Status Display */}
                                             <div className={`flex items-center text-sm font-medium ${statusColor} capitalize mt-2`}>
                                                {statusIcon}
                                                {statusText}
                                            </div>
                                        </div>

                                        {/* Re-added Actions Section for Individual Items */}
                                        <div className="flex-shrink-0 sm:ml-4 mt-4 sm:mt-0 flex items-center justify-end min-w-[110px]"> {/* Added min-width for consistency */}
                                            {canCancel && (
                                                <button
                                                    onClick={() => handleCancelOrder(item.purchaseId, item.medicineItemId)}
                                                    disabled={isCancelingThis || loading} // Disable if this item is canceling or global loading
                                                    // Restored button styling from previous version
                                                    className={`bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1.5 ${isCancelingThis || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isCancelingThis ? (
                                                        <> <Spinner size="h-4 w-4" /> Canceling... </>
                                                    ) : (
                                                        <> <XCircle size={14}/> Cancel Item </>
                                                    )}
                                                </button>
                                            )}
                                            {isCanceled && (
                                                <p className="text-xs text-center text-red-600 dark:text-red-400 font-medium">Item Canceled</p>
                                            )}
                                            {!canCancel && !isCanceled && (
                                                // Optionally show why it can't be canceled if status is not 'Paid'
                                                <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic">Cannot Cancel</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div> {/* End Items List */}
                        {/* Removed the Order Footer which had the "Cancel Entire Order" button */}
                    </div> // End Order Card
                ))}
            </div> {/* End Purchases List */}

            {/* Floating Loading indicator for updates */}
            {loading && !isInitialLoad && (
                 <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg z-50 border border-gray-200 dark:border-gray-600">
                    <Spinner size="h-6 w-6" />
                 </div>
            )}
        </div> // End Container
    );
};

export default MyMedicines;