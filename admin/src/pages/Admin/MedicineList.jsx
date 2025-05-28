import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaUndo } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import libraries for Excel download
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Assuming themes.js is in the same directory or adjust path
import { themes, getThemeClasses } from './themes';

// Spinner component remains the same
const Spinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);


const MedicineList = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [stockFilter, setStockFilter] = useState("all");
    const [showDelete, setShowDelete] = useState(false);
    const navigate = useNavigate();

    // --- Theme State ---
    const [currentThemeName, setCurrentThemeName] = useState(() => {
        // Load theme from localStorage or default
        return localStorage.getItem("medicineListTheme") || "Default";
    });
    const [activeTheme, setActiveTheme] = useState(() => getThemeClasses(currentThemeName));

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // --- Update activeTheme when currentThemeName changes ---
    useEffect(() => {
        setActiveTheme(getThemeClasses(currentThemeName));
        localStorage.setItem("medicineListTheme", currentThemeName); // Save preference
    }, [currentThemeName]);

    // Fetch medicines on component mount
    useEffect(() => {
        getAllMedicines();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Add getAllMedicines to dependencies or remove eslint override if it changes

    // --- Handlers ---
    const getAllMedicines = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Authentication token not found. Please log in.");
            setLoading(false);
            return;
        }
        try {
            const { data } = await axios.get(`${backendUrl}/api/admin/get-all-medicines`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) {
                // Assuming the response has a `medicines` array
                setMedicines(data.medicines || []);
            } else {
                toast.error(data.message || "Failed to fetch medicines.");
                setMedicines([]);
            }
        } catch (error) {
            console.error("Fetch medicines error:", error);
            toast.error("An error occurred while fetching medicines.");
            setMedicines([]); // Set to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const checkStock = async (medicineId) => {
         const medicine = medicines.find(m => m._id === medicineId);
         if (!medicine) {
             toast.error("Medicine not found in local state.");
             return;
         }
         toast.info(`Current local stock for ${medicine.name}: ${medicine.quantity}`);
        // Optional: Ping server to get real-time stock if needed
        // const token = localStorage.getItem("token");
        // if (!token) return toast.error("No token found. Please log in.");
        // try {
        //     const { data } = await axios.get(`${backendUrl}/api/admin/check-stock/${medicineId}`, {
        //         headers: { Authorization: `Bearer ${token}` },
        //     });
        //     if (data.success) {
        //         toast.info(`Real-time stock for ${medicine.name}: ${data.quantity}`);
        //         // You might update local state here if needed
        //     } else {
        //         toast.warn(data.message || "Failed to get real-time stock.");
        //     }
        // } catch (error) {
        //     console.error("Check stock error:", error);
        //     toast.error("Failed to check stock with server.");
        // }
    };

    const deleteMedicine = async (medicineId) => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("No token found. Please log in.");
        if (window.confirm("Are you sure you want to permanently delete this medicine? This action cannot be undone.")) {
            try {
                const { data } = await axios.delete(
                    `${backendUrl}/api/admin/delete-medicine/${medicineId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (data.success) {
                    toast.success("Medicine deleted successfully!");
                    // Remove the deleted medicine from the local state
                    setMedicines((prev) => prev.filter((med) => med._id !== medicineId));
                } else {
                    toast.error(data.message || "Failed to delete medicine.");
                }
            } catch (error) {
                console.error("Delete medicine error:", error);
                toast.error("An error occurred while deleting the medicine.");
            }
        }
    };

    // --- Calculations & Filtering (using useMemo for performance) ---
    const inStockCount = useMemo(() => medicines.filter((med) => med.quantity > 0).length, [medicines]);
    const outOfStockCount = useMemo(() => medicines.length - inStockCount, [medicines]);

    const filteredMedicines = useMemo(() => {
        const searchLower = search.toLowerCase();
        return medicines.filter((med) => {
            const matchesSearch =
                (med.name && med.name.toLowerCase().includes(searchLower)) || // Check if name exists
                (med.manufacturer && med.manufacturer.toLowerCase().includes(searchLower)); // Check if manufacturer exists
            const matchesStock =
                stockFilter === "all" ||
                (stockFilter === "inStock" && med.quantity > 0) ||
                (stockFilter === "outOfStock" && med.quantity <= 0);
            return matchesSearch && matchesStock;
        });
    }, [medicines, search, stockFilter]);

    // --- Theme change handler ---
    const handleThemeChange = (event) => {
        setCurrentThemeName(event.target.value);
    };

    // --- Reset theme handler ---
    const resetTheme = () => {
        setCurrentThemeName("Default");
    };

    // --- Excel Download Logic ---
    const handleDownloadExcel = () => {
        if (!filteredMedicines || filteredMedicines.length === 0) {
            toast.info("No medicines to download based on current filters.");
            return;
        }

        // Prepare data for the sheet
        const dataForSheet = [
            [
                '#',
                'Name',
                'Manufacturer',
                'Strength', // Assuming strength exists
                'Quantity',
                'Original Price',
                'Discounted Price',
                'Stock Status'
            ], // Header Row
        ];

        filteredMedicines.forEach((item, index) => {
            dataForSheet.push([
                index + 1,
                item.name,
                item.manufacturer,
                item.strength || 'N/A', // Add strength, use N/A if missing
                item.quantity,
                item.originalPrice !== undefined ? item.originalPrice.toFixed(2) : 'N/A', // Handle potentially missing price
                item.discountedPrice !== undefined ? item.discountedPrice.toFixed(2) : 'N/A',
                item.quantity > 0 ? 'In Stock' : 'Out of Stock'
            ]);
        });

        // Create a workbook and add a sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dataForSheet); // aoa_to_sheet for Array of Arrays

        XLSX.utils.book_append_sheet(wb, ws, 'Medicine List');

        // Generate Excel file buffer
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        // Convert buffer to Blob and save
        const data = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        // Generate filename
        const filename = `Medicine_List_${new Date().toISOString().slice(0, 10)}.xlsx`; // Add date to filename

        saveAs(data, filename);
        toast.success("Medicine list downloaded!");
    };


    // --- JSX with Dynamic Theme Classes ---
    return (
        <div className={`container mx-auto p-4 md:p-6 max-h-[90vh] overflow-y-auto ${activeTheme.classes.containerBg}`}>
            {/* Header Section */}
            <div className={`flex flex-col sm:flex-row justify-between items-center mb-4 pb-2 border-b gap-4 sm:gap-0 ${activeTheme.classes.headerBorder}`}>
                <h1 className={`text-2xl md:text-3xl font-bold ${activeTheme.classes.headerText}`}>
                    🧮 All Medicines ({medicines.length})
                </h1>
                 {/* Controls: Theme, Reset Theme, Toggle Delete */}
                 <div className="flex items-center gap-2">
                     {/* Theme Selector Dropdown */}
                     <select
                         value={currentThemeName}
                         onChange={handleThemeChange}
                         className={`p-1 border rounded-md text-sm ${activeTheme.classes.inputBorder} ${activeTheme.classes.filterSectionBg} ${activeTheme.classes.filterText} focus:outline-none ${activeTheme.classes.focusRing} appearance-none bg-white`} // Added appearance-none, bg-white
                         aria-label="Select theme"
                     >
                         {themes.map(theme => (
                             <option key={theme.name} value={theme.name}>{theme.name}</option>
                         ))}
                     </select>
                     {/* Reset Theme Button */}
                     <button
                        onClick={resetTheme}
                        className={`p-1.5 rounded-md transition duration-150 ease-in-out ${activeTheme.classes.buttonSecondaryBg} ${activeTheme.classes.buttonSecondaryHoverBg} ${activeTheme.classes.buttonSecondaryText} disabled:opacity-50 disabled:cursor-not-allowed`} // Used secondary button styles
                        title="Reset to Default Theme"
                        aria-label="Reset theme to default"
                        disabled={currentThemeName === "Default"}
                    >
                        <FaUndo size={14} />
                    </button>
                    {/* Toggle Delete Button */}
                    <button
                        onClick={() => setShowDelete(!showDelete)}
                        className={`p-2 rounded-full transition duration-150 ease-in-out ${showDelete ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-gray-100'} ${showDelete ? 'text-red-600' : 'text-red-500 hover:text-red-700'}`} // Apply red color based on state
                        aria-label={showDelete ? "Hide delete buttons" : "Show delete buttons"}
                        title={showDelete ? "Hide Delete Buttons" : "Show Delete Buttons"}
                    >
                        <FaTrash className={`cursor-pointer text-xl`} /> {/* Color is applied by the button class */}
                    </button>
                </div>
            </div>

            {/* Stock Summary, Filters & Download */}
            <div className={`mb-6 p-4 rounded-lg shadow-sm ${activeTheme.classes.filterSectionBg}`}>
                <p className={`text-center ${activeTheme.classes.filterText} mb-4`}>
                    <span className={`font-medium ${activeTheme.classes.textHighlightGreen}`}>In Stock: {inStockCount}</span> |{' '}
                    <span className={`font-medium ${activeTheme.classes.textHighlightRed}`}>Out of Stock: {outOfStockCount}</span>
                </p>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search by name or manufacturer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                         className={`p-2 border rounded-lg w-full md:w-1/3 ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none`}
                    />
                    {/* Stock Filter Select */}
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className={`p-2 border rounded-lg w-full md:w-auto ${activeTheme.classes.inputBorder} ${activeTheme.classes.cardBg} ${activeTheme.classes.cardTitleText} ${activeTheme.classes.focusRing} focus:border-transparent outline-none appearance-none bg-white`} // Added appearance-none, bg-white
                    >
                        <option value="all">All Stock Status</option>
                        <option value="inStock">In Stock</option>
                        <option value="outOfStock">Out of Stock</option>
                    </select>
                     {/* Download Button */}
                    <button
                        onClick={handleDownloadExcel}
                        className={`flex-shrink-0 p-2 rounded-lg transition duration-150 ease-in-out w-full md:w-auto flex items-center justify-center gap-2 text-sm
                           ${activeTheme.classes.buttonPrimaryBg} ${activeTheme.classes.buttonPrimaryHoverBg} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={filteredMedicines.length === 0} // Disable if no items to download
                        aria-label={`Download current list as Excel (${filteredMedicines.length} items)`}
                    >
                        {/* Excel Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M18.921 6.925c-.32-.31-.733-.484-1.164-.537-.43-.053-.865.033-1.232.261l-3.377 1.935L12 8.41l-1.148.645-3.378-1.935c-.367-.228-.802-.314-1.232-.261-.431.053-.844.226-1.164.537L2.314 11.39c-.655.656-.863 1.587-.565 2.445.298.857.992 1.495 1.877 1.704l2.517.59c.206.048.414.072.621.072.637 0 1.266-.25 1.726-.73l2.776-2.882c.185-.19.49-.19.675 0l2.775 2.882c.46.48 1.089.73 1.726.73.207 0 .415-.024.621-.072l2.517-.59c.885-.209 1.579-.847 1.877-1.704.298-.858.09-1.789-.565-2.445l-3.377-3.378zM12 13.128l-2.25-2.34c-.185-.19-.49-.19-.675 0l-2.25 2.34c-.46.48-1.089.73-1.726.73-.207 0-.415-.024-.621-.072l-1.5-1.5.75-.75 2.625-2.626 1.125 1.125c.185.19.49.19.675 0l.75-.75.75-.75.75-.75.75-.75 1.125 1.125c.185.19.49.19.675 0l2.625-2.626.75.75-1.5 1.5c-.46.48-1.089.73-1.726.73-.207 0-.415-.024-.621-.072l-2.25-2.34zM6 13h-.01l-1.5-1.5.75-.75 1.5 1.5.75.75z"/>
                        </svg>

                        Download Excel ({filteredMedicines.length})
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-10">
                    <Spinner />
                    <p className={`ml-2 ${activeTheme.classes.filterText}`}>Loading Medicines...</p>
                </div>
            )}

            {/* Empty States */}
            {!loading && medicines.length === 0 && (
                <p className={`text-center ${activeTheme.classes.textMuted} mt-8`}>
                    No medicines found in the inventory yet.
                </p>
            )}
            {!loading && medicines.length > 0 && filteredMedicines.length === 0 && (
                <p className={`text-center ${activeTheme.classes.textMuted} mt-8`}>
                    No medicines found matching your search or filter criteria.
                </p>
            )}

            {/* Medicine Grid */}
            {!loading && filteredMedicines.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredMedicines.map((item) => (
                        // Make the entire card clickable
                        <div
                            key={item._id}
                            className={`group rounded-lg overflow-hidden shadow-md transition duration-300 ease-in-out hover:shadow-xl border flex flex-col cursor-pointer ${activeTheme.classes.cardBg} ${activeTheme.classes.cardBorder}`}
                            // Navigate to medicine details page on card click
                            onClick={() => navigate(`/medicine-details/${item._id}`)}
                        >
                            {/* Image Section (remains mostly the same) */}
                            <div className="relative w-full h-48 overflow-hidden">
                                {/* Use default image if imageUrl is missing or invalid */}
                                <img
                                    src={item.imageUrl || "/default-medicine.jpg"}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "/default-medicine.jpg"; }}
                                />
                                {/* Stock badge */}
                                <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded ${item.quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>

                            {/* Content Section */}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className={`text-lg font-semibold mb-1 truncate ${activeTheme.classes.cardTitleText}`} title={item.name}>
                                    {item.name}
                                </h3>
                                <p className={`text-sm mb-2 truncate ${activeTheme.classes.cardSecondaryText}`} title={item.manufacturer}>
                                    Mfr: {item.manufacturer}
                                </p>
                                <p className={`text-sm mb-1 ${activeTheme.classes.cardQtyText}`}>
                                    Price: <span className={`font-semibold text-lg ${activeTheme.classes.cardPriceText}`}>₹{item.discountedPrice !== undefined ? item.discountedPrice.toFixed(2) : 'N/A'}</span>
                                    {/* Show original price if different and available */}
                                    {item.originalPrice !== undefined && item.originalPrice !== item.discountedPrice && (
                                        <span className="ml-2 line-through text-red-400 text-xs">₹{item.originalPrice.toFixed(2)}</span>
                                    )}
                                </p>
                                <p className={`text-sm mb-3 ${activeTheme.classes.cardQtyText}`}>
                                    Available Qty: <span className="font-medium">{item.quantity !== undefined ? item.quantity : 'N/A'}</span>
                                </p>

                                {/* Buttons Section */}
                                <div className={`mt-auto pt-3 flex gap-2 justify-center border-t ${activeTheme.classes.headerBorder}`}>
                                    {/* Check Stock Button - Added e.stopPropagation() */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click
                                            checkStock(item._id);
                                        }}
                                        className={`px-3 py-1.5 text-sm text-white rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50 ${activeTheme.classes.buttonPrimaryBg} ${activeTheme.classes.buttonPrimaryHoverBg} ${activeTheme.classes.focusRing}`}
                                        aria-label={`Check stock for ${item.name}`}
                                    >
                                        Check Stock
                                    </button>

                                    {/* Delete Button (conditionally shown) - Added e.stopPropagation() */}
                                    {showDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                                deleteMedicine(item._id);
                                            }}
                                            className={`px-3 py-1.5 text-sm text-white rounded-md transition duration-150 ease-in-out flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${activeTheme.classes.buttonDangerBg} ${activeTheme.classes.buttonDangerHoverBg} ${activeTheme.classes.focusRing}`}
                                            aria-label={`Delete ${item.name}`}
                                        >
                                            <FaTrash size={12} /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MedicineList;