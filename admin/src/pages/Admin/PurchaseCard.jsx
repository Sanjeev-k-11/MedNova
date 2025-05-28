// src/components/Admin/PurchaseCard.jsx
import React from "react";
import {
    User, Phone, Mail, Loader2, Package, CalendarDays, Receipt, Hash, Check, Ban, Info, DollarSign, ShoppingCart, X
} from "lucide-react";
import { useTheme } from '../../context/ThemeContext'; // Assuming context path is correct

// --- Helper Functions --- (Can be moved to a shared utils file later)
const safeFormatDateTime = (dateInput) => {
    if (!dateInput) return 'N/A';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (e) {
        console.error("Error formatting date:", dateInput, e);
        return 'Invalid Date';
    }
};

const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '$--.--'; // Or some other placeholder
    }
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); // Adjust currency as needed
};

const getStatusBadgeClasses = (status) => {
    const baseClasses = "px-2.5 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-full whitespace-nowrap capitalize";
    switch (status?.toLowerCase()) {
        case 'delivered':
        case 'completed':
            return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`;
        case 'canceled':
            return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`;
        case 'paid':
            return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`;
        case 'partially canceled':
        case 'partially refunded':
            return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`;
        case 'processing':
        case 'shipped':
        case 'out for delivery':
            return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300`;
        case 'refunded':
            return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300`;
        case 'failed':
            return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`; // Same as canceled visually
        case 'pending':
        default:
            return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
};

const PurchaseCard = ({ purchase, onConfirm, onCancel, actionLoading }) => {
    const { currentTheme } = useTheme(); // Get theme if needed inside the card

    const isCurrentActionLoading = actionLoading.purchaseId === purchase._id;
    const currentActionType = actionLoading.type;
    const paymentStatus = purchase.paymentStatus || 'Pending';
    const isCompleted = purchase.isCompleted || purchase.paymentStatus === 'Delivered';
    const isCancelled = purchase.paymentStatus === 'Canceled' || purchase.cancelled;

    // Button Disable Logic
    const disableConfirm = isCompleted || isCancelled || paymentStatus === 'Failed' || paymentStatus === 'Refunded' || paymentStatus === 'Pending';
    const disableCancelPurchase = isCompleted || isCancelled || paymentStatus === 'Refunded';

    const displayUserName = purchase.userId?.name || purchase.userName || 'N/A';
    const displayUserPhone = purchase.userId?.phoneNumber || purchase.phoneNumber || 'N/A';
    const displayUserEmail = purchase.userId?.email || purchase.email;
    const displayUserImage = purchase.userId?.image || purchase.image;

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 overflow-hidden flex flex-col transition-shadow hover:shadow-md">
            {/* Card Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 flex-shrink min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0 overflow-hidden">
                            {displayUserImage ? <img src={displayUserImage} alt={displayUserName} className="w-full h-full object-cover" /> : <User size={20} />}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate" title={displayUserName}>{displayUserName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={displayUserPhone}><Phone size={11} className="inline mr-1" />{displayUserPhone}</p>
                            {displayUserEmail && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={displayUserEmail}><Mail size={11} className="inline mr-1" />{displayUserEmail}</p>}
                        </div>
                    </div>
                    <span className={getStatusBadgeClasses(paymentStatus)}>
                        {paymentStatus.replace(/_/g, ' ')}
                    </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1 px-4"><CalendarDays size={12} /><span>{safeFormatDateTime(purchase.dateOfPurchase || purchase.createdAt)}</span></div>
                 {/* Display Purchase ID clearly */}
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1 px-4" title={`Purchase ID: ${purchase._id}`}><Hash size={10}/><span>ID: {purchase._id}</span></div>
            </div>

            {/* Card Body - Items List */}
            <div className="p-4 flex-grow space-y-3">
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Items Purchased:</h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 pr-1">
                        {purchase.medicines?.map((med, idx) => {
                            const itemStatus = med.status || 'Paid'; // Default to Paid if missing
                            const isItemCancelled = itemStatus === 'Canceled' || itemStatus === 'Refunded';
                            return (
                                <div key={med._id || idx} className={`flex justify-between items-center text-xs border-b border-dashed border-gray-200 dark:border-gray-700 last:border-b-0 py-1.5 ${isItemCancelled ? 'opacity-60' : ''}`}>
                                    <span className={`flex-grow truncate pr-2 ${isItemCancelled ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`} title={`${med.name || "Unknown Medicine"} - Status: ${itemStatus}`}>
                                        {med.quantity} x {med.name || "Unknown"}
                                        {(itemStatus !== 'Paid' && !isItemCancelled) && <span className={`ml-1.5 text-[10px] italic ${itemStatus === 'Partially Canceled' || itemStatus === 'Partially Refunded' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>({itemStatus})</span>}
                                        {isItemCancelled && <span className="ml-1.5 text-[10px] italic text-red-500 dark:text-red-400">({itemStatus})</span>}
                                    </span>
                                    <span className={`font-medium whitespace-nowrap mx-2 ${isItemCancelled ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {formatCurrency((med.price || 0) * (med.quantity || 0))}
                                    </span>
                                </div>
                            );
                        })}
                        {(!purchase.medicines || purchase.medicines.length === 0) && <p className="text-xs text-gray-400 italic">No item details.</p>}
                    </div>
                </div>
                {/* Total Amount & Payment ID */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5"><Receipt size={14} /> Total Amount:</span>
                        <span className="text-base font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(purchase.totalAmount)}</span>
                    </div>
                    {purchase.razorpayPaymentId && <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1"><Hash size={12} /><span className="truncate" title={purchase.razorpayPaymentId}>Payment ID: {purchase.razorpayPaymentId}</span></div>}
                </div>
            </div>

            {/* Card Footer - Overall Actions */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                <div className="flex justify-end gap-2">
                    {/* Cancel Purchase Button */}
                    <button
                        onClick={() => onCancel(purchase._id)}
                        disabled={disableCancelPurchase || isCurrentActionLoading}
                        title={disableCancelPurchase ? "Cannot cancel a completed, refunded, or already canceled order" : `Cancel purchase ${purchase._id}`}
                        className={`inline-flex items-center gap-1 justify-center px-2 py-1 text-[11px] font-medium rounded border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150
                        ${disableCancelPurchase ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300 dark:border-gray-500' : 'border-red-500 text-red-600 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500 dark:border-red-500 dark:text-red-400 dark:focus:ring-red-600'}
                        ${isCurrentActionLoading && currentActionType === 'cancel' ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isCurrentActionLoading && currentActionType === 'cancel' ? (<Loader2 className="w-3 h-3 animate-spin" />) : (<Ban size={12} />)}
                        Cancel
                    </button>
                    {/* Confirm Button (Consider renaming based on actual action e.g., 'Mark Processed' or 'Ship') */}
                    <button
                        onClick={() => onConfirm(purchase._id)}
                        disabled={disableConfirm || isCurrentActionLoading}
                         title={disableConfirm ? "Cannot confirm: Order is completed, canceled, failed, refunded, or pending payment" : `Confirm purchase ${purchase._id} for processing/delivery`}
                        className={`inline-flex items-center gap-1 justify-center px-2 py-1 text-[11px] font-medium rounded border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150
                        ${disableConfirm ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300 dark:border-gray-500' : 'border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'}
                        ${isCurrentActionLoading && currentActionType === 'confirm' ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isCurrentActionLoading && currentActionType === 'confirm' ? (<Loader2 className="w-3 h-3 animate-spin" />) : (<Check size={12} />)}
                        Confirm {/* Or 'Process', 'Ship', etc. */}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseCard;