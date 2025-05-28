// src/pages/MyAppointments.jsx (or your file path)

import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../context/AppContext'; // Adjust path if needed
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// --- Placeholder Assets ---
// Replace with your actual asset import or path
const assets = {
    default_doctor_avatar: 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=Doctor'
};
// --- End Placeholder Assets ---

// --- Simple Inline Spinner Component ---
const InlineSpinner = ({ size = 'small', color = 'text-inherit' }) => {
    const sizeClasses = {
        small: 'w-4 h-4 border-2',
        medium: 'w-6 h-6 border-[3px]',
        large: 'w-8 h-8 border-4',
    };
    return <span className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent ${sizeClasses[size] || sizeClasses.small} ${color}`} role="status" aria-hidden="true"></span>;
};
// --- End Spinner Component ---

// --- Basic Modal Component (Can be moved to a separate file later) ---
const AppointmentDetailsModal = ({ appointment, onClose }) => {
    if (!appointment) return null; // Don't render if no appointment is selected

    // Assuming month helper is available or defined here
    const month = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const slotDataFormat = (slotDate) => {
        if (!slotDate || typeof slotDate !== 'string') return 'Invalid Date';
        const dateArray = slotDate.split('_');
        if (dateArray.length !== 3) return 'Invalid Date Format';
        const day = dateArray[0];
        const monthIndex = Number(dateArray[1]);
        const year = dateArray[2];
        if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) return 'Invalid Month';
        return `${day} ${month[monthIndex]} ${year}`;
    };


    return (
        <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4"
            onClick={onClose} // Close modal when clicking outside
        >
            <div
                className="relative bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl font-semibold"
                    aria-label="Close modal"
                >
                    ×
                </button>

                {/* Modal Title */}
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">Appointment Details</h2>

                {/* Doctor Info */}
                <div className="mb-4 pb-4 border-b">
                     <h3 className="text-lg font-semibold text-indigo-700 mb-2">Doctor: {appointment.docData?.name || 'N/A'}</h3>
                     <p className="text-gray-700 text-sm">Speciality: {appointment.docData?.speciality || 'N/A'}</p>
                     <p className="text-gray-700 text-sm">Clinic: {appointment.docData?.address?.line1 || 'N/A'}, {appointment.docData?.address?.city || 'N/A'}</p>
                     <p className="text-gray-700 text-sm">Fees: {appointment.docData?.fees ? `${appointment.docData?.currencySymbol || '₹'}${appointment.docData.fees}` : 'N/A'}</p>
                </div>

                {/* Appointment Info */}
                <div className="mb-4 pb-4 border-b">
                    <p className="text-gray-700 text-sm mb-1">Appointment ID: <span className="font-mono text-gray-600 text-xs">{appointment._id}</span></p>
                    <p className="text-gray-700 text-sm mb-1">Date: <span className="font-semibold text-indigo-600">{slotDataFormat(appointment.slotDate)}</span></p>
                    <p className="text-gray-700 text-sm mb-1">Time: <span className="font-semibold text-indigo-600">{appointment.slotTime || 'N/A'}</span></p>
                    <p className="text-gray-700 text-sm mb-1">Booked On: <span className="font-semibold">{new Date(appointment.createdAt).toLocaleString()}</span></p>
                    <p className="text-gray-700 text-sm mb-1">Status: <span className={`font-semibold ${appointment.isCompleted ? 'text-green-600' : appointment.cancelled ? 'text-gray-500' : appointment.payment ? 'text-blue-600' : 'text-yellow-600'}`}>
                         {appointment.isCompleted ? 'Completed' : appointment.cancelled ? 'Cancelled' : appointment.payment ? 'Paid/Confirmed' : 'Pending Payment'}
                    </span></p>
                </div>

                {/* Payment Info */}
                 <div className="mb-4 pb-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Status: <span className={`font-bold ${appointment.payment ? 'text-green-600' : 'text-red-600'}`}>{appointment.payment ? 'Paid' : 'Unpaid'}</span></h3>
                     {appointment.payment && appointment.paymentDetails && (
                        <div className="text-sm text-gray-700 space-y-1">
                             <p>Payment ID: <span className="font-mono text-gray-600 text-xs">{appointment.paymentDetails.razorpay_payment_id || 'N/A'}</span></p>
                             <p>Order ID: <span className="font-mono text-gray-600 text-xs">{appointment.paymentDetails.razorpay_order_id || 'N/A'}</span></p>
                             {/* Add more payment details if available in paymentDetails */}
                        </div>
                     )}
                 </div>


                {/* Doctor's Report Section */}
                {/* IMPORTANT: You need to ensure your backend adds a field like `reportContent` and `reportDate` to the appointment object when the doctor adds a report. */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Doctor's Report</h3>
                    {appointment.reportContent ? (
                        <div className="bg-gray-100 p-4 rounded-md text-gray-800 text-sm leading-relaxed">
                            <p className="font-medium mb-2">Report Date: <span className="font-normal">{new Date(appointment.reportDate || appointment.updatedAt).toLocaleString()}</span></p> {/* Use reportDate if available, fallback to update date */}
                            <p>{appointment.reportContent}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm italic">No report has been added by the doctor for this appointment yet.</p>
                    )}
                </div>

                {/* Optional: Add action buttons here if needed within modal (e.g., "Contact Doctor") */}
                {/* <div className="text-right mt-6">
                    <button
                        onClick={onClose} // Example: You might navigate or trigger another action
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition font-medium"
                    >
                       OK
                    </button>
                </div> */}
            </div>
        </div>
    );
};

// --- Main MyAppointments Component ---
const MyAppointments = () => {
  // ---- State and Context ----
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]); // Store all fetched appointments
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Tracks which appointment action is in progress: { appointmentId: 'paying' | 'cancelling' | 'verifying' }
  const [processingAction, setProcessingAction] = useState({});
  const navigate = useNavigate();

  // --- State for Filtering ---
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Pending Payment', 'Paid/Confirmed', 'Completed', 'Cancelled'];

  // --- State for Modal ---
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);


  // Helper for month names (moved inside component or utility)
  const month = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ---- Helper Functions ----

  // Formats date string like 'DD_MM_YYYY' to 'DD Mon YYYY'
  const slotDataFormat = (slotDate) => {
    if (!slotDate || typeof slotDate !== 'string') return 'Invalid Date';
    const dateArray = slotDate.split('_');
    if (dateArray.length !== 3) return 'Invalid Date Format';
    const day = dateArray[0];
    const monthIndex = Number(dateArray[1]);
    const year = dateArray[2];
    if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) return 'Invalid Month';
    return `${day} ${month[monthIndex]} ${year}`;
  };

  // --- Modal Handlers ---
  const openDetailsModal = (appointment) => {
      setSelectedAppointment(appointment);
      setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
      setSelectedAppointment(null);
      setShowDetailsModal(false);
  };


  // ---- Core Logic Functions ----

  // Fetches user's appointments from the backend
  const getUserAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors on new fetch attempt
    try {
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setIsLoading(false);
        setAppointments([]); // Ensure list is empty if not logged in
        return;
      }

      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        // Assuming backend sends appointments roughly chronologically, reverse to show newest first
        // IMPORTANT: If backend sorting is reliable, use that instead of reverse()
        setAppointments(data.appointments.reverse() || []);
        setError(null); // Clear error on success
      } else {
        setAppointments([]);
        // Avoid showing error toast/message if it's just "no appointments found"
        if (data.message && !data.message.toLowerCase().includes("no appointments")) {
             toast.error(data.message);
             setError(data.message); // Set error state for display
        } else {
            setError(null); // Explicitly clear error if no appointments found
        }
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch appointments. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      setAppointments([]); // Clear appointments on error
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, token]); // Dependencies for useCallback

  // Cancels a specific appointment
  const cancelAppointment = async (appointmentId, event) => {
    // Prevent click from bubbling up to open modal if within a card
    if(event) event.stopPropagation();

    // Prevent duplicate actions if already processing
    if (processingAction[appointmentId]) return;

    if (!window.confirm("Are you sure you want to cancel this appointment? This action might be irreversible.")) {
        return;
    }

    setProcessingAction(prev => ({ ...prev, [appointmentId]: 'cancelling' }));
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId }, // Request body
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message || 'Appointment cancelled successfully.');
        await getUserAppointments(); // Refresh the list
        // Optional: Refresh doctor data if cancellation affects availability counts
        if (getDoctorsData) await getDoctorsData();
      } else {
        toast.error(data.message || 'Failed to cancel appointment.');
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      toast.error(err.response?.data?.message || 'An error occurred while cancelling.');
    } finally {
      // Always remove the processing state for this ID after the attempt
      setProcessingAction(prev => {
          const newState = { ...prev };
          delete newState[appointmentId];
          return newState;
      });
    }
  };

  // Initializes the Razorpay payment flow using order details from backend
  const initPay = useCallback((order, appointmentId) => {
    // Check if Razorpay script has loaded
    if (!window.Razorpay) {
      toast.error("Payment gateway script could not be loaded. Please refresh the page and try again.");
      setProcessingAction(prev => { // Clear processing state if Razorpay isn't available
          const newState = { ...prev };
          delete newState[appointmentId];
          return newState;
      });
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
        console.error("Razorpay Key ID is not configured in environment variables.");
        toast.error("Payment gateway is not configured correctly. Please contact support.");
        setProcessingAction(prev => { // Clear processing state
            const newState = { ...prev };
            delete newState[appointmentId];
            return newState;
        });
        return;
    }

    const options = {
      key: razorpayKey,
      amount: order.amount, // Amount in the smallest currency unit (e.g., paisa)
      currency: order.currency,
      name: 'WellNest Clinic Booking', // Replace with your app/clinic name
      description: `Payment for Appointment ID: ${appointmentId.slice(-6)}`, // Use short ID for description
      order_id: order.id, // This links the frontend payment to the backend order
      // ---- Handler function called on successful payment ----
      handler: async (response) => {
        // Indicate verification is happening
        setProcessingAction(prev => ({ ...prev, [appointmentId]: 'verifying' }));
        try {
          // Send payment details AND appointmentId to backend for verification
          const { data } = await axios.post(
            `${backendUrl}/api/user/verify-payment`,
            {
              razorpay_order_id: order.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: appointmentId // Crucial to link payment to appointment
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (data.success) {
            toast.success("Payment Successful!");
            await getUserAppointments(); // Refresh list to show 'Paid' status
          } else {
            // Backend verification failed (e.g., signature mismatch, amount mismatch)
            toast.error(data.message || "Payment Verification Failed! Please contact support if payment was deducted.");
          }
        } catch (error) {
          console.error("Payment Verification API Error:", error);
          toast.error("Error verifying payment. Please contact support if payment was deducted.");
        } finally {
           // Clear processing state after verification attempt (success or fail)
           setProcessingAction(prev => {
              const newState = { ...prev };
              delete newState[appointmentId];
              return newState;
           });
        }
      },
      // Optional: Pre-fill user details if available
      // prefill: { name: 'User Name', email: 'user@example.com', contact: '9999999999' },
      notes: {
          appointment_id: appointmentId // Can add notes visible in Razorpay dashboard
      },
      // ---- Handle modal close event (user clicks 'x' or outside) ----
      modal: {
         ondismiss: () => {
           // Only show info if the action was 'paying' (not already verifying/failed)
           if(processingAction[appointmentId] === 'paying') {
                toast.info("Payment window closed by user.");
           }
           // Clear processing state if user closes modal prematurely
           setProcessingAction(prev => {
              const newState = { ...prev };
              delete newState[appointmentId];
              return newState;
           });
         }
      },
      theme: {
        color: "#4f46e5", // Your brand color (indigo-600 equivalent)
      },
    };

    // ---- Initialize and Open Razorpay ----
    try {
      const rzp = new window.Razorpay(options);

      // Add listener for payment failure directly within Razorpay
      rzp.on('payment.failed', function (response){
            console.error('Razorpay Payment Failed:', response.error);
            toast.error(`Payment Failed: ${response.error.description || response.error.reason || 'Unknown Error'}`);
            // Clear processing state on definite failure
            setProcessingAction(prev => {
                const newState = { ...prev };
                delete newState[appointmentId];
                return newState;
            });
      });

      rzp.open(); // Open the Razorpay checkout modal

    } catch (e) {
        console.error("Razorpay initialization error:", e);
        toast.error("Could not initiate the payment gateway. Please try again or contact support.");
        // Clear processing state if Razorpay object creation fails
        setProcessingAction(prev => {
            const newState = { ...prev };
            delete newState[appointmentId];
            return newState;
        });
    }

  }, [backendUrl, token, getUserAppointments, processingAction]); // Dependencies for initPay useCallback

  // Initiates the payment process: calls backend to get Razorpay order_id first
  const handlePayment = async (appointmentId, event) => {
    // Prevent click from bubbling up to open modal if within a card
    if(event) event.stopPropagation();

    if (processingAction[appointmentId]) return; // Prevent multiple clicks

    setProcessingAction(prev => ({ ...prev, [appointmentId]: 'paying' }));
    try {
      // Call backend to create a Razorpay order linked to the appointment
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-razorpay`,
        { appointmentId }, // Request body
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.order) {
        // Backend successfully created order, now initialize Razorpay on frontend
        initPay(data.order, appointmentId);
        // Do NOT clear processing state here; initPay handlers will clear it later
      } else {
        // Backend failed to create order
        toast.error(data.message || "Payment initialization failed. Could not create payment order.");
         setProcessingAction(prev => { // Clear state if order creation fails
            const newState = { ...prev };
            delete newState[appointmentId];
            return newState;
        });
      }
    } catch (error) {
      console.error("Error initiating payment (API call):", error);
      toast.error(error.response?.data?.message || "Failed to start the payment process. Please try again.");
      setProcessingAction(prev => { // Clear state on API error
          const newState = { ...prev };
          delete newState[appointmentId];
          return newState;
      });
    }
  };

  // ---- Effects ----

  // Fetch appointments when component mounts or token changes
  useEffect(() => {
    if (token) {
      getUserAppointments();
    } else {
        // If no token, don't show loading; show login message immediately
        setIsLoading(false);
        setError('Please log in to view your appointments.');
        setAppointments([]); // Clear any stale data
    }
  }, [token, getUserAppointments]); // Effect dependencies

  // ---- Filtering Logic ----
  const filteredAppointments = appointments.filter(item => {
    switch (activeFilter) {
      case 'Pending Payment':
        return !item.payment && !item.cancelled && !item.isCompleted;
      case 'Paid/Confirmed':
        return item.payment && !item.cancelled && !item.isCompleted; // Assuming paid = confirmed
      case 'Completed':
        return item.isCompleted;
      case 'Cancelled':
        return item.cancelled;
      case 'All':
      default:
        return true; // Show all
    }
  });


  // ---- Rendering Logic ----

  // Renders the appropriate action buttons or status text based on appointment state
  const renderAppointmentActions = (item) => {
    const appointmentId = item._id;
    // Consider 'verifying' as part of the payment processing flow
    const isProcessingPay = processingAction[appointmentId] === 'paying' || processingAction[appointmentId] === 'verifying';
    const isProcessingCancel = processingAction[appointmentId] === 'cancelling';
    const isProcessing = isProcessingPay || isProcessingCancel; // Is any action happening for this item?

    // Order of checks matters: Completed > Cancelled > Paid > Pending Payment
    if (item.isCompleted) {
      return (
        <span className="py-2 px-4 border border-green-500 rounded-lg text-green-600 font-semibold bg-green-100 text-sm w-full md:w-auto text-center whitespace-nowrap">
          ✅ Completed
        </span>
      );
    }
    if (item.cancelled) {
      return (
        <span className="py-2 px-4 border border-gray-400 text-gray-500 rounded-lg bg-gray-100 text-sm w-full md:w-auto text-center whitespace-nowrap">
          Cancelled
        </span>
      );
    }
    // If payment is successful (item.payment is true)
    if (item.payment) {
      return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <span className="py-2 px-4 border border-blue-500 rounded-lg text-blue-600 font-semibold bg-blue-100 text-sm w-full md:w-auto text-center flex-grow sm:flex-grow-0 whitespace-nowrap">
             ✅ Paid
            </span>
             {/* Allow cancellation even after payment (business logic dependent) */}
             {/* Added event parameter to stop propagation */}
             <button
               onClick={(e) => cancelAppointment(appointmentId, e)}
               disabled={isProcessing} // Disable if paying or cancelling
               className={`bg-transparent text-red-500 border border-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-500 hover:text-white transition duration-200 w-full md:w-auto flex items-center justify-center group whitespace-nowrap ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
               aria-label={`Cancel appointment on ${slotDataFormat(item.slotDate)}`}
             >
                {isProcessingCancel ? <InlineSpinner size="small" color="text-red-500 group-hover:text-white" /> : 'Cancel'}
             </button>
          </div>
      );
    }
    // Default: Appointment is active but not paid (pending payment)
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
        {/* Pay Button - Added event parameter to stop propagation */}
        <button
          onClick={(e) => handlePayment(appointmentId, e)}
          disabled={isProcessing} // Disable if paying or cancelling
          className={`bg-indigo-600 text-white border border-indigo-600 px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition duration-200 w-full md:w-auto flex items-center justify-center whitespace-nowrap ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={`Pay for appointment on ${slotDataFormat(item.slotDate)}`}
        >
          {isProcessingPay ? <InlineSpinner size="small" color="text-white" /> : 'Pay Now'}
        </button>
        {/* Cancel Button - Added event parameter to stop propagation */}
        <button
          onClick={(e) => cancelAppointment(appointmentId, e)}
          disabled={isProcessing} // Disable if paying or cancelling
          className={`bg-transparent text-red-500 border border-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-500 hover:text-white transition duration-200 w-full md:w-auto flex items-center justify-center group whitespace-nowrap ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={`Cancel appointment on ${slotDataFormat(item.slotDate)}`}
        >
           {isProcessingCancel ? <InlineSpinner size="small" color="text-red-500 group-hover:text-white" /> : 'Cancel'}
        </button>
      </div>
    );
  };

  // ---- Main JSX Render ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center mb-10">My Appointments</h1>

        {/* === Filter Buttons === */}
        {!isLoading && !error && appointments.length > 0 && (
             <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
                {filters.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                           ${activeFilter === filter
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}
                        `}
                    >
                       {filter}
                    </button>
                ))}
             </div>
        )}


        {/* === Loading State === */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <InlineSpinner size="large" color="text-indigo-600" />
            <span className='ml-4 text-lg text-gray-600 mt-3'>Loading Your Appointments...</span>
          </div>
        )}

        {/* === Error State === */}
        {!isLoading && error && (
          <div className="text-center py-10 px-6 bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-sm max-w-lg mx-auto">
            <p className="font-medium text-lg">Oops! Something went wrong.</p>
            <p className="text-sm mt-1">{error}</p>
            {/* Provide login button if error is authentication-related */}
            {error && error.toLowerCase().includes("log in") &&
             <button
                onClick={() => navigate('/login')} // Adjust login route if needed
                className='mt-4 bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium'
            >
                Go to Login
            </button>}
          </div>
        )}

        {/* === No Appointments State (considering filters) === */}
        {!isLoading && !error && appointments.length > 0 && filteredAppointments.length === 0 && (
             <div className="text-center py-10 px-6 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg shadow-sm max-w-lg mx-auto">
               <p className="text-lg font-medium">No {activeFilter} Appointments Found</p>
               <p className="mt-1 text-sm">Try selecting a different filter or booking a new appointment.</p>
               <button
                   onClick={() => setActiveFilter('All')}
                   className='mt-4 bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600 transition text-sm font-medium mr-2'
               >
                   Show All Appointments
               </button>
                <button
                   onClick={() => navigate('/doctor')} // Adjust route to doctor listing/booking page
                   className='mt-4 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition font-medium'
               >
                   Book an Appointment
               </button>
             </div>
        )}

        {/* === No Appointments Found At All === */}
         {!isLoading && !error && appointments.length === 0 && (
          <div className="text-center py-10 px-6 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg shadow-sm max-w-lg mx-auto">
            <p className="text-lg font-medium">No Appointments Found</p>
            <p className="mt-1 text-sm">You currently have no appointments scheduled with us.</p>
            <button
                onClick={() => navigate('/doctor')} // Adjust route to doctor listing/booking page
                className='mt-5 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition font-medium'
            >
                Book an Appointment
            </button>
          </div>
        )}


        {/* === Appointments List === */}
        {!isLoading && !error && filteredAppointments.length > 0 && (
          <div className="space-y-6">
            {filteredAppointments.map((item) => (
              <div
                key={item._id} // Unique key for React list rendering
                className="bg-white shadow-lg rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-6 border border-gray-200 transition duration-300 hover:shadow-xl hover:border-indigo-300 cursor-pointer"
                onClick={() => openDetailsModal(item)} // Open modal on card click
              >
                {/* --- Doctor Image Column --- */}
                <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0">
                  <img
                    src={item.docData?.image || assets.default_doctor_avatar}
                    alt={item.docData?.name || 'Doctor'}
                    className="w-full h-full object-cover rounded-full border-4 border-indigo-100 shadow-md"
                    // Fallback if the primary image fails to load
                    onError={(e) => {
                        if (e.target.src !== assets.default_doctor_avatar) {
                             e.target.onerror = null; // prevents looping
                             e.target.src = assets.default_doctor_avatar;
                        }
                    }}
                  />
                </div>

                {/* --- Appointment Details Column --- */}
                <div className="flex-1 text-center md:text-left w-full">
                  {/* Doctor Info */}
                  <p className="text-xl font-semibold text-gray-800">{item.docData?.name || 'Doctor Name Unavailable'}</p>
                  <p className="text-sm text-indigo-600 font-medium mb-2">{item.docData?.speciality || 'Speciality Unavailable'}</p>

                  {/* Address Info (simplified for list view) */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                     <span className="font-medium text-gray-700">Clinic:</span>{' '}
                     {item.docData?.address?.line1 || 'N/A'}
                     {item.docData?.address?.city ? `, ${item.docData.address.city}` : ''}
                  </p>

                   {/* Date & Time */}
                  <div className='mt-2 space-y-1'>
                     <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-800">Date:</span>{' '}
                        <span className="font-semibold text-indigo-700">{slotDataFormat(item.slotDate)}</span>
                     </p>
                     <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-800">Time:</span>{' '}
                        <span className="font-semibold text-indigo-700">{item.slotTime || 'N/A'}</span>
                     </p>
                  </div>

                   {/* Fee Info */}
                   <p className="text-sm text-gray-700 mt-2">
                     <span className="font-medium text-gray-800">Fee:</span>{' '}
                     <span className="font-semibold">
                        {item.docData?.fees ? `${item.docData?.currencySymbol || '₹'}${item.docData.fees}` : 'N/A'}
                     </span>
                  </p>

                  {/* ---- Appointment Status (Quick Glance) ---- */}
                   <p className="text-sm text-gray-700 mt-3">
                     <span className="font-medium text-gray-800">Status:</span>{' '}
                      <span className={`font-semibold ${item.isCompleted ? 'text-green-600' : item.cancelled ? 'text-gray-500' : item.payment ? 'text-blue-600' : 'text-yellow-600'}`}>
                         {item.isCompleted ? 'Completed' : item.cancelled ? 'Cancelled' : item.payment ? 'Paid/Confirmed' : 'Pending Payment'}
                    </span>
                  </p>
                  {/* ---- End Status ---- */}

                </div>

                {/* --- Actions Column --- */}
                <div className="flex flex-col items-center sm:items-end gap-2 pt-4 md:pt-0 w-full md:w-auto flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-200 md:pl-6 mt-4 md:mt-0">
                    {/* Render actions, but ensure they don't trigger the modal click handler */}
                    <div onClick={e => e.stopPropagation()} className="flex flex-col items-center sm:items-end gap-2 w-full">
                         {renderAppointmentActions(item)}
                    </div>
                    {/* Add a dedicated button to view details if clicking the whole card isn't desired,
                        but clicking the card is common for this pattern. */}
                    {/* <button
                         onClick={(e) => { e.stopPropagation(); openDetailsModal(item); }}
                         className="mt-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition w-full md:w-auto"
                    >
                        View Details
                    </button> */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === Render the Modal === */}
        <AppointmentDetailsModal
           appointment={selectedAppointment}
           onClose={closeDetailsModal}
        />

      </div>
    </div>
  );
};

export default MyAppointments;