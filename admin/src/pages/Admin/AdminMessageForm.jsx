import React, { useState } from 'react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AdminMessageForm = ({ token }) => {
    const [message, setMessage] = useState('');

    const handleSendMessage = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/admin/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Message sent to all doctors!");
                setMessage('');
            } else {
                toast.error(data.message || "Failed to send message.");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(error.message || "Error sending message.");
        }
    };

    const handleResetMessages = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/admin/reset-messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Messages reset successfully!");
            } else {
                toast.error("Failed to reset messages.");
            }
        } catch (error) {
            console.error("Error resetting messages:", error);
            toast.error("Error resetting messages.");
        }
    };

    return (
        <div className="p-4 bg-white rounded-md shadow-md">
            <h2 className="text-lg font-semibold mb-2">Admin Actions</h2>
            <div className="mb-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message:</label>
                <input
                    type="text"
                    id="message"
                    className="mt-1 p-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <button className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-700" onClick={handleSendMessage}>
                    Send Message
                </button>
                <button className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-700" onClick={handleResetMessages}>
                    Reset Messages
                </button>
            </div>
        </div>
    );
};

export default AdminMessageForm;