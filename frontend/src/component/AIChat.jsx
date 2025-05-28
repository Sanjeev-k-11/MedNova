import React, { useEffect, useRef, useState, useCallback } from "react";
import { Send, XCircle, X, Bot, Loader2, Phone, Mail, CheckCircle } from "lucide-react";

// --- Configuration ---
// Contact Information - Still needed for fallback/additional help
const CONTACT_PHONE = "7894562135";
const CONTACT_EMAIL = "sy781405@gmail.com";

// --- Simple Knowledge Base for Example Tasks ---
// Now using an Array of objects, where each object has multiple keywords.
// YOU WILL NEED TO REPLACE THESE WITH YOUR ACTUAL MEDNOVA APP STEPS AND ADD MORE TASKS.
const KNOWLEDGE_BASE = [
    { // Task 1: Booking Appointment
        keywords: ["book appointment", "booking appointment", "appointment", "appointments", "schedule appointment"],
        title: "Booking an Appointment",
        steps: [
            "To book an appointment in the Mednova app, please follow these steps:",
            "1. Go to the 'Appointments' or 'Doctors' section.",
            "2. Find the doctor you want to see or tap on '+ Book New'.",
            "3. Select the desired date and time slot.",
            "4. Review the details and confirm your booking.",
            "You will receive a confirmation message once done.",
            `If you face any issues, please contact our support team: 📞 ${CONTACT_PHONE}, 📧 ${CONTACT_EMAIL}`
        ]
    },
    { // Task 2: Making Payment
        keywords: ["make payment", "making payment", "payment", "payments", "pay bill", "how to pay"],
        title: "Making a Payment",
        steps: [
            "To complete a payment in the Mednova app:",
            "1. Navigate to the 'Payments' or 'Billing' section.",
            "2. Find the pending payment or outstanding bill.",
            "3. Select your preferred payment method (e.g., Credit Card, UPI).",
            "4. Enter the required payment details securely.",
            "5. Confirm the payment. You will get a confirmation upon success.",
            `If your payment fails or you have questions, please contact our support team: 📞 ${CONTACT_PHONE}, 📧 ${CONTACT_EMAIL}`
        ]
    },
     { // Task 3: Contacting Doctor
        keywords: ["contact doctor", "message doctor", "talk to doctor", "doctor contact"],
        title: "Contacting a Doctor",
        steps: [
            "To contact your doctor via the Mednova app:",
            "1. Go to your booked appointment details or the doctor's profile.",
            "2. Look for a 'Message Doctor' or 'Contact' button.",
            "3. Tap on it and compose your message.",
            "4. Send the message. The doctor will respond via the app.",
            "Note: Not all doctors may have direct messaging enabled. For urgent needs, always call or visit the clinic directly.",
             `For app-related contact issues, reach out to support: 📞 ${CONTACT_PHONE}, 📧 ${CONTACT_EMAIL}`
        ]
    },
     { // Task 4: Requesting Refund
        keywords: ["money back", "refund", "request refund", "cancel payment refund"],
        title: "Requesting a Refund",
        steps: [
            "For refund requests related to Mednova services:",
            "1. Go to the 'Payments' or 'Transaction History' section.",
            "2. Identify the transaction you need a refund for.",
            "3. Note down the transaction ID or relevant details.",
            "4. Please contact our support team directly with these details.",
            `You can reach them at: 📞 ${CONTACT_PHONE}, 📧 ${CONTACT_EMAIL}`,
            "Refund processes vary, support will guide you on the next steps."
        ]
    },
    // Add more task objects here following the same structure (keywords, title, steps)
];

// --- Helper function to check if query matches a known task ---
// Now checks against multiple keywords for each task.
const findMatchingTask = (query) => {
    const lowerQuery = query.toLowerCase();
    // Iterate through each task object in the knowledge base array
    for (const task of KNOWLEDGE_BASE) {
        // For each task, check if the user's query includes ANY of its keywords
        const isMatch = task.keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()));
        if (isMatch) {
            return task; // Return the matching task object
        }
    }
    return null; // No matching task found
};


// --- Component ---
const AIChat = () => {
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const modalRef = useRef(null);
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Check if User is Logged In (Runs once on mount)
    useEffect(() => {
        const userToken = localStorage.getItem("token");
        setIsLoggedIn(!!userToken);
    }, []);

    // Focus input and potentially show greeting when modal opens
    useEffect(() => {
        if (isModalOpen) {
            inputRef.current?.focus();
            // Reset messages when opening for a fresh start
             setMessages([]);
             setIsLoading(false); // Ensure not loading when opening
             // Add initial bot greeting message here
             setTimeout(() => { // Add a slight delay for the greeting
                 setMessages([{
                     sender: "bot",
                     // List the main topics the bot can help with
                     text: `Hello! I can provide step-by-step guidance on common Mednova app tasks. Try asking about:\n\n` +
                           `- Booking Appointments\n` +
                           `- Making Payments\n` +
                           `- Contacting Doctors\n` +
                           `- Requesting Refunds\n\n` +
                           `What can I help you with today?`,
                     id: Date.now() + "_greeting"
                 }]);
             }, 500); // Delay the initial greeting
        }
        // Cleanup listener is in a separate effect below
    }, [isModalOpen]);

    // Effect for adding/removing outside click listener - separated for clarity
     useEffect(() => {
        const handleModalClose = (event) => {
             if (modalRef.current && !modalRef.current.contains(event.target)) {
                 setIsModalOpen(false);
             }
        };
        if (isModalOpen) {
            document.addEventListener("mousedown", handleModalClose);
        } else {
            document.removeEventListener("mousedown", handleModalClose);
        }
        // Cleanup listener
        return () => {
            document.removeEventListener("mousedown", handleModalClose);
        };
    }, [isModalOpen]); // Only depends on isModalOpen


    // Scroll to the bottom whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle Ask AI - Now finds task and provides steps or fallback
    const handleAskAI = useCallback(async () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || isLoading) return;

        // 1. Add user message to the list
        const newUserMessage = { sender: "user", text: trimmedQuery, id: Date.now() + "_user" };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setQuery(""); // Clear input immediately

        setIsLoading(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 800)); // Slightly reduced delay

        // 2. Find matching task steps using the improved function
        const matchedTask = findMatchingTask(trimmedQuery);

        let botResponseText;
        if (matchedTask) {
            // If a task matches, provide the steps
            // Join steps with newlines, and add title at the top
            botResponseText = `**${matchedTask.title}:**\n\n` + matchedTask.steps.join('\n');
        } else {
            // If no task matches, provide a fallback message with contact info
            botResponseText =
                `I'm sorry, I couldn't find steps for that specific query. I can provide guidance on tasks like:\n\n` + // More helpful phrasing
                 `- Booking Appointments\n` +
                 `- Making Payments\n` +
                 `- Contacting Doctors\n` +
                 `- Requesting Refunds\n\n` +
                `For other issues or if your query is not covered, please contact our support team directly:\n\n` +
                `📞 Phone: ${CONTACT_PHONE}\n` +
                `📧 Email: ${CONTACT_EMAIL}\n\n` +
                `**Disclaimer:** Do not use this service for medical emergencies. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.`;
        }

        // 3. Add bot message to the list
        const newBotMessage = { sender: "bot", text: botResponseText, id: Date.now() + "_bot" };
        setMessages(prevMessages => [...prevMessages, newBotMessage]);

        setIsLoading(false);

    }, [query, isLoading]); // Dependencies

    // Handle Enter key press
    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleAskAI();
        }
    };

    // Function to clear input field
    const clearInput = () => {
        setQuery("");
        inputRef.current?.focus();
    };


    return (
        <>
            {/* AI Trigger Button - Only shows when logged in */}
            {isLoggedIn && (
                <button
                    id="aiButton"
                    title="Mednova Support Assistant"
                    className="fixed bottom-5 right-5 z-50 bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-transform duration-200 ease-in-out flex items-center justify-center"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Bot size={24} />
                </button>
            )}

            {/* AI Chat Modal */}
            {isModalOpen && (
                <div
                    className={`fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-40 transition-opacity duration-300 ease-in-out ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                 >
                    <div
                        id="aiModal"
                        ref={modalRef}
                        className="bg-gray-800 text-white rounded-xl shadow-2xl w-full max-w-md flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-3 border-b border-gray-700">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Bot size={20} className="text-blue-400"/> Mednova Support Assistant
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors rounded-full p-1 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                aria-label="Close chat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Response Area - Displays message bubbles */}
                        <div className="p-4 h-72 overflow-y-auto flex-grow custom-scrollbar flex flex-col gap-3">
                             {/* We still show a loading/initial message while the greeting loads */}
                             {messages.length === 0 && !isLoading ? (
                                <p className="text-gray-400 text-center italic mt-4">
                                    Loading assistant...
                                </p>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* Bot icon for bot messages */}
                                        {msg.sender === 'bot' && (
                                             <Bot size={20} className="text-blue-400 mr-2 flex-shrink-0 mt-1" />
                                        )}
                                        <div
                                            className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap ${
                                                msg.sender === 'user'
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-gray-700 text-gray-200 rounded-bl-none'
                                            }`}
                                        >
                                            {/* Render bot text with line breaks, icons for contact info, and icons for steps */}
                                            {msg.sender === 'bot' ? (
                                                msg.text.split('\n').map((line, lineIndex) => (
                                                    <React.Fragment key={lineIndex}>
                                                        {line.startsWith('📞 Phone:') ? (
                                                            <div className="flex items-center">
                                                                <Phone size={16} className="inline-block mr-2 flex-shrink-0" /> {line}
                                                            </div>
                                                        ) : line.startsWith('📧 Email:') ? (
                                                            <div className="flex items-center">
                                                                 <Mail size={16} className="inline-block mr-2 flex-shrink-0" /> {line}
                                                            </div>
                                                        ) : line.match(/^\d+\./) ? ( // Check if line starts with "number." for steps
                                                            <div className="flex items-start">
                                                                 {/* Display step number and text after the icon */}
                                                                 <CheckCircle size={16} className="inline-block mr-2 flex-shrink-0 mt-1 text-green-400" /> <span className="flex-1">{line}</span> {/* Added span for flex alignment */}
                                                            </div>
                                                        ) : (
                                                            line // Render regular lines (title, intro, disclaimer)
                                                        )}
                                                        {/* Add line breaks between lines except the last one */}
                                                        {lineIndex < msg.text.split('\n').length - 1 && <br />}
                                                    </React.Fragment>
                                                ))
                                            ) : (
                                                // Render user text directly
                                                msg.text
                                            )}
                                        </div>
                                        {/* Optional User icon */}
                                        {/* {msg.sender === 'user' && (
                                             <User size={20} className="text-gray-400 ml-2 flex-shrink-0 mt-1" />
                                        )} */}
                                    </div>
                                ))
                            )}

                            {/* Loading indicator bubble */}
                            {isLoading && (
                                <div className="flex items-start justify-start">
                                    <Bot size={20} className="text-blue-400 mr-2 flex-shrink-0 mt-1" />
                                    <div className="bg-gray-700 text-gray-200 p-3 rounded-lg rounded-bl-none max-w-[85%] flex items-center">
                                         <Loader2 size={16} className="animate-spin mr-2" /> Typing... {/* Updated loading text */}
                                    </div>
                                </div>
                            )}

                            {/* Empty div to scroll into view */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-gray-700 flex items-center gap-2">
                            <div className="relative flex-grow">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="border border-gray-600 bg-gray-700 text-white p-2 pl-3 pr-8 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    placeholder="Ask about booking, payments, etc."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                    aria-label="Your question about Mednova features"
                                />
                                {query && !isLoading && (
                                    <button
                                        onClick={clearInput}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        aria-label="Clear input"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                )}
                             </div>
                            <button
                                className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                onClick={handleAskAI}
                                disabled={isLoading || !query.trim()}
                                aria-label="Send question"
                            >
                                <Send size={20} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

             {/* Optional: Add custom scrollbar styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #2d3748; /* gray-800 */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #4a5568; /* gray-600 */
                    border-radius: 4px;
                    border: 2px solid #2d3748; /* gray-800 */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #718096; /* gray-500 */
                }
                /* For Firefox */
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #4a5568 #2d3748;
                }
            `}</style>
        </>
    );
};

export default AIChat;