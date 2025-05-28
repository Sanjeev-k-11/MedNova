// src/pages/StaffScheduleView.jsx (or similar path - e.g., sedulestaf.jsx)

import React, { useState, useContext, useEffect, useMemo } from "react";
import { StaffContext } from "../../context/StaffContext"; // Adjust path
import { useTheme } from '../../context/ThemeContext'; // Adjust path for ThemeContext
import axios from "axios";
import {
    Loader2,
    Calendar,
    Clock,
    AlertCircle,
    Info,
    CheckCircle, // Available (might be unused if relying on UserCheck/UserX)
    XCircle,      // Unavailable (might be unused if relying on UserCheck/UserX)
    Briefcase,    // Shift
    Repeat,       // Recurring
    UserCheck,    // Available Override Icon
    UserX,        // Unavailable Override Icon
    PlusCircle,   // Icon for adding
    X,            // Icon to close form
    Save          // Icon for save button
} from "lucide-react";

// --- Constants ---
const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKS_OF_MONTH_MAP = { 1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth', 5: 'Last' };

// --- Helper Functions ---

// Formats a date string or Date object to a localized, readable date string.
// Returns 'Invalid Date' if input is invalid.
const formatDate = (dateStrOrObj) => {
    if (!dateStrOrObj) return 'N/A';
    try {
        const dateObj = (dateStrOrObj instanceof Date) ? dateStrOrObj : new Date(dateStrOrObj);
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
};

// Formats a date string or Date object to a short date (e.g., "Apr 8").
// Returns 'Invalid Date' if input is invalid.
const formatShortDate = (dateStrOrObj) => {
    if (!dateStrOrObj) return 'N/A';
     try {
        const dateObj = (dateStrOrObj instanceof Date) ? dateStrOrObj : new Date(dateStrOrObj);
         if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
};

// Formats a full date string (like ISO 8601) or a Date object into a localized time string.
// Returns 'Invalid Time' if input is invalid.
const formatTimeFromDate = (dateStrOrObj) => {
    if (!dateStrOrObj) return '';
    try {
        const dateObj = (dateStrOrObj instanceof Date) ? dateStrOrObj : new Date(dateStrOrObj);
        if (isNaN(dateObj.getTime())) {
            return 'Invalid Time';
        }
        return dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (error) {
        // console.error("Error in formatTimeFromDate:", dateStrOrObj, error); // Optional: Reduce console noise
        return 'Time Error';
    }
};

// Formats a time string in HH:MM format into a localized time string.
// Returns 'Invalid Time' or the original string if formatting fails or input is not HH:MM.
const formatTimeFromHHMM = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') {
         return '';
    }
    const trimmedTimeStr = timeStr.trim();
    // Allow H:MM format as well
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmedTimeStr)) {
         return trimmedTimeStr; // Return original string if not HH:MM format
    }
     try {
         const parts = trimmedTimeStr.split(':');
         const hour = parts[0].padStart(2, '0'); // Ensure leading zero
         const minute = parts[1];
         const formattedHHMM = `${hour}:${minute}`;
         const dateObj = new Date(`1970-01-01T${formattedHHMM}:00`);
         if (isNaN(dateObj.getTime())) {
              // console.warn("formatTimeFromHHMM failed to parse:", timeStr); // Optional: Reduce console noise
              return 'Invalid Time';
         }
         return dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
     } catch (error) {
         // console.error("Error in formatTimeFromHHMM:", timeStr, error); // Optional: Reduce console noise
         return 'Time Error';
     }
};

// Formats a date string or Date object into a short date and time string.
// Returns 'Invalid Date/Time' if input is invalid.
const formatDateTime = (dateStrOrObj) => {
    if (!dateStrOrObj) return 'N/A';
     try {
        const dateObj = (dateStrOrObj instanceof Date) ? dateStrOrObj : new Date(dateStrOrObj);
        if (isNaN(dateObj.getTime())) return 'Invalid Date/Time';
        return dateObj.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
        return 'Invalid Date/Time';
    }
};

// Check if a specific date falls within a recurring rule's basic date range
const isDateInRange = (checkDate, rule) => {
    if (!rule || !rule.startDate) return false;
    const checkTime = checkDate.getTime();
    const ruleStart = new Date(rule.startDate);
    ruleStart.setHours(0, 0, 0, 0);
    const startTime = ruleStart.getTime();
    if (isNaN(startTime)) return false;
    if (checkTime < startTime) return false;
    if (rule.endDate) {
        const ruleEnd = new Date(rule.endDate);
        ruleEnd.setHours(23, 59, 59, 999);
        const endTime = ruleEnd.getTime();
        if (isNaN(endTime)) return true; // Treat invalid end date as no end date
        if (checkTime > endTime) return false;
    }
    return true;
};

// Basic check if a rule *might* apply today based on day/week
const isRulePotentiallyActive = (rule, checkDate) => {
    if (!rule || !rule.frequency || !isDateInRange(checkDate, rule)) return false;
    const dayOfWeek = checkDate.getDay(); // 0 = Sunday

    if (rule.frequency === 'weekly') {
        // Check if rule has days defined and today is one of them
        return Array.isArray(rule.daysOfWeek) && rule.daysOfWeek.includes(dayOfWeek);
    } else if (rule.frequency === 'monthly') {
        // Check if necessary monthly properties exist and match today
        if (typeof rule.dayOfWeekMonthly !== 'number' || typeof rule.weekOfMonth !== 'number') return false;
        if (rule.dayOfWeekMonthly !== dayOfWeek) return false;

        const dateOfMonth = checkDate.getDate();
        const year = checkDate.getFullYear();
        const month = checkDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const firstWeekdayOfMonth = firstDayOfMonth.getDay();

        // Calculate date of the first occurrence of the target dayOfWeek in the month
        let dateOfFirstOccurrence = 1 + (rule.dayOfWeekMonthly - firstWeekdayOfMonth + 7) % 7;
        // Calculate date of the Nth occurrence
        let dateOfNthOccurrence = dateOfFirstOccurrence + (rule.weekOfMonth - 1) * 7;

        if (rule.weekOfMonth === 5 || rule.weekOfMonth === -1) { // Handle 'last' (5 or -1 often used)
             const lastDayOfMonth = new Date(year, month + 1, 0); // Last day of current month
             const lastWeekdayOfMonth = lastDayOfMonth.getDay();
             // Calculate date of the last occurrence of the target dayOfWeek in the month
             const dateOfLastOccurrence = lastDayOfMonth.getDate() - (lastWeekdayOfMonth - rule.dayOfWeekMonthly + 7) % 7;
             // Check if today is this last occurrence
             return dateOfMonth === dateOfLastOccurrence;
        } else if (rule.weekOfMonth >= 1 && rule.weekOfMonth <= 4) {
            // Check if today is the Nth occurrence
             return dateOfMonth === dateOfNthOccurrence;
        }
        return false; // Invalid weekOfMonth
    }
    return false; // Unknown frequency
};


// --- Component ---
const StaffScheduleView = () => {
  const { staffToken, backendUrl } = useContext(StaffContext);
  const { currentTheme } = useTheme();

  const [scheduleData, setScheduleData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);

  // State for Add Exception Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newException, setNewException] = useState({
      date: '',
      isAvailable: false, // Default to unavailable
      startTime: '',
      endTime: '',
      reason: '',
      notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState(null);

  // --- Fetch Schedule Data ---
  useEffect(() => {
    const fetchMySchedule = async () => {
      if (!staffToken) {
        setScheduleError("Authentication required. Please log in again.");
        setLoadingSchedule(false);
        return;
      }
      setLoadingSchedule(true);
      setScheduleError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/staff/schedule/me`, {
          headers: { Authorization: `Bearer ${staffToken}` },
        });
        // Expecting backend to return the full schedule for this component version
        if (response.data.success && response.data.schedule) {
          const schedule = response.data.schedule;
          const sortedSchedule = {
            ...schedule,
            // Ensure arrays exist even if null/undefined from API before sorting
            scheduledShifts: [...(schedule.scheduledShifts || [])].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
            availabilityOverrides: [...(schedule.availabilityOverrides || [])].sort((a, b) => new Date(a.date) - new Date(b.date)),
            recurringAvailability: [...(schedule.recurringAvailability || [])].sort((a, b) => (a?.frequency > b?.frequency ? 1 : -1)),
          };
          setScheduleData(sortedSchedule);
        } else {
          throw new Error(response.data.message || "Failed to fetch schedule data.");
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        const errorMessage = error.response?.data?.message || error.message || "Could not load your schedule. Please try again later.";
        setScheduleError(errorMessage);
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchMySchedule();
  }, [staffToken, backendUrl]); // Refetch if token/URL change


  // --- Calculate Today's Schedule Details using useMemo ---
    const todaysDetails = useMemo(() => {
        if (!scheduleData) return {
            summary: null, status: 'loading', items: [],
            overrideApplied: false, isUnavailableOverride: false, availableOverrideTimes: null
        };

        const today = new Date();
        const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
        const todayStartTime = todayStart.getTime();
        const todayEndTime = todayEnd.getTime();

        // Ensure arrays exist before filtering
        const overrides = scheduleData.availabilityOverrides || [];
        const shifts = scheduleData.scheduledShifts || [];
        const recurring = scheduleData.recurringAvailability || [];

        const todaysOverrides = overrides.filter(ov => {
            if (!ov || !ov.date) return false;
            const overrideDate = new Date(ov.date);
            return !isNaN(overrideDate.getTime()) &&
                overrideDate.getFullYear() === today.getFullYear() &&
                overrideDate.getMonth() === today.getMonth() &&
                overrideDate.getDate() === today.getDate();
        });
        const unavailableOverride = todaysOverrides.find(ov => ov && !ov.isAvailable);
        const availableOverride = todaysOverrides.find(ov => ov && ov.isAvailable);

        const todaysShifts = shifts.filter(shift => {
            if (!shift || !shift.startTime || !shift.endTime) return false;
            const shiftStart = new Date(shift.startTime).getTime();
            const shiftEnd = new Date(shift.endTime).getTime();
            if (isNaN(shiftStart) || isNaN(shiftEnd)) return false;
            return (shiftStart >= todayStartTime && shiftStart <= todayEndTime) ||
                (shiftEnd > todayStartTime && shiftEnd <= todayEndTime) ||
                (shiftStart < todayStartTime && shiftEnd > todayEndTime);
        });

        // Ensure rule.isAvailable check handles undefined or true cases
        const potentiallyRecurringToday = recurring
            .filter(rule => rule && rule.isAvailable !== false && isRulePotentiallyActive(rule, todayStart));

        let summary = "";
        let status = "off";
        let items = [];
        let availableOverrideTimes = null; // Track if today's AVAILABLE override has specific times

        // --- Determine Status & Summary (Priority: Unavailable > Shift > Available > Recurring > Off) ---
        if (unavailableOverride) {
            status = 'unavailable_override';
            summary = `Marked Unavailable Today (${unavailableOverride.reason || 'No reason given'})`;
            items.push({ type: 'unavailable_override', data: unavailableOverride }); // Add override details
        } else if (todaysShifts.length > 0) {
            status = 'scheduled';
            const shift = todaysShifts[0];
            summary = `Scheduled Shift Today: ${formatTimeFromDate(shift.startTime)} - ${formatTimeFromDate(shift.endTime)}`;
            items = todaysShifts.map(s => ({ type: 'shift', data: s })); // Add all shifts for today
            // If there's also an AVAILABLE override today, add it to the details list
            if (availableOverride) {
               items.push({ type: 'available_override', data: availableOverride });
               // Check if this available override specifies times
               if(availableOverride.startTime || availableOverride.endTime) {
                   availableOverrideTimes = { start: availableOverride.startTime, end: availableOverride.endTime };
               }
            }
        } else if (availableOverride) {
            status = 'available_override';
            summary = `Specifically Available Today`;
            if (availableOverride.startTime || availableOverride.endTime) {
                summary += `: ${formatTimeFromHHMM(availableOverride.startTime)} - ${formatTimeFromHHMM(availableOverride.endTime)}`;
                availableOverrideTimes = { start: availableOverride.startTime, end: availableOverride.endTime };
            }
            items.push({ type: 'available_override', data: availableOverride }); // Add override details
            // Show potentially applicable recurring rules ONLY if the available override does NOT specify times
            if (!availableOverrideTimes) {
                items = items.concat(potentiallyRecurringToday.map(r => ({ type: 'recurring', data: r })));
            }
        } else if (potentiallyRecurringToday.length > 0) {
            status = 'recurring_available';
            const rule = potentiallyRecurringToday[0];
            summary = `Generally Available Today: ${formatTimeFromHHMM(rule.startTime)} - ${formatTimeFromHHMM(rule.endTime)} (Based on recurring rule)`;
            items = potentiallyRecurringToday.map(r => ({ type: 'recurring', data: r })); // Add potentially active recurring rules
        } else {
            status = 'off';
            summary = "No scheduled shifts or specific availability active today.";
            // If status is 'off', items array remains empty unless an override was added but didn't fit other categories (shouldn't happen with current logic)
        }

        return {
            summary, status, items,
            overrideApplied: !!unavailableOverride || !!availableOverride,
            isUnavailableOverride: !!unavailableOverride,
            availableOverrideTimes // Pass this info for detail rendering logic
        };
    }, [scheduleData]); // Recalculate when scheduleData changes


  // --- Render Helper for Today's Items ---
    const renderTodayItem = (item, index) => {
        if (!item || !item.data) {
            return <div key={`invalid-item-${index}`} className="text-red-500 text-xs italic">Invalid schedule item data</div>;
        }
        const key = `${item.type}-${item.data._id || index}`;

        switch(item.type) {
            case 'shift':
                return (
                    <div key={key} className="flex items-start space-x-3 p-3 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded-md">
                        <Briefcase className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-teal-800 dark:text-teal-200">Shift: {formatTimeFromDate(item.data.startTime)} - {formatTimeFromDate(item.data.endTime)}</p>
                            {item.data.roleOverride && <p className="text-xs text-gray-600 dark:text-gray-400">Role: {item.data.roleOverride}</p>}
                            {item.data.notes && <p className="text-xs text-gray-600 dark:text-gray-400">Notes: {item.data.notes}</p>}
                        </div>
                    </div>
                );
            case 'available_override':
                return (
                    <div key={key} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md">
                        <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-green-800 dark:text-green-200">
                                Available Today
                                {(item.data.startTime || item.data.endTime) ? ` (${formatTimeFromHHMM(item.data.startTime)} - ${formatTimeFromHHMM(item.data.endTime)})` : ''}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Reason: {item.data.reason || 'N/A'}{item.data.notes ? ` - ${item.data.notes}` : ''}</p>
                        </div>
                    </div>
                );
            case 'unavailable_override':
                return (
                    <div key={key} className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
                        <UserX className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-red-800 dark:text-red-200">Unavailable Today</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Reason: {item.data.reason || 'N/A'}{item.data.notes ? ` - ${item.data.notes}` : ''}</p>
                        </div>
                    </div>
                );
            case 'recurring':
                 // Logic to hide recurring rule if overridden is implicitly handled by how 'items' is constructed in useMemo
                 // No need for extra checks here if useMemo logic is correct.
                return (
                    <div key={key} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
                        <Repeat className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-blue-800 dark:text-blue-200">General Availability: {formatTimeFromHHMM(item.data.startTime)} - {formatTimeFromHHMM(item.data.endTime)}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Based on rule: Every {item.data.interval > 1 ? `${item.data.interval} ` : ''}{item.data.frequency} on {
                                    item.data.frequency === 'weekly'
                                    ? (item.data.daysOfWeek || []).map(d => DAYS_OF_WEEK_SHORT[d]).join(', ')
                                    : `${WEEKS_OF_MONTH_MAP[item.data.weekOfMonth] || '?'} ${DAYS_OF_WEEK_SHORT[item.data.dayOfWeekMonthly]}`
                                }
                                {item.data.notes ? ` - ${item.data.notes}` : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">Note: This rule might apply today (check interval/start date).</p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };


  // Handler for form input changes
  const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setNewException(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
      }));
      // If marking as unavailable, clear times
       if (name === 'isAvailable' && !checked) {
            setNewException(prev => ({ ...prev, startTime: '', endTime: '' }));
       }
  };

  // Handler for submitting the new exception
  const handleAddExceptionSubmit = async (e) => {
      e.preventDefault();
      setAddError(null);
      setIsSubmitting(true);

      if (!newException.date) {
          setAddError("Date is required.");
          setIsSubmitting(false);
          return;
      }
      // Add validation for reason if it's truly required by schema and not defaulted in backend
      if (!newException.reason) {
           setAddError("Reason is required.");
           setIsSubmitting(false);
           return;
      }

      try {
          const payload = {
                date: newException.date,
                isAvailable: newException.isAvailable,
                // Send null if empty string, or the time if available
                startTime: newException.isAvailable && newException.startTime ? newException.startTime : null,
                endTime: newException.isAvailable && newException.endTime ? newException.endTime : null,
                reason: newException.reason,
                notes: newException.notes
          };

          const response = await axios.post(`${backendUrl}/api/staff/schedule/availability-override`, payload, {
               headers: { Authorization: `Bearer ${staffToken}` },
          });

          if (response.data.success && response.data.override) {
              // Update local state to show the newly added exception immediately
              setScheduleData(prevData => {
                  const updatedOverrides = [...(prevData?.availabilityOverrides || []), response.data.override]
                      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Keep sorted
                  return {
                      ...prevData,
                      availabilityOverrides: updatedOverrides
                  };
              });
              // Reset form and hide it
              setShowAddForm(false);
              setNewException({ date: '', isAvailable: false, startTime: '', endTime: '', reason: '', notes: '' });
          } else {
              throw new Error(response.data.message || "Failed to add exception.");
          }

      } catch (error) {
            console.error("Error adding exception:", error);
            const message = error.response?.data?.message || error.message || "Could not add exception. Please try again.";
            setAddError(message);
      } finally {
            setIsSubmitting(false);
      }
  };

  // --- Render Logic ---
   if (loadingSchedule) {
        return (
        <div className="flex justify-center items-center min-h-[40vh] text-gray-500 dark:text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mr-3 text-indigo-500 dark:text-indigo-400" /> Loading Your Schedule...
        </div>
        );
    }

    if (scheduleError) {
        return (
        <div className="max-w-2xl mx-auto mt-6 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 rounded" role="alert">
            <p className="font-bold flex items-center"><AlertCircle size={18} className="mr-2"/> Error Loading Schedule</p>
            <p>{scheduleError}</p>
        </div>
        );
    }

    if (!scheduleData) {
        return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <Info size={24} className="mx-auto mb-2" />
                No schedule data found for your account.
        </div>
        );
    }


  // --- Render the Schedule View ---
  return (
    // Apply theme text color ONLY to the main container, H1, and subtitle P
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-8" style={{ color: currentTheme?.textColor || 'inherit' }}>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2" style={{ color: currentTheme?.textColor || 'inherit' }}>My Schedule</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 pb-4 mb-6" style={{ color: currentTheme?.textColor || 'inherit' }}>
        View your upcoming shifts, general availability rules, and specific exceptions.
      </p>

      {/* --- Today's Schedule Section --- */}
      <section className="mb-8 p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
         <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Today ({formatDate(new Date())})</h2>
         {/* Today's Summary Div */}
         <div className={`flex items-center p-4 rounded-md mb-4 text-sm font-medium
            ${todaysDetails.status === 'scheduled' ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700' : ''}
            ${todaysDetails.status === 'unavailable_override' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700' : ''}
            ${todaysDetails.status === 'available_override' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' : ''}
            ${todaysDetails.status === 'recurring_available' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700' : ''}
            ${todaysDetails.status === 'off' ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600' : ''}
            ${todaysDetails.status === 'loading' ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 animate-pulse' : ''}
        `}>
            {todaysDetails.status === 'scheduled' && <Briefcase className="h-5 w-5 mr-3 flex-shrink-0" />}
            {todaysDetails.status === 'unavailable_override' && <UserX className="h-5 w-5 mr-3 flex-shrink-0" />}
            {todaysDetails.status === 'available_override' && <UserCheck className="h-5 w-5 mr-3 flex-shrink-0" />}
            {todaysDetails.status === 'recurring_available' && <Repeat className="h-5 w-5 mr-3 flex-shrink-0" />}
            {todaysDetails.status === 'off' && <Info className="h-5 w-5 mr-3 flex-shrink-0" />}
            {todaysDetails.status === 'loading' && <Loader2 className="h-5 w-5 mr-3 flex-shrink-0 animate-spin" />}
            <span>{todaysDetails.summary || 'Loading status...'}</span>
        </div>
        {/* Today's Detailed Items Div */}
        {(todaysDetails.items.length > 0 || todaysDetails.status === 'off') && (
            <div className="space-y-3 border-t dark:border-gray-700 pt-4">
                 {todaysDetails.items.length > 0 && (
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Details for Today:</h3>
                 )}
                 {todaysDetails.items.map(renderTodayItem)}
                {todaysDetails.items.length === 0 && todaysDetails.status === 'off' && (
                     <p className="text-sm text-gray-600 dark:text-gray-400 italic">No schedule entries apply today.</p>
                )}
            </div>
        )}
      </section>

      {/* --- Full Schedule Sections --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recurring Availability Section */}
        <section className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
           <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              <Repeat size={18} /> Recurring Availability
          </h3>
          {(scheduleData.recurringAvailability?.length || 0) === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No general availability rules set.</p>
          ) : (
            <ul className="space-y-4">
              {scheduleData.recurringAvailability.map((rule, index) => (
                <li key={rule?._id || index} className="text-sm border-l-4 border-blue-400 dark:border-blue-500 pl-3 py-1">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{formatTimeFromHHMM(rule.startTime)} - {formatTimeFromHHMM(rule.endTime)}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                     Every {rule.interval > 1 ? `${rule.interval} ` : ''}{rule.frequency} on {
                           rule.frequency === 'weekly'
                           ? (rule.daysOfWeek || []).map(d => DAYS_OF_WEEK_SHORT[d]).join(', ')
                           : `${WEEKS_OF_MONTH_MAP[rule.weekOfMonth] || '?'} ${DAYS_OF_WEEK_SHORT[rule.dayOfWeekMonthly]}`
                     }
                  </span>
                   <span className="block text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      Active: {formatShortDate(rule.startDate)} {rule.endDate ? `to ${formatShortDate(rule.endDate)}` : 'onwards'}
                  </span>
                  {rule.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Notes: {rule.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Scheduled Shifts Section */}
        <section className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
           <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              <Briefcase size={18} /> Scheduled Shifts
           </h3>
           {(scheduleData.scheduledShifts?.length || 0) === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No shifts currently scheduled.</p>
          ) : (
            <ul className="space-y-4">
              {scheduleData.scheduledShifts.map((shift, index) => (
                <li key={shift?._id || index} className="text-sm border-l-4 border-teal-400 dark:border-teal-500 pl-3 py-1">
                   <span className="font-medium text-gray-800 dark:text-gray-100">{formatDate(shift.startTime)}</span>
                   <span className="block text-gray-700 dark:text-gray-300">{formatTimeFromDate(shift.startTime)} - {formatTimeFromDate(shift.endTime)}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                       {shift.roleOverride ? `Role: ${shift.roleOverride}` : 'Default Role'} {shift.notes ? `| Notes: ${shift.notes}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Availability Exceptions Section */}
        <section className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 space-y-4">
           <div className="flex justify-between items-center">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                  <Calendar size={18} /> Availability Exceptions
              </h3>
              {/* Add Button: Only show if form is not visible */}
              {!showAddForm && (
                 <button
                      onClick={() => { setShowAddForm(true); setAddError(null); }} // Show form, clear previous error
                      className="flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-150"
                      aria-label="Add new availability exception"
                  >
                      <PlusCircle size={16} className="mr-1" />
                      Add
                  </button>
              )}
           </div>

           {/* Add Exception Form */}
           {showAddForm && (
               <form onSubmit={handleAddExceptionSubmit} className="p-4 border border-indigo-200 dark:border-indigo-700 rounded-md bg-indigo-50 dark:bg-gray-700/30 space-y-4 transition-all duration-300 ease-out">
                   <div className="flex justify-between items-center mb-2">
                        <h4 className="text-md font-semibold text-indigo-800 dark:text-indigo-300">Add New Exception</h4>
                        <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close add form">
                            <X size={20}/>
                        </button>
                   </div>
                   {/* Date & Available Checkbox */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date <span className="text-red-500">*</span></label>
                             <input type="date" id="date" name="date" value={newException.date} onChange={handleInputChange} required
                                className="input-style" // Use a common class for input styling
                             />
                        </div>
                        <div className="flex items-end pb-1"> {/* Align checkbox vertically */}
                             <label htmlFor="isAvailable" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                <input type="checkbox" id="isAvailable" name="isAvailable" checked={newException.isAvailable} onChange={handleInputChange}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 mr-2"/>
                                Mark as Available?
                             </label>
                        </div>
                   </div>
                   {/* Conditional Time Inputs */}
                   {newException.isAvailable && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                                 <input type="time" id="startTime" name="startTime" value={newException.startTime} onChange={handleInputChange}
                                     className="input-style" // Use common class
                                      />
                             </div>
                              <div>
                                 <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                                 <input type="time" id="endTime" name="endTime" value={newException.endTime} onChange={handleInputChange}
                                     className="input-style" // Use common class
                                     />
                             </div>
                        </div>
                   )}
                   {/* Reason */}
                   <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason <span className="text-red-500">*</span></label>
                        <input type="text" id="reason" name="reason" value={newException.reason} onChange={handleInputChange} required placeholder={newException.isAvailable ? 'e.g., Personal Appointment' : 'e.g., Doctor Visit'}
                            className="input-style" // Use common class
                            />
                   </div>
                   {/* Notes */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea id="notes" name="notes" value={newException.notes} onChange={handleInputChange} rows="2" placeholder="Optional details"
                            className="input-style" // Use common class
                             />
                   </div>
                   {/* Error Display */}
                   {addError && (
                       <p className="text-sm text-red-600 dark:text-red-400" role="alert">{addError}</p>
                   )}
                   {/* Submit Button */}
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSubmitting}
                            className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 dark:focus:ring-offset-gray-800 transition-colors duration-150">
                             {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save size={16} className="mr-2" />}
                             {isSubmitting ? 'Saving...' : 'Save Exception'}
                         </button>
                     </div>
               </form>
           )}

           {/* Existing List Rendering */}
           {(scheduleData.availabilityOverrides?.length || 0) === 0 && !showAddForm ? ( // Only show if no items AND form isn't shown
             <p className="text-sm text-gray-500 dark:text-gray-400 italic pt-4">
                 You haven't added any availability exceptions yet.
             </p>
          ) : (
            // Conditionally add padding if the form isn't showing, otherwise form provides space
            <ul className={`space-y-4 ${!showAddForm ? 'pt-4' : ''}`}>
              {scheduleData.availabilityOverrides.map((ov) => (
                <li key={ov?._id} className={`text-sm border-l-4 pl-3 py-1 ${ov.isAvailable ? 'border-green-400 dark:border-green-500' : 'border-red-400 dark:border-red-500'}`}>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{formatDate(ov.date)}:</span>
                    <strong className={`ml-1 font-semibold ${ov.isAvailable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {ov.isAvailable ? 'Available' : 'Unavailable'}
                        {ov.isAvailable && (ov.startTime || ov.endTime) && <span className="font-normal text-xs"> ({formatTimeFromHHMM(ov.startTime)} - {formatTimeFromHHMM(ov.endTime)})</span>}
                    </strong>
                   <span className="block text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                       Reason: {ov.reason || 'N/A'} {ov.notes ? `| Notes: ${ov.notes}` : ''}
                   </span>
                   {/* No Edit or Delete buttons */}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Add a shared style for inputs (optional) */}
      <style jsx global>{`
        .input-style {
            margin-top: 0.25rem; /* mt-1 */
            display: block;
            width: 100%;
            padding-left: 0.75rem; /* px-3 */
            padding-right: 0.75rem; /* px-3 */
            padding-top: 0.5rem; /* py-2 */
            padding-bottom: 0.5rem; /* py-2 */
            border-width: 1px;
            border-color: #D1D5DB; /* border-gray-300 */
            border-radius: 0.375rem; /* rounded-md */
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
            font-size: 0.875rem; /* sm:text-sm */
            background-color: #ffffff; /* bg-white */
            color: #111827; /* text-gray-900 */
        }
        .dark .input-style {
             border-color: #4B5563; /* dark:border-gray-600 */
             background-color: #374151; /* dark:bg-gray-700 */
             color: #F9FAFB; /* dark:text-gray-100 */
        }
        .input-style:focus {
             outline: 2px solid transparent;
             outline-offset: 2px;
             --tw-ring-offset-width: 0px; /* Adjust if needed */
             --tw-ring-offset-color: #fff; /* Adjust dark mode if needed */
             --tw-ring-color: #6366F1; /* focus:ring-indigo-500 */
             box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
             border-color: #6366F1; /* focus:border-indigo-500 */
             --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
         }
      `}</style>
    </div>
  );
};

export default StaffScheduleView;