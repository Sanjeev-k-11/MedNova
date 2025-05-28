// src/pages/DoctorDashboard.jsx

import React, { useContext, useEffect, useState, Fragment } from 'react'; // Added Fragment for Headless UI
import axios from 'axios'; // Import axios
import { DoctorContext } from '../../context/doctorContext'; // Adjust path if needed
import { assets } from '../../assets/assets'; // Assuming assets exist
import { AppContext } from '../../context/AppContext';
import { Send, XCircle, Loader2, BrainCircuit } from "lucide-react";
import { toast } from 'react-toastify'; // Import toast

// If using Headless UI for modals
import { Dialog, Transition } from '@headlessui/react';


// Assuming apiKeys is defined somewhere (or should be passed via context/config)
// Replace with your actual API keys
const apiKeys = [
  "YOUR_AI_API_KEY_1",
  "YOUR_AI_API_KEY_2",
  "YOUR_AI_API_KEY_3",
];
let currentKeyIndex = 0;
const getApiKey = () => apiKeys[currentKeyIndex];


const AIChat = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAskAI = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setResponse("");

    const maxRetries = apiKeys.length; // Try each key once
    for (let i = 0; i < maxRetries; i++) {
      try {
        const apiKey = getApiKey();
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{
                text: `You are a highly specialized AI medical assistant. Only provide responses related to medical topics,hospital,health related issue, Medicine **medicine usage and effects**,health, medicine, doctor, disease, symptoms, treatment,
  hospital, surgery, pharmacy, diagnosis, therapy, vaccine,MedNova,mednovan,Mednova
  infection, COVID, cancer, flu, diabetes, blood pressure, healthcare, or doctor-related questions. If the user's question is not related to medicine or the doctor sector, respond with: "⚠️ Invalid query. Please ask only medical-related questions." \n\nUser Question: ${query}`
              }]
            }],
            safetySettings: [ // Optional: Add safety settings
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
             generationConfig: { // Optional: Configure generation
                 temperature: 0.8,
                 topK: 40,
                 topP: 1,
                 maxOutputTokens: 1000,
             },
          }),
        });

        const data = await res.json();

        // Check for errors indicated by the API first
        if (data?.error) {
           console.error(`AI API Error (Key ${currentKeyIndex + 1}/${apiKeys.length}):`, data.error);
           currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length; // Try next key
           continue; // Go to the next iteration to try the next key
        }
        // Check for candidates (successful response)
        if (data?.candidates?.length > 0) {
          setResponse(data.candidates[0].content.parts[0].text);
          setIsLoading(false);
          setQuery(""); // Clear query on success
          return; // Exit the function on success
        } else {
          console.warn(`AI API Response format unexpected (Key ${currentKeyIndex + 1}/${apiKeys.length}):`, data);
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length; // Try next key
           // Do not continue; loop will handle trying the next key
        }

      } catch (error) {
        console.error(`🚨 AI API Fetch Error (Key ${currentKeyIndex + 1}/${apiKeys.length}):`, error);
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length; // Try next key
         // Do not continue; loop will handle trying the next key
      }
    }

    // If loop finishes without successful response
    setResponse("❌ Error: AI service is currently unavailable or all API keys failed. Please try again later.");
    setIsLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setResponse("");
    setIsLoading(false);
  };

  // Using Headless UI Dialog handles most of this, but keeping basic check
  // for non-modal scenarios or belt-and-suspenders
  useEffect(() => {
    const handleClickOutside = (event) => {
      const modalElement = document.getElementById('aiModal');
      const buttonElement = document.getElementById('aiButton');

      // Check if the click is outside the modal AND outside the button
      if (isModalOpen && modalElement && buttonElement && !modalElement.contains(event.target) && !buttonElement.contains(event.target)) {
        setIsModalOpen(false);
      }
    };

    // Add event listener only when modal is open
    if (isModalOpen) {
        // Using 'mousedown' is often better for avoiding conflicts with focus/click events
        document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
        // Clean up event listener
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);


  return (
    <>
      <button
        id="aiButton" // Keep ID for potential external click logic
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 z-50"
        onClick={() => setIsModalOpen(!isModalOpen)}
        aria-label="Ask AI Assistant"
        title="Ask AI Assistant"
      >
        <BrainCircuit size={24} />
      </button>

      {/* Use Transition and Dialog from Headless UI for better modal handling */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}> {/* onClose handles Esc key and clicks on backdrop */}
            {/* Backdrop */}
            <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
            >
                {/* Semi-transparent overlay - not clickable or interactive itself */}
                 <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" aria-hidden="true" />
            </Transition.Child>

            {/* Modal Panel */}
            <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
                 {/* The modal panel itself - centered */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                         <Dialog.Panel
                            id="aiModal" // Keep ID for compatibility (though Headless UI handles most needs)
                            className="w-full max-w-md transform rounded-lg bg-white dark:bg-gray-800 p-5 md:p-6 text-left align-middle shadow-xl border border-gray-200 dark:border-gray-700 transition-all"
                         >
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <BrainCircuit size={20} /> AI Medical Assistant
                            </Dialog.Title>

                             {/* Close button */}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors"
                                aria-label="Close AI chat"
                            >
                                <XCircle size={20} />
                            </button>

                            {/* Response Area */}
                            {/* Added a div wrapper for consistent height and layout */}
                            <div className="mb-4 h-64 overflow-y-auto p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-600">
                                {isLoading ? (
                                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <Loader2 size={24} className="animate-spin mr-2" />
                                    Getting response...
                                  </div>
                                ) : response ? (
                                  <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{response}</p>
                                ) : (
                                  <p className="text-gray-400 dark:text-gray-500">Ask a medical question to get started. (e.g., "What are the symptoms of appendicitis?")</p>
                                )}
                              </div>

                            {/* Input Area */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className="flex-grow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                  placeholder="Ask about symptoms, medicines..."
                                  value={query}
                                  onChange={(e) => setQuery(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isLoading && query.trim()) { // Added trim() check
                                      e.preventDefault();
                                      handleAskAI();
                                    }
                                  }}
                                  disabled={isLoading}
                                />
                                {/* Clear Button - Show only if query or response exist */}
                                {(query || response) && (
                                     <button
                                       onClick={handleClear}
                                       className={`p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                       disabled={isLoading}
                                       aria-label="Clear input and response"
                                       title="Clear Chat"
                                     >
                                       <XCircle size={20} />
                                     </button>
                                )}
                                {/* Send Button */}
                                <button
                                  className={`bg-blue-500 p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`} // Disabled style
                                  onClick={handleAskAI}
                                  disabled={isLoading || !query.trim()} // Disable if loading or query is empty
                                  aria-label="Send query"
                                  title="Send Query"
                                >
                                  {isLoading ? <Loader2 size={20} className="text-white animate-spin" /> : <Send size={20} className="text-white" />}
                                </button>
                              </div>

                        </Dialog.Panel>
                    </div>
                </div>
            </Transition.Child>
        </Dialog>
      </Transition>

    </>
  );
};


const DoctorDashboard = () => {
  // Destructure backendUrl and dtoken from DoctorContext
  // Assume cancelAppointment is also provided by DoctorContext if you want to use it
  const { dashData, dtoken, backendUrl, getDashData, completeAppointment, cancelAppointment: cancelAppointmentContext, profileData, getProfileData } = useContext(DoctorContext);
  const { currency, slotDataFormat } = useContext(AppContext);
  const [loadingComplete, setLoadingComplete] = useState(null);
  const [loadingCancel, setLoadingCancel] = useState(null);
  const [localDashData, setLocalDashData] = useState(null);

  // Fetch profile data
  useEffect(() => {
    // Ensure dtoken and backendUrl exist before fetching profile
    if (!profileData && dtoken && backendUrl) {
      getProfileData();
    }
  }, [dtoken, backendUrl, profileData, getProfileData]); // Added backendUrl dependency

  // Fetch dashboard data initially and when token/backendUrl change
  useEffect(() => {
     // Ensure dtoken and backendUrl exist before fetching dashboard data
    if (dtoken && backendUrl) {
      getDashData();
    }
  }, [dtoken, backendUrl, getDashData]);

  // Optional: Effect to re-fetch if dashData becomes null (might indicate logout/error)
  // Keep this as a safeguard if getDashData doesn't handle all cases
   useEffect(() => {
     if (!dashData && dtoken && backendUrl) {
       getDashData();
     }
   }, [dashData, dtoken, backendUrl, getDashData]);


  // Sync context dashData to local state for rendering (optional, but useful if you need to modify local state)
  // If you only read from context, you can remove localDashData state and use dashData directly
  useEffect(() => {
    setLocalDashData(dashData);
  }, [dashData]);


  // --- Handle Complete Appointment ---
  const handleComplete = async (id) => {
    // Prevent actions if another action is in progress or no token/url
    // Check against null specifically if loading states are initialized to null
    if (loadingComplete !== null || loadingCancel !== null || !dtoken || !backendUrl) return;
     if (!window.confirm("Mark this appointment as complete?")) return; // Confirmation

    setLoadingComplete(id); // Set loading state for this specific appointment ID
    try {
        // Assuming completeAppointment in context wraps the API call using axios and handles success/failure toasts
        // and potentially refreshes the dashData in the context
        await completeAppointment(id);

        // If completeAppointment in context does NOT automatically update dashData state, uncomment the line below:
        // await getDashData(); // Re-fetch dashboard data to update the list
    } catch (error) {
        // Error handling (toast) should ideally be inside the completeAppointment context function
        // If not, add a generic toast error here
        console.error("Error completing appointment:", error);
        toast.error("Failed to mark as complete. Please try again.");
    } finally {
        setLoadingComplete(null); // Reset loading state
    }
  };


   // *** Corrected handleCancel function with more specific error handling ***
   // Using the context function if available, otherwise doing the axios call here
  const handleCancel = async (id) => {
     // Prevent actions if another action is in progress or no token/url
     // Check against null specifically if loading states are initialized to null
     if (loadingComplete !== null || loadingCancel !== null || !dtoken || !backendUrl) {
        console.warn("Action blocked: Another action is in progress or data missing.");
        return; // Block if *any* action is loading
     }

     // Add confirmation dialog before canceling
     if (!window.confirm("Are you sure you want to cancel this appointment?")) {
         return; // User clicked Cancel in the confirmation dialog
     }

     setLoadingCancel(id); // Set loading state for this specific appointment ID

     try {
        let responseData;

        // Option 1: Use cancelAppointment function from Context if it exists and is implemented
        if (cancelAppointmentContext && typeof cancelAppointmentContext === 'function') {
            console.log(`Attempting to cancel appointment ID: ${id} using context function.`);
            // Assume context function handles axios call, token, URL, success/failure toasts
            // Assume it returns a promise that resolves on success/failure
             // Note: Context functions might handle toasts internally, so the catch below might not be hit for backend failures.
             // Adjust based on how your context is implemented.
            await cancelAppointmentContext(id);
             // If context function doesn't throw on backend failure but indicates it via return,
             // you might need to check its return value here.
             // Example: if context function returns { success: true/false }
             // if (!result?.success) throw new Error(result?.message || "Context function failed.");

        }
        // Option 2: Directly use axios call here if context function isn't used or exists
        else {
            console.log(`Attempting to cancel appointment ID: ${id} at ${backendUrl}/api/doctor/cancel-appointment/${id} using direct axios.`); // Log URL for verification

           const response = await axios.put(
             `${backendUrl}/api/doctor/cancel-appointment/${id}`, // *** Verify this endpoint with your backend ***
             {}, // Empty body or whatever your endpoint expects for a PUT cancel
             { headers: { 'Authorization': `Bearer ${dtoken}` } } // Send doctor's token in headers
           );

            responseData = response.data;

           // Check the response from the backend if not using context function
           if (responseData.success) {
             toast.success(responseData.message || "Appointment cancelled successfully!");
           } else {
             // Handle cases where success is false but no error was thrown by axios (backend indicates failure)
             console.error("Backend reported cancellation failure:", responseData.message);
             toast.error(responseData.message || "Failed to cancel appointment (Server indicated failure).");
           }
        }


       // In either case (context or direct axios), re-fetch dashboard data to reflect the change in the UI.
       // Only call getDashData if the API call was successful (either via context or direct)
       // If context function already calls getDashData, this might be redundant.
       // Check your context implementation.
       // Assuming getDashData needs to be called AFTER the update completes:
       await getDashData();


     } catch (error) {
       // Handle API errors (network issues, 400, 401, 403, 404, 500 errors from backend etc.)
       console.error("API Error during cancellation:", error.response?.data || error.message || error);

       let errorMessage = "An unknown error occurred."; // Default message

       if (error.response) {
           // The request was made and the server responded with a status code
           // that falls out of the range of 2xx
           const status = error.response.status;
           const backendMessage = error.response.data?.message; // Try to get backend message

           if (status === 401 || status === 403) {
               errorMessage = backendMessage || "Authentication failed or insufficient permissions.";
           } else if (status === 404) {
               errorMessage = backendMessage || "Appointment not found.";
           } else if (status >= 400 && status < 500) {
               errorMessage = backendMessage || `Bad request. Status: ${status}.`; // Include status for more info
           } else if (status >= 500) {
               errorMessage = backendMessage || `Server error. Please try again later. Status: ${status}.`; // Include status
           } else {
               // Catch any other unexpected 3xx or 4xx/5xx statuses
              errorMessage = backendMessage || `API error with status: ${status}.`;
           }
       } else if (error.request) {
           // The request was made but no response was received (e.g., network down, CORS issue)
           errorMessage = "Network error: Could not connect to the server. Please check your internet connection or contact support.";
       } else {
           // Something else happened in setting up the request that triggered an Error
           errorMessage = `Client-side error: ${error.message}.`;
       }

       toast.error(`Cancellation failed: ${errorMessage}`);

     } finally {
       setLoadingCancel(null); // Reset loading state for this appointment ID
     }
   };


  // --- Render Logic ---

  // Show initial loading spinner if dashData and profileData are null
  // and we have a token/backendUrl to attempt fetching
  // Added check for localDashData as it's used for rendering
  // Removed `!localDashData && !profileData` because even if they are null initially,
  // the presence of token and backendUrl means we are *attempting* to load,
  // so show loading state.
  if (dtoken && backendUrl && localDashData === undefined && profileData === undefined) {
     // This state might happen right after mount before any fetch starts/updates state
      return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="ml-4 text-gray-600 dark:text-gray-300 text-lg">Loading Dashboard...</p>
        </div>
      );
  }


  // Fallback if token/backendUrl is missing or fetch failed completely
  // If localDashData is still null or undefined, and we were supposed to fetch (token/url present),
  // it indicates a failure, show error message.
  // Also handle the case where token or backendUrl is missing initially.
  if (!dtoken || !backendUrl || localDashData === null) { // Check if localDashData is explicitly null (failed fetch) or if auth data is missing
      // If localDashData is null, and we had token/url, it means the fetch failed
       const loadError = (!dtoken || !backendUrl) ?
                         (!dtoken ? "Authentication token missing." : "Backend URL missing.") :
                         (localDashData === null && profileData === null) ?
                         "Failed to load dashboard data." : // Failed fetch
                         "Dashboard data is unavailable."; // Default fallback

      return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-red-50 dark:bg-red-900 p-6 text-center text-red-800 dark:text-red-200">
            <XCircle size={40} className="mb-4 text-red-600 dark:text-red-400"/>
            <h1 className="text-xl font-semibold mb-3">Failed to Load Dashboard</h1>
            <p className="mb-4">{loadError}</p>
             {/* Optional: Add a retry button if error is fetch-related */}
             {dtoken && backendUrl && localDashData === null && (
                <button onClick={getDashData} className="btn btn-primary mt-4">Retry Loading</button>
             )}
            {/* Optional: Add link to login page */}
        </div>
      );
  }

  // Now localDashData is guaranteed not to be null (unless it's undefined initially, handled above, or explicitly an empty object/array if API returns that)
  // Check if latestAppointmnets is available before rendering the list
  const hasAppointments = Array.isArray(localDashData.latestAppointmnets) && localDashData.latestAppointmnets.length > 0;


  return (
    <div className="w-full bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Welcome, {profileData?.name || <span className="text-gray-500 dark:text-gray-400">Doctor...</span>}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Here's your dashboard overview.</p>
      </div>

      {/* Summary Cards */}
      {/* Ensure summary cards still render even if latest bookings fail, as long as localDashData itself loaded */}
      {localDashData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
              <img src={assets.earning_icon} alt="Salary" className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0" />
              <div>
                <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{currency}{localDashData?.salary ?? 'N/A'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your Salary</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
              <img src={assets.appointments_icon} alt="Total Appointments" className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0" /> {/* Added alt text */}
              <div>
                <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{localDashData?.appointments ?? 'N/A'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Appointments</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
              <img src={assets.patients_icon} alt="Total Patients" className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0" /> {/* Added alt text */}
              <div>
                <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{localDashData?.patients ?? 'N/A'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
              </div>
            </div>
          </div>
      )}


      {/* Latest Bookings List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-6xl mx-auto overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <img src={assets.list_icon} alt="Bookings List" className="w-6 h-6" /> {/* Added alt text */}
          <p className="font-semibold text-base md:text-lg text-gray-700 dark:text-gray-200">Latest Bookings</p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* Conditional Rendering: Loading, No Data, or List */}
          {!localDashData || !Array.isArray(localDashData.latestAppointmnets) ? ( // Show loading if localDashData is null or latestAppointments isn't an array yet
               <p className="text-center text-gray-500 dark:text-gray-400 p-6 md:p-8">Loading appointments...</p>
          ) : hasAppointments ? ( // Render list if array exists and has items
            localDashData.latestAppointmnets.map((item) => (
              <div
                key={item._id}
                className={`grid grid-cols-[auto,1fr,auto,auto] items-center gap-3 md:gap-4 px-4 py-3 md:px-5 md:py-4 transition-colors duration-200 ${
                  item.isCompleted
                    ? 'bg-green-50 dark:bg-green-900/30'
                    : item.cancelled
                    ? 'bg-red-50 dark:bg-red-900/30 opacity-70'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <img
                  src={item.userData?.image || assets.default_profile}
                  alt={item.userData?.name || "Patient Profile"}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600 shadow-sm flex-shrink-0"
                  onError={(e) => { e.target.onerror = null; e.target.src=assets.default_profile; }} // Fallback image
                />

                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base text-gray-800 dark:text-gray-100 truncate">{item.userData?.name || "Unknown Patient"}</p>
                   {/* Displaying Date AND Time together for clarity */}
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {slotDataFormat(item.slotDate)} at {item.slotTime}
                  </p>
                </div>

                {/* Phone - shown on md+ */}
                <div className='hidden md:block text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap'>
                  <p>📞 {item.userData?.phone || "No Phone"}</p>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  {item.cancelled ? (
                    <span className="text-red-600 dark:text-red-400 font-semibold text-xs md:text-sm px-2 py-1 rounded bg-red-100 dark:bg-red-900/50">Cancelled</span>
                  ) : item.isCompleted ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold text-xs md:text-sm px-2 py-1 rounded bg-green-100 dark:bg-green-900/50">Completed</span>
                  ) : (
                    <>
                      {/* Cancel Button */}
                      <button
                        onClick={() => handleCancel(item._id)}
                        disabled={loadingCancel === item._id || loadingComplete !== null} // Disable if cancelling THIS item or ANY item is completing
                        className={`p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${loadingCancel === item._id ? 'animate-pulse' : ''}`} // Pulse animation when loadingCancel matches ID
                        aria-label="Cancel Appointment"
                        title="Cancel Appointment"
                      >
                        {loadingCancel === item._id ? <Loader2 size={18} className="animate-spin"/> : <img src={assets.cancel_icon} alt="Cancel" className="w-5 h-5 md:w-6 md:h-6" />}
                      </button>

                      {/* Complete Button */}
                      <button
                        onClick={() => handleComplete(item._id)}
                        disabled={loadingComplete === item._id || loadingCancel !== null} // Disable if completing THIS item or ANY item is cancelling
                        className={`p-1.5 rounded-full text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${loadingComplete === item._id ? 'animate-pulse' : ''}`} // Pulse animation when loadingComplete matches ID
                        aria-label="Complete Appointment"
                         title="Complete Appointment"
                      >
                         {loadingComplete === item._id ? <Loader2 size={18} className="animate-spin"/> : <img src={assets.tick_icon} alt="Complete" className="w-5 h-5 md:w-6 md:h-6" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : ( // Fallback if latestAppointmnets is an empty array after loading
              <p className="text-center text-gray-500 dark:text-gray-400 p-6 md:p-8">No recent bookings found.</p>
          )}
        </div>
      </div>

      {/* Render AIChat component */}
      <AIChat />
    </div>
  );
};

export default DoctorDashboard;