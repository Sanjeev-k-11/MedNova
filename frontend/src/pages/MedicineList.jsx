import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShoppingBag, Loader2, PlusCircle, MinusCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const MedicineList = () => {
    const [filterMeds, setFilterMeds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState('All');
    const [buyCart, setBuyCart] = useState([]);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const navigate = useNavigate();
    const { medicines, token, setMedicines, backendUrl } = useContext(AppContext);
    const { currentTheme } = useTheme(); // Get the current theme

    const applyFilter = useCallback(() => {
        setInitialLoading(true);
        let sourceMedicines = Array.isArray(medicines) ? medicines : [];
        let filteredMedicines = sourceMedicines;

        if (searchQuery) {
            filteredMedicines = filteredMedicines.filter((med) =>
                med.name && med.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (stockFilter === 'In Stock') {
            filteredMedicines = filteredMedicines.filter((med) => med.quantity > 0);
        } else if (stockFilter === 'Out of Stock') {
            filteredMedicines = filteredMedicines.filter((med) => med.quantity === 0);
        }

        setFilterMeds(filteredMedicines);
        setTimeout(() => setInitialLoading(false), 100);
    }, [medicines, searchQuery, stockFilter]);

    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

     useEffect(() => {
        if (medicines !== null) {
            setInitialLoading(false);
        } else {
            setInitialLoading(true);
        }
    }, [medicines]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [filterMeds]);

    const addToCart = (medicineToAdd) => {
         const currentMedicineState = medicines?.find(m => m._id === medicineToAdd._id);
         const availableStock = currentMedicineState?.quantity ?? 0;

        if (availableStock <= 0) {
            toast.warn(`${medicineToAdd.name} is currently out of stock.`);
            return;
        }

        const existingItem = buyCart.find((item) => item._id === medicineToAdd._id);

        if (existingItem) {
             if (existingItem.quantity >= availableStock) {
                 toast.warn(`Cannot add more ${medicineToAdd.name}. Only ${availableStock} available in stock.`);
                 return;
             }
            setBuyCart(
                buyCart.map((item) =>
                    item._id === medicineToAdd._id ? { ...item, quantity: item.quantity + 1 } : item
                )
            );
        } else {
            setBuyCart([...buyCart, { ...medicineToAdd, quantity: 1, stockQuantity: availableStock }]);
        }
    };

    const removeFromCart = (medicineToRemove) => {
        const existingItem = buyCart.find((item) => item._id === medicineToRemove._id);
        if (!existingItem) return;

        if (existingItem.quantity === 1) {
            setBuyCart(buyCart.filter((item) => item._id !== medicineToRemove._id));
        } else {
            setBuyCart(
                buyCart.map((item) =>
                    item._id === medicineToRemove._id ? { ...item, quantity: item.quantity - 1 } : item
                )
            );
        }
    };

    const handlePay = async () => {
        if (buyCart.length === 0) {
            toast.info("Your cart is empty.");
            return;
        }
        if (isProcessingPayment) return;

        setIsProcessingPayment(true);

        try {
            const cartPayload = buyCart.map(item => ({
                _id: item._id,
                quantity: item.quantity,
                discountedPrice: item.discountedPrice,
                name: item.name
            }));

            const { data } = await axios.post(
                `${backendUrl}/api/medicine/payments-razorpay`,
                { buyCart: cartPayload },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success && data.order && data.order.id) {
                initPay(data.order, cartPayload);
            } else {
                toast.error(data.message || 'Payment initialization failed.');
                setIsProcessingPayment(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start payment process.');
            setIsProcessingPayment(false);
        }
    };

    const initPay = (order, cartDataForVerification) => {
         if (!window.Razorpay) {
            toast.error("Razorpay SDK could not be loaded. Please refresh the page or check your connection.");
            setIsProcessingPayment(false);
            return;
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'PharmaConnect',
            description: 'Medicine Purchase',
            order_id: order.id,
            handler: async (response) => {
                setIsProcessingPayment(true);
                try {
                    const verificationPayload = {
                        razorpay_order_id: order.id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        buyCart: cartDataForVerification,
                    };

                    const { data } = await axios.post(
                        `${backendUrl}/api/medicine/verifys-payment`,
                        verificationPayload,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (data.success) {
                        toast.success('Payment Successful! Purchase recorded.');
                        setBuyCart([]);
                        navigate('/my-medicines');
                    } else {
                        toast.error(data.message || 'Payment Verification Failed!');
                    }
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Error verifying payment.');
                } finally {
                     setIsProcessingPayment(false);
                }
            },
            modal: {
                ondismiss: function() {
                    toast.info("Payment process was canceled.");
                    setIsProcessingPayment(false);
                }
            },
            theme: {
                color: '#3b82f6',
            },
        };

        try {
            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response) {
                toast.error(`Payment Failed: ${response.error.description || response.error.reason || 'Unknown Error'}`);
                setIsProcessingPayment(false);
            });

            rzp.open();

        } catch (error) {
             toast.error("Could not initiate payment window. Please try again.");
             setIsProcessingPayment(false);
        }
    };

    if (!token) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4"
                style={{ color: currentTheme.textColor }} // Apply theme text color
            >
                 <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                 <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
                 <p className="mb-6 opacity-80">Please log in to view and purchase medicines.</p>
                 <button
                     className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center"
                     onClick={() => navigate('/login')}
                     aria-label="Go to Login Page"
                 >
                     Go to Login
                 </button>
             </div>
        );
    }

    const totalPrice = buyCart.reduce((total, item) => {
        const price = Number(item.discountedPrice) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
    }, 0);

    return (
        <div
            className="container mx-auto p-4 pb-40 min-h-screen"
            style={{ color: currentTheme.textColor }} // Apply base theme text color
        >
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Available Medicines</h1>
                <button
                    onClick={() => navigate('/my-medicines')}
                    className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                    aria-label="View My Purchased Medicines"
                >
                    <ShoppingBag className="w-5 h-5 mr-2" /> My Purchases
                </button>
            </div>

            <div className="mb-6 bg-white p-4 rounded-lg shadow-md sticky top-[calc(1rem+var(--navbar-height,64px))] z-10"> {/* Adjust top offset */}
                 <input
                    type="text"
                    placeholder="Search by medicine name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-3 border border-gray-300 rounded-md w-full mb-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800" // Explicit text color for input
                    aria-label="Search Medicines"
                 />
                 <div className="flex flex-wrap items-center gap-3">
                     <span className="font-medium self-center text-sm opacity-90">Filter by:</span> {/* Inherits color, adjusted opacity */}
                     {['All', 'In Stock', 'Out of Stock'].map((status) => (
                         <button
                             key={status}
                             className={`px-4 py-1.5 border rounded-full text-sm font-medium transition-colors duration-200 ${
                                 stockFilter === status
                                     ? 'bg-blue-500 text-white border-blue-500 shadow-sm' // Keep specific active style
                                     : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700' // Specific inactive style
                             }`}
                             onClick={() => setStockFilter(status)}
                             aria-pressed={stockFilter === status}
                         >
                             {status}
                         </button>
                     ))}
                 </div>
            </div>

            {initialLoading ? (
                 <div className="flex justify-center items-center min-h-[40vh]">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                 </div>
             ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                     {filterMeds.length > 0 ? (
                         filterMeds.map((item) => {
                            const isOutOfStock = item.quantity <= 0;
                            return (
                                <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white flex flex-col justify-between transition-shadow hover:shadow-lg text-gray-800"> {/* Card text black for contrast */}
                                    <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={item.imageUrl || '/default-medicine.jpg'}
                                            alt={item.name}
                                            className="max-h-full w-auto object-contain p-2"
                                            onError={(e) => { e.target.onerror = null; e.target.src = '/default-medicine.jpg'; }}
                                        />
                                     </div>
                                     <div className="p-4 flex-grow flex flex-col">
                                         <h2 className="font-semibold text-base mb-1 flex-grow" title={item.name}>{item.name}</h2>
                                         <p className="text-xs text-gray-500 mb-1">By: {item.manufacturer || 'N/A'}</p>
                                         <p className="text-lg font-bold text-blue-600 mb-1">₹{item.discountedPrice?.toFixed(2) || 'N/A'}</p>
                                         <p className={`text-sm font-medium mb-3 ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                             {isOutOfStock ? 'Out of Stock' : `In Stock (${item.quantity})`}
                                         </p>
                                         <button
                                             onClick={() => addToCart(item)}
                                             className={`w-full mt-auto px-4 py-2 rounded-md text-white font-semibold transition-colors duration-200 text-sm flex items-center justify-center ${
                                                 isOutOfStock
                                                     ? 'bg-gray-400 cursor-not-allowed'
                                                     : 'bg-blue-500 hover:bg-blue-600'
                                             }`}
                                             disabled={isOutOfStock}
                                             aria-label={isOutOfStock ? `${item.name} - Out of Stock` : `Add ${item.name} to cart`}
                                         >
                                             {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                         </button>
                                     </div>
                                </div>
                             );
                        })
                    ) : (
                        <p className="col-span-full text-center py-10 text-lg opacity-75"> {/* Inherits theme color */}
                             No medicines found matching your criteria.
                        </p>
                    )}
                 </div>
            )}


            {buyCart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t-2 border-blue-500 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] z-50 text-gray-800"> {/* Cart text black for contrast */}
                  <div className="container mx-auto">
                     <h2 className="text-lg sm:text-xl font-semibold mb-3">Shopping Cart ({buyCart.reduce((sum, item) => sum + item.quantity, 0)} items)</h2>
                     <div className="max-h-32 sm:max-h-40 overflow-y-auto mb-3 pr-2">
                         {buyCart.map((item) => (
                             <div key={item._id} className="mb-2 flex justify-between items-center text-sm border-b pb-1 gap-2">
                                 <div className="flex-1 mr-1 min-w-0">
                                     <p className="font-medium truncate" title={item.name}>{item.name}</p>
                                     <p className="text-gray-500">₹{item.discountedPrice?.toFixed(2)}</p>
                                 </div>
                                 <div className="flex items-center flex-shrink-0">
                                     <button
                                       onClick={() => removeFromCart(item)}
                                       className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                       aria-label={`Decrease quantity of ${item.name}`}
                                     >
                                       <MinusCircle className="w-5 h-5" />
                                     </button>
                                     <span className="mx-2 w-6 text-center font-semibold">{item.quantity}</span>
                                     <button
                                       onClick={() => addToCart(item)}
                                       className="text-green-500 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                       disabled={item.quantity >= item.stockQuantity}
                                       aria-label={`Increase quantity of ${item.name}`}
                                       title={item.quantity >= item.stockQuantity ? 'Max stock reached' : ''}
                                     >
                                       <PlusCircle className="w-5 h-5" />
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>

                     <div className="flex flex-col sm:flex-row justify-between items-center border-t mt-3 pt-3 gap-3">
                         <div className="text-base sm:text-lg font-bold order-2 sm:order-1">
                             Total: <span className="text-blue-600">₹{totalPrice.toFixed(2)}</span>
                         </div>
                         <button
                             onClick={handlePay}
                             className={`w-full sm:w-auto bg-gradient-to-r from-green-500 to-teal-600 text-white px-8 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center order-1 sm:order-2 ${isProcessingPayment ? 'opacity-70 cursor-wait' : ''}`}
                             disabled={isProcessingPayment}
                             aria-label="Proceed to Payment"
                         >
                             {isProcessingPayment ? (
                                 <>
                                     <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                                 </>
                             ) : (
                                 'Proceed to Pay'
                             )}
                         </button>
                     </div>
                   </div>
                 </div>
            )}
        </div>
    );
};

export default MedicineList;