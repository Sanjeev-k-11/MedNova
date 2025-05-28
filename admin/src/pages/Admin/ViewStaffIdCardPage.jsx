// src/pages/admin/ViewStaffIdCardPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext'; // Adjust path
import { ArrowLeft, AlertCircle } from 'lucide-react';
import StaffIdCard from '../staff/StaffIdCard'; // Adjust path
import { toast } from 'react-toastify';

const ViewStaffIdCardPage = () => {
    const { id: staffId } = useParams();
    const navigate = useNavigate();
    const { token, backendUrl } = useContext(AdminContext);

    const [staffData, setStaffData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStaffData = async () => {
            setLoading(true);
            setError(null);
            if (!token || !staffId) {
                setError("Authentication or Staff ID missing.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${backendUrl}/api/staff/${staffId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.success && response.data.staff) {
                    setStaffData(response.data.staff);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch staff details');
                }
            } catch (err) {
                console.error("Error fetching staff for ID card:", err);
                 const status = err.response?.status;
                 let message = err.response?.data?.message || err.message || "Could not load staff data.";
                 if (status === 404) message = "Staff member not found.";
                 if (status === 401) message = "Unauthorized. Please log in again.";
                 if (status === 403) message = "Forbidden.";
                setError(message);
                 toast.error(`Error loading ID card data: ${message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchStaffData();
    }, [staffId, backendUrl, token]); // Re-fetch if ID, URL, or token changes

    if (loading) {
         return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
               {/* Spinner */}
               <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <p className="ml-3 text-gray-700 dark:text-gray-300">Loading ID card...</p>
            </div>
         );
    }

    if (error || !staffData) {
        return (
            <div className="container mx-auto px-4 py-8 text-center bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                <AlertCircle size={30} className="mx-auto mb-4 text-red-600 dark:text-red-400"/>
                <h1 className="text-xl font-semibold mb-4">Could not load Staff ID Card</h1>
                <p className="mb-6">{error || "Staff data not found."}</p>
                 <button
                     onClick={() => navigate(-1)}
                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                 >
                    <ArrowLeft size={16} className="mr-2" /> Go Back
                 </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
             <div className="w-full max-w-xs text-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150 ease-in-out p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Go Back to Edit Page" aria-label="Go Back"
                 >
                    <ArrowLeft size={20} className="mr-1"/> Back
                </button>
             </div>
             {/* Render the flipping ID Card */}
            <StaffIdCard staffData={staffData} />
             {/* Optional: Add print button, download button, etc. */}
             {/*
             <div className="mt-6">
                 <button className="btn btn-secondary">Download PDF</button>
             </div>
             */}
        </div>
    );
};

export default ViewStaffIdCardPage;