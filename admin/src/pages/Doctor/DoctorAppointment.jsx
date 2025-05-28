import React, { useEffect, useState, useContext, useMemo } from 'react';
import { DoctorContext } from '../../context/doctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
// Use consistent icons
import { FaSearch } from 'react-icons/fa';
import { Check, X, Loader2, CalendarDays, Clock, User, CircleDollarSign, BadgeCheck, BadgeX, Hourglass } from 'lucide-react';

const DoctorAppointment = () => {
  const {
    dtoken,
    appointments,
    getAppointments,
    cancelAppointment,
    completeAppointment
  } = useContext(DoctorContext);
  const { calculateAge, slotDataFormat, currency } = useContext(AppContext);

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loadingCompleteId, setLoadingCompleteId] = useState(null);
  const [loadingCancelId, setLoadingCancelId] = useState(null);

  useEffect(() => {
    if (dtoken) {
      getAppointments();
    }
    // Intentionally not adding getAppointments to dependency array if it's stable
    // Otherwise, add it: [dtoken, getAppointments]
  }, [dtoken]);

  // Memoize filtered appointments for performance
  const filteredAppointments = useMemo(() => {
    return (appointments || []) // Ensure appointments is an array
      .filter((item) => {
        // Search filter (case-insensitive)
        const nameMatch = search ? item.userData?.name?.toLowerCase().includes(search.toLowerCase()) : true;
        if (!nameMatch) return false;

        // Payment filter
        const paymentMatch = paymentFilter === 'All' || (paymentFilter === 'Online' ? item.payment : !item.payment);
        if (!paymentMatch) return false;

        // Status filter
        const statusMatch = statusFilter === 'All' ||
          (statusFilter === 'Completed' && item.isCompleted) ||
          (statusFilter === 'Cancelled' && item.cancelled) ||
          (statusFilter === 'Pending' && !item.isCompleted && !item.cancelled);
        if (!statusMatch) return false;

        return true;
      });
  }, [appointments, search, paymentFilter, statusFilter]);

  const handleComplete = async (id) => {
    if (loadingCompleteId || loadingCancelId) return;
    setLoadingCompleteId(id);
    try {
      await completeAppointment(id);
      // Optionally re-fetch or update local state optimistically
      getAppointments(); // Re-fetch after action
    } catch (error) {
      console.error("Error completing appointment:", error);
      // Add user feedback (e.g., toast notification)
    } finally {
      setLoadingCompleteId(null);
    }
  };

  const handleCancel = async (id) => {
    if (loadingCompleteId || loadingCancelId) return;
    // Optional: Add confirmation dialog before cancelling
    // if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    setLoadingCancelId(id);
    try {
      await cancelAppointment(id);
      // Optionally re-fetch or update local state optimistically
      getAppointments(); // Re-fetch after action
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      // Add user feedback
    } finally {
      setLoadingCancelId(null);
    }
  };

  // Helper to get status details
  const getStatusDetails = (item) => {
    if (item.isCompleted) return { text: 'Completed', color: 'green', Icon: BadgeCheck };
    if (item.cancelled) return { text: 'Cancelled', color: 'red', Icon: BadgeX };
    return { text: 'Pending', color: 'yellow', Icon: Hourglass };
  };

  return (
    // Use padding for consistent spacing, adjust background gradient
    <div className="w-full p-4 md:p-6 lg:p-8 bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 min-h-screen">
      <p className="mb-4 md:mb-6 text-2xl font-semibold text-gray-800 dark:text-white">Appointments</p>

      {/* Filters Section - Improved responsiveness and styling */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
        {/* Search Input */}
        <div className="relative flex-grow sm:flex-grow-0 sm:w-64 md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FaSearch className="text-gray-400 dark:text-gray-500" size={16} />
          </span>
          <input
            type="text"
            placeholder="Search Patient Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
        </div>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition duration-200 text-sm"
        >
          <option value="All">All Payments</option>
          <option value="Online">Online</option>
          <option value="Cash">Cash</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition duration-200 text-sm"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Appointments List/Table Container */}
      {/* Removed fixed heights, allow natural flow, add overflow-x-auto for smaller screens */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {/* Table - hidden on small screens */}
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden sm:table">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Adjusted padding and text styling */}
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[5%]">#</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[25%]">Patient</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">Payment</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">Age</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[20%]">Date & Time</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">Fees</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((item, index) => {
                  const paymentMethod = item.payment ? 'Online' : 'Cash';
                  const statusDetails = getStatusDetails(item);
                  const isLoading = loadingCompleteId === item._id || loadingCancelId === item._id;

                  return (
                    <tr key={item._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${item.cancelled ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0" src={item.userData?.image || assets.default_profile} alt="Patient" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.userData?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${paymentMethod === 'Online' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{paymentMethod}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{item.userData?.dob ? `${calculateAge(item.userData.dob)} yrs` : 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {slotDataFormat(item.slotDate)} <span className='text-gray-500 dark:text-gray-400'>|</span> {item.slotTime}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{currency}{item.amount}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                         <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusDetails.color}-100 text-${statusDetails.color}-800 dark:bg-${statusDetails.color}-900/50 dark:text-${statusDetails.color}-300`}>
                           <statusDetails.Icon size={14} />
                           {statusDetails.text}
                         </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {!item.isCompleted && !item.cancelled && (
                            <>
                              <button
                                onClick={() => handleComplete(item._id)}
                                disabled={isLoading}
                                className={`p-1.5 rounded-md text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${loadingCompleteId === item._id ? 'animate-pulse' : ''}`}
                                aria-label="Complete Appointment"
                              >
                                {loadingCompleteId === item._id ? <Loader2 size={18} className="animate-spin"/> : <Check size={18} />}
                              </button>
                              <button
                                onClick={() => handleCancel(item._id)}
                                disabled={isLoading}
                                className={`p-1.5 rounded-md text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${loadingCancelId === item._id ? 'animate-pulse' : ''}`}
                                aria-label="Cancel Appointment"
                              >
                                {loadingCancelId === item._id ? <Loader2 size={18} className="animate-spin"/> : <X size={18} />}
                              </button>
                            </>
                          )}
                          {(item.isCompleted || item.cancelled) && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                 <tr>
                    {/* Centered Empty State for Table */}
                    <td colSpan={8} className="text-center py-10 px-4 text-gray-500 dark:text-gray-400">
                        No appointments match your filters.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>

          {/* Card List for Small Screens */}
          <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((item, index) => {
                const paymentMethod = item.payment ? 'Online' : 'Cash';
                const statusDetails = getStatusDetails(item);
                const isLoading = loadingCompleteId === item._id || loadingCancelId === item._id;

                return (
                  <div key={item._id} className={`p-4 ${item.cancelled ? 'opacity-60' : ''} ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    {/* Card Header: Name & Status */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         <img className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0" src={item.userData?.image || assets.default_profile} alt="Patient" />
                         <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.userData?.name || 'N/A'}</span>
                      </div>
                       <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${statusDetails.color}-100 text-${statusDetails.color}-800 dark:bg-${statusDetails.color}-900/50 dark:text-${statusDetails.color}-300`}>
                           <statusDetails.Icon size={12} />
                           {statusDetails.text}
                       </span>
                    </div>

                    {/* Card Body: Details */}
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-gray-400 dark:text-gray-500"/>
                        <span>{slotDataFormat(item.slotDate)}</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <Clock size={14} className="text-gray-400 dark:text-gray-500"/>
                        <span>{item.slotTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-gray-400 dark:text-gray-500"/>
                        <span>Age: {item.userData?.dob ? `${calculateAge(item.userData.dob)} yrs` : 'N/A'}</span>
                      </div>
                       <div className="flex items-center gap-1.5">
                        <CircleDollarSign size={14} className="text-gray-400 dark:text-gray-500"/>
                        <span>Fee: {currency}{item.amount}</span>
                         <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className={`font-medium ${paymentMethod === 'Online' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{paymentMethod} Payment</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    {!item.isCompleted && !item.cancelled && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleComplete(item._id)}
                          disabled={isLoading}
                          className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-md text-white bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${loadingCompleteId === item._id ? 'animate-pulse' : ''}`}
                          aria-label="Complete Appointment"
                        >
                          {loadingCompleteId === item._id ? <Loader2 size={14} className="animate-spin"/> : <Check size={14} />}
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => handleCancel(item._id)}
                          disabled={isLoading}
                          className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-md text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${loadingCancelId === item._id ? 'animate-pulse' : ''}`}
                          aria-label="Cancel Appointment"
                        >
                          {loadingCancelId === item._id ? <Loader2 size={14} className="animate-spin"/> : <X size={14} />}
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Empty State for Mobile
              <p className="text-center py-10 px-4 text-gray-500 dark:text-gray-400">
                No appointments match your filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointment;