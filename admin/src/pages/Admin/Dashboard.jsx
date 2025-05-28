// src/pages/Admin/Dashboard.jsx

import React, { useContext, useEffect, useState, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { AdminContext } from "../../context/AdminContext";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { Send, XCircle, Loader2, ShoppingCart, ListChecks, User, Phone, MessageSquare, CheckCircle } from "lucide-react"; // Added CheckCircle

// >>>>>>>>>>>>>>>> WARNING: INSECURE API KEY HANDLING <<<<<<<<<<<<<<<<<<<
// ... (rest of the AI key warning and functions remain the same) ...
const apiKeys = ["YOUR_GEMINI_API_KEY_1", "YOUR_GEMINI_API_KEY_2"]; // Replace with your actual keys
let currentKeyIndex = 0;
const getApiKey = () => apiKeys[currentKeyIndex];
// >>>>>>>>>>>>>>>>>>>>>>>> END WARNING <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


const Dashboard = () => {
  // --- State ---
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Refs ---
  const aiModalRef = useRef(null);
  const aiButtonRef = useRef(null);

  // --- Contexts ---
  const {
    token,
    getDashData,
    cancelAppointment,
    dashData,
    purchases,
    getAllPurchases
  } = useContext(AdminContext);
  const { slotDataFormat } = useContext(AppContext);

  // --- Effects ---

  // Fetch initial data
  useEffect(() => {
    if (token) {
      getDashData(); // Assuming getDashData fetches the latest appointments with their status
      getAllPurchases();
    }
  }, [token]); // Added dependencies

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close AI modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isModalOpen &&
          aiModalRef.current && !aiModalRef.current.contains(event.target) &&
          aiButtonRef.current && !aiButtonRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  // --- AI Handlers (DIRECT GEMINI API CALL - INSECURE) ---
  // ... (handleAskAI, handleAiKeyDown, clearAIChat functions remain the same) ...
   const handleAskAI = async () => {
    if (!aiQuery.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiResponse("");

    const modelName = "gemini-pro"; // Or "gemini-1.5-flash" etc.

    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = getApiKey();
       // Make sure you are using the correct v1beta endpoint or v1 if applicable
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: aiQuery }] }],
             // Consider adding safetySettings if needed:
             /*
            safetySettings: [
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                // Add other categories as needed
            ],
            */
          }),
        });

        if (!res.ok) {
           let errorDetails = `HTTP error! Status: ${res.status}`;
           try {
               const errorData = await res.json();
               errorDetails = errorData?.error?.message || JSON.stringify(errorData) || errorDetails;
               console.error(`AI API Error (Key Index ${currentKeyIndex}, Status ${res.status}):`, errorData || "No error body");
           } catch (parseError) {
               console.error(`AI API Error (Key Index ${currentKeyIndex}, Status ${res.status}): Failed to parse error response. Body:`, await res.text());
           }
           currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
           continue; // Try next key
        }

        const data = await res.json();

        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const generatedText = data.candidates[0].content.parts[0].text;
          setAiResponse(generatedText);
          setIsAiLoading(false);
          setAiQuery(""); // Clear input on success
          return; // Exit function on success
        } else {
          console.warn(`AI API Warning (Key Index ${currentKeyIndex}): Unexpected response structure`, data);
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
          continue; // Try next key
        }

      } catch (error) {
        console.error(`🚨 AI Fetch/Processing Error (Key Index ${currentKeyIndex}):`, error);
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        // Continue loop to try the next key
      }
    } // End of for loop

    // If loop finishes, all keys failed
    setAiResponse("❌ Error: AI service unavailable. Please ensure API keys are valid and quotas aren't exceeded.");
    setIsAiLoading(false);
  };

  // Handle Enter key press
  const handleAiKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  // Clear AI chat
  const clearAIChat = () => {
    setAiQuery("");
    setAiResponse("");
    setIsAiLoading(false);
  };


  // --- Render Logic ---

  // Loading state for the whole dashboard
  if (!dashData) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="animate-spin mr-3 h-6 w-6 text-gray-500" />
        <span className="text-gray-600">Loading Dashboard Data...</span>
      </div>
    );
  }

  // Prepare stats array dynamically
   const stats = [
    { label: "Doctors", value: dashData.doctors ?? 0, icon: assets.doctor_icon },
    { label: "Appointments", value: dashData.appointments ?? 0, icon: assets.appointments_icon },
    { label: "Patients", value: dashData.patients ?? 0, icon: assets.patients_icon },
   ];
   if (dashData.hasOwnProperty('purchasesCount')) {
       stats.push({
           label: "Purchases", value: dashData.purchasesCount ?? 0,
           icon: assets.purchase_icon || <ShoppingCart className="w-full h-full text-purple-600 p-1" />
       });
   }
   if (dashData.hasOwnProperty('medicineCount')) {
       stats.push({
           label: "Medicines", value: dashData.medicineCount ?? 0,
           // Providing a default SVG icon if assets.medicine_icon is missing
           icon: assets.medicine_icon || <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-green-600 p-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
       });
   }

  // Helper to format date/time safely
  const safeFormatDateTime = (dateInput) => {
      if (!dateInput) return 'N/A';
      try {
          const dateObj = new Date(dateInput);
          return isNaN(dateObj.getTime()) ? 'Invalid Date' : dateObj.toLocaleString();
      } catch (e) {
          console.error("Date formatting error:", dateInput, e);
          return 'Invalid Date';
      }
  };

  // --- Main Return JSX ---
  return (
    <div className="w-full space-y-8 md:space-y-10">

      {/* Section 1: Dashboard Stats */}
      <section aria-labelledby="stats-heading">
        {/* ... (Stats rendering remains the same) ... */}
         <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {stats.map((item, index) => (
            <div key={item.label || index} className="flex items-center gap-3 shadow-md bg-white p-4 rounded-lg border border-gray-200/80 hover:shadow-lg transition-shadow duration-200 ease-in-out">
              <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden p-1">
                {typeof item.icon === 'string' ? (
                  <img src={item.icon} alt="" className="w-full h-full object-contain" /> // Alt "" is acceptable for decorative icons
                ) : (
                  item.icon // Render React component icon
                )}
              </div>
              <div>
                <p className="text-lg md:text-xl font-semibold text-gray-800">{item.value}</p>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Latest Bookings + Calendar/Clock */}
      <section className="flex flex-col lg:flex-row gap-6 md:gap-8" aria-labelledby="bookings-calendar-heading">
         <h2 id="bookings-calendar-heading" className="sr-only">Latest Bookings and Calendar</h2>
        {/* Latest Bookings Panel */}
        <div className="bg-white w-full lg:flex-1 shadow-lg rounded-lg border border-gray-100/80 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200/80 flex-shrink-0">
                <img src={assets.list_icon} alt="" className="w-5 h-5"/>
                <h3 className="font-semibold text-base text-gray-800">Latest Bookings</h3>
            </div>
            <div className="py-1 flex-grow overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {dashData.latestAppointments && dashData.latestAppointments.length > 0 ? (
                    dashData.latestAppointments.map((item) => (
                        <div key={item?._id} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/80 transition-colors duration-150">
                            {/* ... (Image, Name, Date, Phone) ... */}
                            <img
                                src={item?.docData?.image || assets.profile_icon}
                                alt={item?.docData?.name ? `${item.docData.name}'s profile` : 'Doctor profile'}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-gray-200"
                                onError={(e) => { e.currentTarget.src = assets.profile_icon; }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate" title={item?.docData?.name ?? ''}>{item?.docData?.name ?? 'N/A'}</p>
                                <p className="text-gray-600 text-xs">{item?.slotDate ? slotDataFormat(item.slotDate) : 'N/A'} | <span className='font-medium text-indigo-600'>{item?.slotTime ?? 'N/A'}</span></p> {/* Added time */}
                            </div>
                            <div className="text-right flex-shrink-0 sm:mx-2">
                                <p className="font-medium text-sm hidden sm:block">{item?.docData?.phone ?? 'N/A'}</p>
                                <a href={`tel:${item?.docData?.phone}`} className="text-blue-600 hover:text-blue-800 sm:hidden" title="Call Doctor">
                                    <Phone size={18} />
                                </a>
                            </div>

                            {/* ****** START: Modified Status/Action Logic ****** */}
                            <div className="flex-shrink-0 w-[80px] text-center"> {/* Added fixed width and centering */}
                                {item?.cancelled ? (
                                    <span className="inline-block text-red-600 font-semibold text-xs px-2 py-1 rounded bg-red-100/80">Cancelled</span>
                                ) : item?.isCompleted ? ( // Check if completed (assuming boolean 'isCompleted' field)
                                    <span className="inline-flex items-center gap-1 text-green-700 font-semibold text-xs px-2 py-1 rounded bg-green-100/80">
                                        <CheckCircle size={14} /> Completed
                                    </span>
                                ) : ( // Otherwise, show cancel button
                                    <button
                                        onClick={() => {
                                             if (window.confirm(`Are you sure you want to cancel the appointment for ${item?.docData?.name ?? 'this doctor'} on ${slotDataFormat(item.slotDate)}?`)) {
                                                 item?._id && cancelAppointment(item._id);
                                             }
                                        }}
                                        className="p-1.5 rounded-full hover:bg-red-100 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title="Cancel Appointment"
                                        aria-label={`Cancel appointment with ${item?.docData?.name ?? 'doctor'}`}
                                        disabled={!item?._id} // Keep disabled if no ID
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            {/* ****** END: Modified Status/Action Logic ****** */}

                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 p-6">No recent bookings found.</p>
                )}
            </div>
        </div>

        {/* Calendar & Clock Panel */}
        {/* ... (Calendar/Clock rendering remains the same) ... */}
        <div className="bg-white w-full lg:w-[360px] flex-shrink-0 shadow-lg p-5 rounded-lg border border-gray-100/90">
            <div className="flex flex-col items-center mb-4 pb-3 border-b border-gray-200/80">
                <p className="text-base font-semibold text-gray-700">Current Time</p>
                <p className="text-2xl font-bold text-blue-600 tracking-tight">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> {/* Format time */}
            </div>
            <p className="text-base font-semibold mb-2 text-center text-gray-700">Calendar</p>
            <div className="flex justify-center">
                 {/* Added basic styling via props - you might need more specific CSS */}
                <Calendar
                    onChange={setDate}
                    value={date}
                    className="dashboard-calendar border rounded-lg overflow-hidden shadow-sm bg-white"
                    tileClassName={({ date, view }) => view === 'month' && date.getDay() % 2 ? 'bg-gray-50/50 rounded' : 'rounded'} // Example tile styling
                    navigationLabel={({ date }) => `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`}
                />
            </div>
            <p className="text-gray-500 text-xs mt-3 text-center">Selected: {date.toLocaleDateString()}</p>
        </div>
      </section>

      {/* Section 3: All Purchases Table */}
      {/* ... (Purchases table rendering remains the same) ... */}
       <section aria-labelledby="purchases-heading">
        <div className="bg-white w-full shadow-lg rounded-lg border border-gray-100/80 p-4 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2.5 mb-3 border-b border-gray-200/80 pb-2 flex-shrink-0">
            <ListChecks className="w-5 h-5 text-indigo-600" />
            <h3 id="purchases-heading" className="font-semibold text-base text-gray-800">All User Purchases</h3>
          </div>
          <div className="flex-grow overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            {purchases === null ? (
              <div className="flex justify-center items-center py-10 text-gray-500">
                <Loader2 className="animate-spin mr-3 h-5 w-5 text-indigo-500" />
                Loading Purchases...
              </div>
            ) : purchases.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No purchases found.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200/80 text-sm">
                <thead className="bg-gray-100/80 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium text-gray-600 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium text-gray-600 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium text-gray-600 uppercase tracking-wider">Items</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium text-gray-600 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-4 py-2.5 text-center font-medium text-gray-600 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium text-gray-600 uppercase tracking-wider">Payment ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200/80">
                  {purchases.map((purchase) => (
                    <tr key={purchase?._id} className="hover:bg-gray-50/80 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {safeFormatDateTime(purchase?.dateOfPurchase || purchase?.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-800">
                            <User size={14} className="text-gray-400 flex-shrink-0"/>
                            <span className="truncate" title={purchase?.userId?.name || purchase?.userName || ''}>
                              {purchase?.userId?.name || purchase?.userName || 'N/A'}
                            </span>
                        </div>
                         <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <Phone size={12} className="text-gray-400 flex-shrink-0"/>
                            <span className="truncate" title={purchase?.userId?.phoneNumber || purchase?.phoneNumber || ''}>
                              {purchase?.userId?.phoneNumber || purchase?.phoneNumber || 'N/A'}
                            </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {Array.isArray(purchase?.medicines) && purchase.medicines.length > 0 ? (
                           <ul className="list-disc list-inside text-xs space-y-0.5 max-w-[200px]"> {/* Max width for items */}
                              {purchase.medicines.slice(0, 2).map((item) => (
                                  <li key={item?._id || item?.medicineId?._id || Math.random()} className="truncate" title={`${item?.quantity ?? '?'} x ${item?.medicineId?.name || item?.name || 'Unknown Medicine'}`}>
                                      {item?.quantity ?? '?'} x {item?.medicineId?.name || item?.name || 'Unknown Medicine'}
                                      {item?.status && item.status !== 'Paid' && (
                                          <span className={`ml-1 text-[10px] font-semibold ${item.status === 'Canceled' ? 'text-red-500' : 'text-yellow-600'}`}>
                                              ({item.status})
                                          </span>
                                      )}
                                  </li>
                              ))}
                              {purchase.medicines.length > 2 && (
                                  <li className="text-gray-400 text-[10px] italic">
                                      ...and {purchase.medicines.length - 2} more
                                  </li>
                              )}
                           </ul>
                        ) : (
                           <span className="text-xs text-gray-400 italic">No item data</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-gray-800">
                        ₹{typeof purchase?.totalAmount === 'number' ? purchase.totalAmount.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                         <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              purchase?.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                              purchase?.paymentStatus === 'Canceled' ? 'bg-red-100 text-red-800' :
                              purchase?.paymentStatus === 'Partially Canceled' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                              {purchase?.paymentStatus || 'Pending'}
                          </span>
                      </td>
                       <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs truncate max-w-[100px]" title={purchase?.razorpayPaymentId ?? ''}>
                          {purchase?.razorpayPaymentId || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>


      {/* Section 4: AI Chat Button & Modal */}
      {/* ... (AI Button and Modal rendering remains the same) ... */}
       <button
        ref={aiButtonRef} // Attach ref
        id="aiButton" // Keep ID if used elsewhere
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all flex items-center gap-2 z-50"
        onClick={() => setIsModalOpen(!isModalOpen)}
        aria-label="Ask AI Assistant"
        aria-haspopup="dialog" // Indicate it opens a dialog
        aria-expanded={isModalOpen} // Indicate if the dialog is open
      >
        <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
        <span className="hidden sm:inline text-sm font-medium">Ask AI</span>
      </button>

      {isModalOpen && (
        <div
          ref={aiModalRef} // Attach ref
          id="aiModal" // Keep ID if used elsewhere
          className="fixed bottom-20 right-6 md:bottom-24 md:right-8 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-4 rounded-lg shadow-xl w-[320px] md:w-80 border border-gray-200 dark:border-gray-700 z-[60]"
          role="dialog" aria-modal="true" aria-labelledby="ai-modal-title"
        >
          <h2 id="ai-modal-title" className="sr-only">AI Assistant Chat</h2>
          <div className="mb-3 h-48 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-600">
            {isAiLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 size={24} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500 dark:text-gray-400">Thinking...</span>
              </div>
            ) : aiResponse ? (
              <p className="whitespace-pre-wrap">{aiResponse}</p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic text-center mt-4">Ask a medical or health-related question.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white p-2 flex-grow rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-70"
              placeholder="Type your question..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={handleAiKeyDown}
              disabled={isAiLoading}
              aria-label="AI Query Input"
            />
            <button
                onClick={clearAIChat}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                title="Clear Chat" aria-label="Clear Chat"
                disabled={isAiLoading || (!aiQuery && !aiResponse)}
            >
              <XCircle size={20} />
            </button>
            <button
                className="bg-blue-500 p-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0" // Added shrink-0
                onClick={handleAskAI}
                disabled={isAiLoading || !aiQuery.trim()}
                title="Send Query" aria-label="Send Query"
            >
              {isAiLoading ? <Loader2 size={20} className="text-white animate-spin" /> : <Send size={20} className="text-white" />}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;