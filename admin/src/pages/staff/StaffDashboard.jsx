// src/pages/staff/StaffDashboard.jsx

import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { StaffContext } from '../../context/StaffContext'; // Use StaffContext exclusively
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

// Importing Lucide icons for schedule section to match Calendar.jsx
import { Calendar as CalendarIconLucide, Users, Clock as ClockIconLucide, MapPin, Briefcase as BriefcaseIconLucide, Repeat, UserCheck, UserX, Loader2 as Loader2IconLucide, AlertCircle as AlertCircleIconLucide, Info as InfoIconLucide } from 'lucide-react';


import {
    FaUserCircle,
    FaCalendarAlt,
    FaClinicMedical,
    FaFileMedicalAlt,
    FaSignOutAlt,
    FaSpinner, // Using FaSpinner for loading
    FaExclamationTriangle, // For errors
    FaArrowRight
} from 'react-icons/fa';


// --- Helper Functions (Copied from Calendar.jsx, ensure these match exactly) ---

const isValidDate = (date) => date instanceof Date && !isNaN(date);

const formatTimeFromDate = (dateStrOrObj) => {
    if (!dateStrOrObj) return '';
    try {
        const dateObj = (dateStrOrObj instanceof Date) ? dateStrOrObj : new Date(dateStrOrObj);
        if (!isValidDate(dateObj)) {
            return 'Invalid Time';
        }
        // Use options compatible with different locales but ensure hour12
        return dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (error) {
        console.error("Error in formatTimeFromDate:", dateStrOrObj, error);
        return 'Time Error';
    }
};

const formatTimeFromHHMM = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') {
         return '';
    }
    const trimmedTimeStr = timeStr.trim();
     try {
         const [hourStr, minuteStr] = trimmedTimeStr.split(':');
         const hour = parseInt(hourStr, 10);
         const minute = parseInt(minuteStr, 10);

         if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
             console.warn("formatTimeFromHHMM failed parsing numbers:", timeStr);
             return 'Invalid Time';
         }

         // Use a dummy date, only time matters for formatting
         const dateObj = new Date();
         dateObj.setHours(hour, minute, 0, 0);

         if (!isValidDate(dateObj)) {
              console.warn("formatTimeFromHHMM produced invalid date object:", timeStr);
              return 'Invalid Time';
         }

         return dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
     } catch (error) {
         console.error("Error in formatTimeFromHHMM:", timeStr, error);
         return 'Time Error';
     }
};

// Check if a specific date falls within a recurring rule's basic date range
const isDateInRange = (checkDate, rule) => {
    if (!rule || !rule.startDate) return false; // Must have a start date
    const checkTime = checkDate.getTime();
    const ruleStart = new Date(rule.startDate);
    ruleStart.setHours(0, 0, 0, 0); // Compare start of day
    const startTime = ruleStart.getTime();
    if (isNaN(startTime) || !isValidDate(ruleStart)) return false; // Invalid start date
    if (checkTime < startTime) return false; // Date is before the start date

    if (rule.endDate) {
        const ruleEnd = new Date(rule.endDate);
        ruleEnd.setHours(23, 59, 59, 999); // Compare end of day
        const endTime = ruleEnd.getTime();
        // Check if ruleEnd is a valid date before comparison
        if (isNaN(endTime) || !isValidDate(ruleEnd)) {
             console.warn("Invalid endDate provided in recurring rule:", rule.endDate);
             // If endDate is provided but invalid, consider the date outside the range for safety?
             // Or maybe ignore invalid endDate? Let's return false for safety.
             return false;
        }
        if (checkTime > endTime) return false; // Date is after the end date
    }
    return true; // Date is within the valid range
};

// Check if a recurring rule applies on a specific date based on frequency, day, and week
const doesRecurringRuleApplyOnDate = (rule, checkDate) => {
    // Ensure checkDate is start of day for consistent comparison
    const checkDateStartOfDay = new Date(checkDate);
    checkDateStartOfDay.setHours(0, 0, 0, 0);

    if (!rule || !rule.frequency || !isDateInRange(checkDateStartOfDay, rule)) return false; // Rule must be valid and date must be in range
    if (rule.frequency === 'weekly' && (!Array.isArray(rule.daysOfWeek) || rule.daysOfWeek.length === 0)) return false; // Weekly requires days
    if (rule.frequency === 'monthly' && (typeof rule.dayOfWeekMonthly !== 'number' || typeof rule.weekOfMonth !== 'number')) return false; // Monthly requires day/week params

    const dayOfWeek = checkDateStartOfDay.getDay(); // 0 for Sunday, 6 for Saturday
    const dateOfMonth = checkDateStartOfDay.getDate();
    const year = checkDateStartOfDay.getFullYear();
    const month = checkDateStartOfDay.getMonth();


    if (rule.frequency === 'daily') {
         return true; // Applies every day in range
    } else if (rule.frequency === 'weekly') {
        // Ensure rule.daysOfWeek is an array before using includes
        if (!Array.isArray(rule.daysOfWeek)) return false;
        // Check if the checkDate's day of the week is in the rule's allowed days
        return rule.daysOfWeek.includes(dayOfWeek);
    } else if (rule.frequency === 'monthly') {
        // Check if the checkDate's day of the week matches the rule's day
        if (rule.dayOfWeekMonthly !== dayOfWeek) return false;

        const firstDayOfMonth = new Date(year, month, 1);
        const firstWeekdayOfMonth = firstDayOfMonth.getDay(); // 0 for Sunday etc.
        let targetDate = -1;

        // Calculate the date of the Nth occurrence of a specific day of the week in the month
        if (rule.weekOfMonth === 5 || rule.weekOfMonth === -1) { // 'Last' week
             const lastDayOfMonth = new Date(year, month + 1, 0); // Last day of the current month (day 0 of next month)
             const lastWeekdayOfMonth = lastDayOfMonth.getDay();
             // Calculate the date of the *last* occurrence of rule.dayOfWeekMonthly in the month
             targetDate = lastDayOfMonth.getDate() - (lastWeekdayOfMonth - rule.dayOfWeekMonthly + 7) % 7;
        } else if (rule.weekOfMonth >= 1 && rule.weekOfMonth <= 4) { // 1st, 2nd, 3rd, 4th week
            // Calculate the date of the first occurrence of rule.dayOfWeekMonthly in the month
            let dateOfFirstOccurrence = 1 + (rule.dayOfWeekMonthly - firstWeekdayOfMonth + 7) % 7;
            // Calculate the date of the Nth occurrence (1st + (N-1)*7)
             targetDate = dateOfFirstOccurrence + (rule.weekOfMonth - 1) * 7;
        } else {
             return false; // Invalid weekOfMonth value
        }

        // Validate the calculated date is actually in the correct month and is the correct day of the week
        const calculatedDateObj = new Date(year, month, targetDate);
         if (!isValidDate(calculatedDateObj) || calculatedDateObj.getMonth() !== month || calculatedDateObj.getDate() !== targetDate || calculatedDateObj.getDay() !== rule.dayOfWeekMonthly) {
             // This extra check helps catch edge cases where calculatedDate might spill into next month
             console.warn(`Calculated monthly date ${targetDate} for ${year}-${month + 1} was invalid or wrong dayOfWeek`);
             return false;
         }

        // Check if the checkDate's date of month matches the calculated target date
        return dateOfMonth === targetDate;
    }
    return false; // Unknown or unsupported frequency
};

// --- Enhanced Dashboard Card Component (No changes requested to props/structure) ---
const DashboardCard = ({
    title,
    value,
    description, // Optional description
    icon,
    bgColor = 'bg-white', // Default to white for a cleaner look
    textColor = 'text-gray-800',
    iconBgColor = 'bg-indigo-100',
    iconColor = 'text-indigo-600',
    linkTo,
    linkText = "View Details",
    className = '' // Allow passing extra classes
}) => (
    // Explicitly setting background and text colors to ensure consistency, especially with dark mode
    <div className={`rounded-lg shadow-md p-6 flex flex-col justify-between transition-shadow hover:shadow-lg ${bgColor} ${textColor} ${className}`}>
        <div>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-full ${iconBgColor} ${iconColor}`}>
                    {/* Ensure icon is a valid React element before cloning */}
                    {icon && React.isValidElement(icon) ? React.cloneElement(icon, { size: 24 }) : null}
                </div>
                {/* Optional: If value is needed */}
                {value && <p className="text-2xl font-bold">{value}</p>}
            </div>
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>} {/* Added dark mode */}
        </div>
        {linkTo && (
            <Link
                to={linkTo}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center group" // Added dark mode
            >
                {linkText}
                <FaArrowRight className="ml-1.5 h-4 w-4 transition-transform transform group-hover:translate-x-1" />
            </Link>
        )}
    </div>
);

// --- Loading State Component (No changes requested) ---
const LoadingState = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 dark:text-gray-400"> {/* Added dark mode */}
        <FaSpinner className="animate-spin text-4xl mb-4 text-indigo-500 dark:text-indigo-400" /> {/* Added dark mode */}
        <p className="text-lg">Loading Dashboard...</p>
    </div>
);

// --- Error State Component (No changes requested) ---
const ErrorState = ({ error, onRetry, onLogout }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 text-gray-800 dark:text-gray-200"> {/* Added dark mode */}
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Oops! Something went wrong.</h2> {/* Added dark mode */}
        <p className="text-gray-600 dark:text-gray-400 bg-red-100 dark:bg-red-900/30 p-3 rounded border border-red-300 dark:border-red-600 max-w-md mb-6">{error || "An unexpected error occurred."}</p> {/* Added dark mode */}
        <div className="flex space-x-4">
            {/* Conditionally show retry if function provided */}
            {onRetry && (
                 <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150 dark:bg-blue-700 dark:hover:bg-blue-600" // Added dark mode
                >
                    Retry
                </button>
            )}
            <button
                onClick={onLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-150 dark:bg-gray-700 dark:hover:bg-gray-600" // Added dark mode
            >
                Go to Login
            </button>
        </div>
    </div>
);


// --- Main Staff Dashboard Component ---
const StaffDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);

    // New state for Today's Schedule
    const [todayScheduleEvents, setTodayScheduleEvents] = useState([]);
    const [loadingTodaySchedule, setLoadingTodaySchedule] = useState(true);
    const [todayScheduleError, setTodayScheduleError] = useState(null);


    const { staffToken, setStaffToken, backendUrl } = useContext(StaffContext);
    const navigate = useNavigate();

    // Function to fetch profile data (callable for retry)
    const fetchProfile = async () => {
        setLoadingProfile(true);
        setProfileError(null); // Clear previous errors

        // Check token early, only redirect if explicitly missing
        if (staffToken === null || staffToken === undefined || staffToken === '') {
            console.log("%cStaffDashboard: No staffToken or empty. Redirecting.", "color: orange;");
            setLoadingProfile(false);
            navigate('/login'); // Redirect only if token is clearly missing
            return;
        }

        if (!backendUrl) {
            console.error("%cStaffDashboard Error: Backend URL missing.", "color: red;");
            setProfileError("Configuration error: Backend URL not found.");
            toast.error("Application configuration error.");
            setLoadingProfile(false);
            return;
        }

        const profileUrl = `${backendUrl}/api/staff/profile`;
        console.log(`%cStaffDashboard: Fetching profile: ${profileUrl}`, "color: blue;");

        try {
            const response = await axios.get(profileUrl, {
                headers: { 'Authorization': `Bearer ${staffToken}` }
            });

            if (response.data?.success && response.data?.profile) {
                console.log("%cStaffDashboard: Profile received:", "color: green;", response.data.profile);
                setProfile(response.data.profile);
            } else {
                // Backend indicated success but data is missing or malformed
                 console.warn("Fetch profile success but data missing or malformed:", response.data);
                 throw new Error(response.data?.message || 'Failed to process profile data.');
             }
        } catch (err) {
            console.error("%c!!! StaffDashboard: Error fetching profile:", "color: red; font-weight: bold;", err);
            const message = err.response?.data?.message || err.message || "An error occurred while loading your profile.";
            setProfileError(message);

            // Handle authentication errors specifically
            if (err.response?.status === 401 || err.response?.status === 403) {
                console.log("%cStaffDashboard: Auth error (401/403) during profile fetch. Clearing token & redirecting.", "color: orange;");
                toast.warn("Session expired. Please log in again.", { autoClose: 4000 });
                setStaffToken(null); // Clear context token
                navigate('/login'); // Redirect
            } else {
                // Only show toast for other types of errors if token was present
                 if (staffToken) { // Check token again in case it was cleared concurrently
                     toast.error(message);
                 }
            }
        } finally {
            setLoadingProfile(false);
        }
    };

     // Function to fetch *all* schedule data and filter for today
    const fetchAndFilterTodaySchedule = async () => {
        setLoadingTodaySchedule(true);
        setTodayScheduleError(null);
        setTodayScheduleEvents([]); // Clear previous data

         if (!staffToken) {
             // If profile fetch already redirected, schedule fetch doesn't need to.
             // Just stop loading the schedule if token is null.
            console.warn("StaffDashboard: No staffToken available for schedule fetch.");
            setTodayScheduleError("Authentication token missing for schedule.");
            setLoadingTodaySchedule(false);
            return;
        }

        if (!backendUrl) {
            console.error("%cStaffDashboard Error: Backend URL missing for schedule fetch.", "color: red;");
            setTodayScheduleError("Configuration error: Backend URL not found for schedule.");
            // Avoiding toast here as fetchProfile likely handles the URL error toast
            setLoadingTodaySchedule(false);
            return;
        }


        const scheduleUrl = `${backendUrl}/api/staff/schedule/me`;
        console.log(`%cStaffDashboard: Fetching schedule: ${scheduleUrl}`, "color: blue;");

        try {
            const response = await axios.get(scheduleUrl, {
                headers: { Authorization: `Bearer ${staffToken}` },
            });

            if (response.data?.success && response.data?.schedule) {
                const schedule = response.data.schedule;
                // Ensure data is array, default to empty array if not
                const shifts = Array.isArray(schedule.scheduledShifts) ? schedule.scheduledShifts : [];
                const overrides = Array.isArray(schedule.availabilityOverrides) ? schedule.availabilityOverrides : [];
                const recurring = Array.isArray(schedule.recurringAvailability) ? schedule.recurringAvailability : [];

                const today = new Date();
                // Normalize today's date to start of day for accurate comparison
                const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                todayStartOfDay.setHours(0, 0, 0, 0);

                const todayEvents = [];

                // Filter shifts for today
                shifts.forEach(shift => {
                    // Basic validation for shift data
                    if (!shift?._id || !shift?.startTime || !shift?.endTime) {
                         console.warn("Skipping invalid shift entry:", shift);
                        return; // Skip invalid entries
                    }
                    const shiftStartDate = new Date(shift.startTime);
                    const shiftEndDate = new Date(shift.endTime);

                    // Normalize shift dates to start of day for comparison
                    const shiftStartDateOnly = new Date(shiftStartDate.getFullYear(), shiftStartDate.getMonth(), shiftStartDate.getDate());
                    shiftStartDateOnly.setHours(0, 0, 0, 0);
                    const shiftEndDateOnly = new Date(shiftEndDate.getFullYear(), shiftEndDate.getMonth(), shiftEndDate.getDate());
                    shiftEndDateOnly.setHours(0, 0, 0, 0);


                     // Include shifts that *span* today or start/end today
                     // A shift is relevant today if its start day <= today AND its end day >= today
                     const startsOnOrBeforeToday = isValidDate(shiftStartDateOnly) && shiftStartDateOnly.getTime() <= todayStartOfDay.getTime();
                     const endsOnOrAfterToday = isValidDate(shiftEndDateOnly) && shiftEndDateOnly.getTime() >= todayStartOfDay.getTime();


                    if (startsOnOrBeforeToday && endsOnOrAfterToday) {

                        // Display the relevant time range *for today* or the full shift range
                        // For simplicity on the dashboard, let's show the full shift range for now.
                        // A more complex calendar might show "Starts today", "Ends today", "Continues"
                        const timeDisplay = `${formatTimeFromDate(shift.startTime)} - ${formatTimeFromDate(shift.endTime)}`;
                        const dateDisplay = isValidDate(shiftStartDate) && isValidDate(shiftEndDate) &&
                                            shiftStartDateOnly.getTime() !== shiftEndDateOnly.getTime()
                                            ? ` (${shiftStartDateOnly.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${shiftEndDateOnly.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})})`
                                            : ''; // Show date span for multi-day shifts


                        todayEvents.push({
                            _id: shift._id, type: 'shift', date: shift.startTime, // Use start time for initial sorting basis
                            fullTitle: `Shift: ${timeDisplay}${dateDisplay}` + (shift.roleOverride ? ` (${shift.roleOverride})` : ''),
                            time: timeDisplay,
                            originalData: shift // Keep original data for more details if needed
                        });
                    }
                });

                // Filter overrides for today
                overrides.forEach(ov => {
                     // Basic validation for override data
                    if (!ov?._id || !ov?.date || typeof ov.isAvailable !== 'boolean') {
                         console.warn("Skipping invalid override entry:", ov);
                        return; // Skip invalid entries
                    }
                    const overrideDate = new Date(ov.date);
                    // Normalize override date to start of day
                    const overrideDateOnly = new Date(overrideDate.getFullYear(), overrideDate.getMonth(), overrideDate.getDate());
                    overrideDateOnly.setHours(0, 0, 0, 0);

                    if (isValidDate(overrideDateOnly) && overrideDateOnly.getTime() === todayStartOfDay.getTime()) {
                         const overrideTitle = ov.isAvailable ? 'Available Exception' : 'Unavailable Exception';
                         // Only show time range if it's an available exception or if times are explicitly provided
                         const hasTimes = ov.startTime || ov.endTime;
                         const overrideTimeRange = (ov.isAvailable && hasTimes) // Show time range for Available exceptions with times
                                               ? `${formatTimeFromHHMM(ov.startTime || '')} - ${formatTimeFromHHMM(ov.endTime || '')}`
                                                : (!ov.isAvailable && hasTimes) // If unavailable, but times provided, show them
                                               ? `${formatTimeFromHHMM(ov.startTime || '')} - ${formatTimeFromHHMM(ov.endTime || '')}`
                                                : (!ov.isAvailable && !hasTimes) // If unavailable with no times, imply all day
                                                ? `All Day` : '';


                         const fullTitle = `${overrideTitle}${overrideTimeRange ? `: ${overrideTimeRange}` : ''}` + (ov.reason ? ` (${ov.reason})` : ''); // Add reason
                        todayEvents.push({
                            _id: ov._id, type: 'availability_override', isAvailable: ov.isAvailable, date: ov.date, // Use override date
                            fullTitle: fullTitle, time: overrideTimeRange, originalData: ov
                        });
                    }
                });

                 // Add recurring rules that apply today
                 recurring.forEach(rule => {
                     // Basic validation for recurring rule data
                     if (!rule?._id || typeof rule.isAvailable !== 'boolean') {
                          console.warn("Skipping invalid recurring rule entry:", rule);
                         return; // Skip invalid entries
                     }
                     // Only include 'available' recurring rules on the dashboard overview for clarity
                    if (rule.isAvailable === false) return;

                    if (doesRecurringRuleApplyOnDate(rule, todayStartOfDay)) {
                        const timeRange = `${formatTimeFromHHMM(rule.startTime || '')} - ${formatTimeFromHHMM(rule.endTime || '')}`;
                         // Add frequency/details to recurring notes if helpful? E.g. (Weekly on Mon)
                        const fullTitle = `General Availability: ${timeRange}` + (rule.notes ? ` (${rule.notes})` : '');
                       todayEvents.push({
                           // Generate a unique ID for recurring entries for today
                           _id: `recurring-${todayStartOfDay.toISOString().split('T')[0]}-${rule._id || 'gen'}-${(rule.startTime || '00:00').replace(/[^0-9]/g,'')}`, // More robust ID
                           type: 'recurring_availability', date: todayStartOfDay.toISOString(), // Use start of day for date
                           fullTitle: fullTitle, time: timeRange, originalData: rule
                       });
                    }
                });

                // Sort today's entries by time
                todayEvents.sort((a, b) => {
                    // Define a helper to parse time strings (HH:MM or HH:MM:SS) into minutes for comparison
                    const parseTimeToMinutes = (timeStr) => {
                        if (!timeStr || typeof timeStr !== 'string') return -1; // Indicate invalid time
                        const parts = timeStr.split(':').map(Number);
                        if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1;
                        return parts[0] * 60 + parts[1];
                    };

                    const timeA_minutes = parseTimeToMinutes(a?.originalData?.startTime || a?.originalData?.time);
                    const timeB_minutes = parseTimeToMinutes(b?.originalData?.startTime || b?.originalData?.time);

                     // Sort invalid times (which return -1) towards the beginning or end. Let's put them last.
                    if (timeA_minutes === -1 && timeB_minutes === -1) return 0;
                    if (timeA_minutes === -1) return 1; // a goes after b
                    if (timeB_minutes === -1) return -1; // a goes before b

                    return timeA_minutes - timeB_minutes; // Compare in minutes

                });


                console.log("%cStaffDashboard: Today's events:", "color: green;", todayEvents);
                setTodayScheduleEvents(todayEvents);

            } else {
                 console.warn("Fetch schedule success but data missing or malformed:", response.data);
                 setTodayScheduleError(response.data.message || "Schedule data not found in response or is invalid.");
                 setTodayScheduleEvents([]);
             }
        } catch (err) {
            console.error("%c!!! StaffDashboard: Error fetching schedule:", "color: red; font-weight: bold;", err);
             const message = err.response?.data?.message || err.message || "An error occurred while loading today's schedule.";
             setTodayScheduleError(message);
             setTodayScheduleEvents([]);

             // Do not redirect for schedule errors unless it's an auth error (401/403)
             if (err.response?.status === 401 || err.response?.status === 403) {
                console.log("%cStaffDashboard: Auth error (401/403) during schedule fetch. Clearing token & redirecting.", "color: orange;");
                // The profile fetch useEffect will likely handle the token clear and redirect
                // Add a toast for immediate user feedback
                toast.warn("Session expired. Please log in again.", { autoClose: 4000 });
             } else {
                 // Only show toast for other errors if a token was present during the attempt
                 if (staffToken) {
                     toast.error(message);
                 }
             }

        } finally {
            setLoadingTodaySchedule(false);
        }
    };


    // Effect to fetch profile on mount and staffToken/backendUrl change
    useEffect(() => {
        fetchProfile();
        // Dependencies: staffToken, backendUrl
        // navigate and setStaffToken are used *inside* fetchProfile, but don't need to trigger the effect themselves
        // if staffToken changes, the effect *will* re-run.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [staffToken, backendUrl]);

    // Effect to fetch schedule on mount and staffToken/backendUrl change
     useEffect(() => {
         fetchAndFilterTodaySchedule();
         // Dependencies: staffToken, backendUrl
         // navigate and setStaffToken are used *inside* fetchAndFilterTodaySchedule, but don't need to trigger the effect themselves
         // if staffToken changes, the effect *will* re-run.
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [staffToken, backendUrl]);


    // Logout Handler
    const handleLogout = () => {
        console.log("%cStaffDashboard: handleLogout called.", "color: blue;");
        setStaffToken(null); // Clear the token in context
        // If you store token in localStorage, clear it here too:
        // localStorage.removeItem('staffToken');
        toast.success("Logged out successfully.");
        navigate('/login'); // Redirect to login page
    };


    // Get correct icon for schedule events
    const getScheduleEventIcon = (type, isAvailableOverride = false) => {
         const size = 16; // Slightly larger icon for the list
         const className = "inline mr-2 text-gray-500 dark:text-gray-400 shrink-0"; // Neutral color, Added dark mode
         switch (type) {
            case 'shift': return <BriefcaseIconLucide size={size} className={className} />;
            case 'availability_override': return isAvailableOverride ? <UserCheck size={size} className={className} /> : <UserX size={size} className={className} />;
            case 'recurring_availability': return <Repeat size={size} className={className} />;
            default: return null; // Should not happen if types are controlled
         }
    };


    // Get text color class for schedule event type
     const getScheduleEventTypeColorClass = (type, isAvailableOverride = false) => {
         switch (type) {
            case 'shift': return 'text-teal-700 dark:text-teal-300'; // Added dark mode
            case 'availability_override': return isAvailableOverride ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'; // Added dark mode
            case 'recurring_availability': return 'text-blue-700 dark:text-blue-300'; // Added dark mode
            default: return 'text-gray-700 dark:text-gray-300'; // Added dark mode
        }
    };


    // --- Render Logic ---

    // Show main loading state if profile is loading initially
    if (loadingProfile && !profile) {
        console.log("StaffDashboard: Rendering Loading State.");
        // Show loading spinner for the entire page content area
        return <LoadingState />;
    }

    // If a profile error occurred and no profile data exists
    // This is a critical error requiring login or retry of profile fetch
    if (profileError && !profile) {
        console.log(`StaffDashboard: Rendering Error State - "${profileError}"`);
        // Use the common ErrorState component for the main dashboard error
        return <ErrorState error={profileError} onRetry={fetchProfile} onLogout={handleLogout} />;
    }

     // If loading finished, no *profile* error, but profile is still null (should be very rare)
     // This case is mostly handled by the token check and redirect at the start of fetchProfile,
     // but keep a fallback just in case the logic fails unexpectedly.
    if (!profile && !loadingProfile && !profileError) {
         console.log("StaffDashboard: Rendering 'No profile data' fallback (after loading, no error).");
         return (
             <div className="container mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400 min-h-[60vh] flex flex-col justify-center items-center"> {/* Added dark mode */}
                 <FaExclamationTriangle className="text-4xl text-yellow-500 dark:text-yellow-400 mx-auto mb-4" /> {/* Added dark mode */}
                 <p className="mb-4">Could not load profile data. Please try logging in again.</p>
                 <button
                     onClick={handleLogout}
                     className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition dark:bg-indigo-700 dark:hover:bg-indigo-600" // Added dark mode
                 >
                     Go to Login
                 </button>
             </div>
         );
     }

    // --- Main Dashboard Content (Renders once profile is successfully loaded) ---
    console.log("StaffDashboard: Rendering main dashboard content with profile.");
    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200"> {/* Added dark mode classes */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">Welcome back, {profile.name || 'Staff Member'}!</h1> {/* Added dark mode */}
                        <p className="text-gray-600 dark:text-gray-400"> {/* Added dark mode */}
                            Role: <span className="font-semibold capitalize text-indigo-700 dark:text-indigo-400">{profile.role || 'N/A'}</span> | VID: <span className="font-semibold text-indigo-700 dark:text-indigo-400">{profile.vid || 'N/A'}</span> {/* Added dark mode */}
                        </p>
                    </div>
                    {/* Logout Button in Header */}
                    <button
                         onClick={handleLogout}
                         className="mt-4 sm:mt-0 flex items-center text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition" // Added dark mode
                    >
                        <FaSignOutAlt className="mr-1.5 h-4 w-4" /> Log Out
                    </button>
                </header>

                {/* Dashboard Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"> {/* Added mb-8 */}
                    {/* Profile Card */}
                    <DashboardCard
                        title="My Profile"
                        description="View and update your personal details."
                        icon={<FaUserCircle />}
                        linkTo="/profile" // Ensure this route exists in your Router setup
                        linkText="Manage Profile"
                        iconBgColor="bg-blue-100 dark:bg-blue-900/30" // Added dark mode
                        iconColor="text-blue-600 dark:text-blue-400" // Added dark mode
                        className="border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" // Added dark mode and explicit bg/text
                    />

                    {/* Schedule Card (Conditional) */}
                    {/* FIX: Removed extra '(' before the comment */}
                    {(profile.role === 'nurse' || profile.role === 'technician' || profile.role === 'receptionist') && (
                        <DashboardCard
                            title="My Schedule"
                            description="Check your upcoming shifts and appointments."
                            icon={<FaCalendarAlt />}
                            linkTo="/schedule" // Link to the full calendar page
                            linkText="View Full Schedule"
                            iconBgColor="bg-green-100 dark:bg-green-900/30" // Added dark mode
                            iconColor="text-green-600 dark:text-green-400" // Added dark mode
                             className="border border-green-200 dark:border-green-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" // Added dark mode and explicit bg/text
                        />
                    )}

                    {/* Patient Lookup Card (Conditional) */}
                    {(profile.role === 'receptionist' || profile.role === 'nurse') && (
                         <DashboardCard
                            title="Patient Lookup"
                            description="Find patient records and information."
                            icon={<FaFileMedicalAlt />}
                            linkTo="/patientList" // Ensure this route exists
                            linkText="Search Patients"
                            iconBgColor="bg-yellow-100 dark:bg-yellow-900/30" // Added dark mode
                            iconColor="text-yellow-600 dark:text-yellow-400" // Added dark mode
                             className="border border-yellow-200 dark:border-yellow-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" // Added dark mode and explicit bg/text
                        />
                    )}

                    {/* Department Info Card */}
                    <DashboardCard
                        title="Department Info"
                        // Providing more dynamic info based on role
                        value={profile.role === 'nurse' ? "Nursing Wing" : (profile.role === 'receptionist' ? "Front Desk" : "General Staff")}
                        description="Information related to your primary department."
                        icon={<FaClinicMedical />}
                        // Assuming this is a valid link, maybe change to something generic if not
                        // linkTo="/Nurse/Home" is specific, consider if this should be conditional or generic
                        // If it's always for the nurse role or a default staff department, keep it.
                        // If it should link to a department page based on the user's *actual* department,
                        // you'd need profile.department and a different link structure.
                        linkTo="/Nurse/Home" // Keep the link as is per original request
                        iconBgColor="bg-purple-100 dark:bg-purple-900/30" // Added dark mode
                        iconColor="text-purple-600 dark:text-purple-400" // Added dark mode
                        className="border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" // Added dark mode and explicit bg/text
                        linkText="Go to Department Page" // Added a link text
                    />

                     {/* Add more cards as needed */}
                </div>

                {/* --- Today's Schedule Section --- */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700"> {/* Added dark mode and explicit bg/text */}
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center"> {/* Added dark mode */}
                        <CalendarIconLucide size={24} className="mr-3 text-indigo-600 dark:text-indigo-400" /> Today's Schedule
                    </h2>

                    {loadingTodaySchedule ? (
                         <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400"> {/* Added dark mode */}
                            <Loader2IconLucide className="h-6 w-6 animate-spin mr-2" /> Loading today's schedule...
                        </div>
                    ) : todayScheduleError ? (
                        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 p-4 rounded" role="alert"> {/* Added dark mode */}
                            <p className="font-bold flex items-center"><AlertCircleIconLucide size={18} className="mr-2"/> Error Loading Schedule</p> {/* Added Icon */}
                            <p className="text-sm">{todayScheduleError}</p>
                            {/* Optional: Add a retry button for schedule load */}
                             <button
                                 onClick={fetchAndFilterTodaySchedule}
                                 className="mt-3 text-sm px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700 transition" // Added dark mode
                             >
                                 Retry Loading Schedule
                             </button>
                        </div>
                    ) : todayScheduleEvents.length > 0 ? (
                        <ul className="space-y-3">
                            {todayScheduleEvents.map(event => (
                                <li key={event._id} className="flex items-start p-3 rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"> {/* Added dark mode and neutral background */}
                                    {getScheduleEventIcon(event.type, event.isAvailable)}
                                    <div className="flex-grow">
                                        <p className={`text-sm font-medium ${getScheduleEventTypeColorClass(event.type, event.isAvailable)}`}> {/* Added color class */}
                                             {event.type === 'shift' ? 'Shift' :
                                              event.type === 'availability_override' ? (event.isAvailable ? 'Available Exception' : 'Unavailable Exception') :
                                              event.type === 'recurring_availability' ? 'General Availability' :
                                              'Event'}
                                        </p>
                                        <p className="text-gray-800 dark:text-gray-200">{event.fullTitle || event.title || 'No Title'}</p> {/* Added dark mode */}
                                        {/* Optional: Display more details if needed */}
                                        {/* {event.originalData?.notes && <p className="text-xs italic text-gray-500 dark:text-gray-400">Notes: {event.originalData.notes}</p>} */} {/* Added dark mode */}
                                        {/* {event.originalData?.location && <p className="text-xs text-gray-500 dark:text-gray-400">Location: {event.originalData.location}</p>} */} {/* Added dark mode */}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400"> {/* Added dark mode */}
                             <CalendarIconLucide className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" /> {/* Added dark mode */}
                            <p>No schedule entries found for today.</p>
                        </div>
                    )}
                </div>


                {/* Optional: Footer or additional sections */}
                 {/* <footer className="mt-12 text-center text-gray-500 text-sm">
                    Hospital Management System © {new Date().getFullYear()}
                </footer> */}

            </div>
        </div>
    );
};

export default StaffDashboard;