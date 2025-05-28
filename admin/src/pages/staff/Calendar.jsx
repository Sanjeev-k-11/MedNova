// src/pages/Calendar.jsx (or wherever you place it)

import React, { useState, useEffect, useContext, useMemo } from 'react';
import HeroSection from '../../components/HeroSection';
// Corrected Import based on previous error
import { Calendar as CalendarIcon, Users, Clock, MapPin, Briefcase, Repeat, UserCheck, UserX, Loader2, AlertCircle, Info } from 'lucide-react';
import { StaffContext } from '../../context/StaffContext'; // Adjust path
import { useTheme } from '../../context/ThemeContext'; // Adjust path
import axios from 'axios';
import Navbar from '../../components/DNavbar';

// --- Constants ---
const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKS_OF_MONTH_MAP = { 1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth', 5: 'Last', [-1]: 'Last' }; // Include -1 for 'Last'

// --- Helper Functions (Ensure consistency and robustness) ---

const isValidDate = (date) => date instanceof Date && !isNaN(date);

const formatDate = (dateStrOrObj) => {
    if (!dateStrOrObj) return 'N/A';
    try {
        const dateObj = (dateStrOrObj instanceof Date) ? dateStrOrObj : new Date(dateStrOrObj);
        if (!isValidDate(dateObj)) return 'Invalid Date';
        return dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", dateStrOrObj, e);
        return 'Invalid Date';
    }
};

const formatShortDate = (dateStrOrObj) => {
    if (!dateStrOrObj) return 'N/A';
     try {
        const dateObj = (dateStrOrObj instanceof Date) ? dateStrOrObj : new Date(dateStrOrObj);
         if (!isValidDate(dateObj)) return 'Invalid Date';
        return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
        console.error("Error formatting short date:", dateStrOrObj, e);
        return 'Invalid Date';
    }
};

const formatTimeFromDate = (dateStrOrObj) => {
    if (!dateStrOrObj) return '';
    try {
        const dateObj = (dateStrOrObj instanceof Date) ? dateStrOrObj : new Date(dateStrOrObj);
        if (!isValidDate(dateObj)) {
            return 'Invalid Time';
        }
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
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmedTimeStr)) {
        // console.warn("formatTimeFromHHMM input doesn't strictly match HH:MM:", timeStr); // Optional warning
    }
     try {
         const [hourStr, minuteStr] = trimmedTimeStr.split(':');
         const hour = parseInt(hourStr, 10);
         const minute = parseInt(minuteStr, 10);

         if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
             console.warn("formatTimeFromHHMM failed parsing numbers:", timeStr);
             return 'Invalid Time';
         }

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
    if (!rule || !rule.startDate) return false;
    const checkTime = checkDate.getTime();
    const ruleStart = new Date(rule.startDate);
    ruleStart.setHours(0, 0, 0, 0);
    const startTime = ruleStart.getTime();
    if (isNaN(startTime) || !isValidDate(ruleStart)) return false;
    if (checkTime < startTime) return false;

    if (rule.endDate) {
        const ruleEnd = new Date(rule.endDate);
        ruleEnd.setHours(23, 59, 59, 999);
        const endTime = ruleEnd.getTime();
        if (isNaN(endTime) || !isValidDate(ruleEnd)) return true;
        if (checkTime > endTime) return false;
    }
    return true;
};

// Check if a recurring rule applies on a specific date based on frequency, day, and week
const doesRecurringRuleApplyOnDate = (rule, checkDate) => {
    if (!rule || !rule.frequency || !isDateInRange(checkDate, rule)) return false;
    if (rule.frequency === 'weekly' && (!Array.isArray(rule.daysOfWeek) || rule.daysOfWeek.length === 0)) return false;
    if (rule.frequency === 'monthly' && (typeof rule.dayOfWeekMonthly !== 'number' || typeof rule.weekOfMonth !== 'number')) return false;

    const dayOfWeek = checkDate.getDay();
    const dateOfMonth = checkDate.getDate();
    const year = checkDate.getFullYear();
    const month = checkDate.getMonth();
    const checkDateStartOfDay = new Date(year, month, dateOfMonth);
    checkDateStartOfDay.setHours(0, 0, 0, 0);

    if (rule.frequency === 'daily') {
         return true;
    } else if (rule.frequency === 'weekly') {
        return rule.daysOfWeek.includes(dayOfWeek);
    } else if (rule.frequency === 'monthly') {
        if (rule.dayOfWeekMonthly !== dayOfWeek) return false;

        const firstDayOfMonth = new Date(year, month, 1);
        const firstWeekdayOfMonth = firstDayOfMonth.getDay();
        let targetDate = -1;

        if (rule.weekOfMonth === 5 || rule.weekOfMonth === -1) {
             const lastDayOfMonth = new Date(year, month + 1, 0);
             const lastWeekdayOfMonth = lastDayOfMonth.getDay();
             targetDate = lastDayOfMonth.getDate() - (lastWeekdayOfMonth - rule.dayOfWeekMonthly + 7) % 7;
        } else if (rule.weekOfMonth >= 1 && rule.weekOfMonth <= 4) {
            let dateOfFirstOccurrence = 1 + (rule.dayOfWeekMonthly - firstWeekdayOfMonth + 7) % 7;
             targetDate = dateOfFirstOccurrence + (rule.weekOfMonth - 1) * 7;
        } else {
             return false;
        }

        const calculatedDateObj = new Date(year, month, targetDate);
         if (!isValidDate(calculatedDateObj) || calculatedDateObj.getMonth() !== month || calculatedDateObj.getDate() !== targetDate) {
             return false;
         }

        return dateOfMonth === targetDate;
    }
    return false;
};


// --- Component ---
const Calendar = () => {
  const { staffToken, backendUrl } = useContext(StaffContext);
  const { currentTheme } = useTheme();

  const [scheduleData, setScheduleData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState('calendar');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  useEffect(() => {
    const fetchMySchedule = async () => {
      if (!staffToken) {
        setScheduleError("Authentication required. Please log in again.");
        setLoadingSchedule(false);
        setScheduleData(null);
        return;
      }
      setLoadingSchedule(true);
      setScheduleError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/staff/schedule/me`, {
          headers: { Authorization: `Bearer ${staffToken}` },
        });

        if (response.data.success && response.data.schedule) {
           const schedule = response.data.schedule;
           const scheduledShifts = Array.isArray(schedule.scheduledShifts) ? schedule.scheduledShifts : [];
           const availabilityOverrides = Array.isArray(schedule.availabilityOverrides) ? schedule.availabilityOverrides : [];
           const recurringAvailability = Array.isArray(schedule.recurringAvailability) ? schedule.recurringAvailability : [];

           const sortedSchedule = {
             ...schedule,
              scheduledShifts: scheduledShifts.sort((a, b) => new Date(a?.startTime) - new Date(b?.startTime)),
              availabilityOverrides: availabilityOverrides.sort((a, b) => new Date(a?.date) - new Date(b?.date)),
              recurringAvailability: recurringAvailability.sort((a, b) =>
                  (a?.frequency > b?.frequency ? 1 : -1) ||
                  ((a?.order || 0) - (b?.order || 0)) ||
                  (formatTimeFromHHMM(a?.startTime) > formatTimeFromHHMM(b?.startTime) ? 1 : -1)
              ),
           };
           setScheduleData(sortedSchedule);
         } else {
            console.warn("Fetch schedule success but data missing or malformed:", response.data);
            setScheduleError(response.data.message || "Schedule data not found in response or is invalid.");
            setScheduleData(null);
         }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        const errorMessage = error.response?.data?.message || error.message || "Could not load your schedule. Please try again later.";
        setScheduleError(errorMessage);
        setScheduleData(null);
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchMySchedule();
  }, [staffToken, backendUrl]);

  const combinedEventsForMonth = useMemo(() => {
      if (!scheduleData) return [];

      const events = [];
      const year = selectedYear;
      const month = selectedMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
       if (isNaN(daysInMonth) || daysInMonth <= 0) {
           console.warn("Calculated invalid daysInMonth:", daysInMonth, "for", year, month);
           return [];
       }

       const shifts = Array.isArray(scheduleData.scheduledShifts) ? scheduleData.scheduledShifts : [];
       const overrides = Array.isArray(scheduleData.availabilityOverrides) ? scheduleData.availabilityOverrides : [];
       const recurring = Array.isArray(scheduleData.recurringAvailability) ? scheduleData.recurringAvailability : [];

      for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(year, month, day);
          currentDate.setHours(0, 0, 0, 0);

          const entriesForDay = [];

          shifts.forEach(shift => {
              if (!shift?._id || !shift?.startTime) return;
              const shiftDate = new Date(shift.startTime);
              shiftDate.setHours(0, 0, 0, 0);
              if (isValidDate(shiftDate) && shiftDate.getTime() === currentDate.getTime()) {
                  entriesForDay.push({
                      _id: shift._id, type: 'shift', date: shift.startTime,
                      fullTitle: `Shift: ${formatTimeFromDate(shift.startTime)} - ${formatTimeFromDate(shift.endTime)}` + (shift.roleOverride ? ` (${shift.roleOverride})` : ''),
                      time: `${formatTimeFromDate(shift.startTime)} - ${formatTimeFromDate(shift.endTime)}`,
                      originalData: shift
                  });
              }
          });

          overrides.forEach(ov => {
              if (!ov?._id || !ov?.date) return;
              const overrideDate = new Date(ov.date);
              overrideDate.setHours(0, 0, 0, 0);
              if (isValidDate(overrideDate) && overrideDate.getTime() === currentDate.getTime()) {
                   const overrideTitle = ov.isAvailable ? 'Available' : 'Unavailable';
                   const overrideTimeRange = (ov.isAvailable && (ov.startTime || ov.endTime))
                                         ? `${formatTimeFromHHMM(ov.startTime || '')} - ${formatTimeFromHHMM(ov.endTime || '')}`
                                         : '';
                   const fullTitle = `${overrideTitle}${overrideTimeRange ? ` ${overrideTimeRange}` : ''}` + (ov.reason ? ` (${ov.reason})` : '');
                  entriesForDay.push({
                      _id: ov._id, type: 'availability_override', isAvailable: ov.isAvailable, date: ov.date,
                      fullTitle: fullTitle, time: overrideTimeRange, originalData: ov
                  });
              }
          });

           // Add recurring rules IF they apply to the date, regardless of shifts/overrides
           recurring.forEach(rule => {
               if (!rule?._id || rule?.isAvailable === false) return;

               if (doesRecurringRuleApplyOnDate(rule, currentDate)) {
                    const timeRange = `${formatTimeFromHHMM(rule.startTime || '')} - ${formatTimeFromHHMM(rule.endTime || '')}`;
                    const fullTitle = `Generally Available: ${timeRange}` + (rule.notes ? ` (${rule.notes})` : '');
                   entriesForDay.push({
                       _id: (rule?._id || `recurring-${day}`) + '-' + currentDate.toISOString().split('T')[0],
                       type: 'recurring_availability', date: currentDate.toISOString(),
                       fullTitle: fullTitle, time: timeRange, originalData: rule
                   });
               }
           }); // End recurring loop


           // Sort entries for the current day by time before adding them
            entriesForDay.sort((a, b) => {
                 const timeA_str = a?.originalData?.startTime || a?.originalData?.time || '';
                 const timeB_str = b?.originalData?.startTime || b?.originalData?.time || '';
                 const timeToMinutes = (t) => {
                     if (!t || typeof t !== 'string') return 0;
                     const parts = t.split(':').map(p => parseInt(p, 10));
                     if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
                     return parts[0] * 60 + parts[1];
                 };
                 if (!timeA_str && !timeB_str) return 0;
                 if (!timeA_str) return -1;
                 if (!timeB_str) return 1;
                 return timeToMinutes(timeA_str) - timeToMinutes(timeB_str);
             });

           events.push(...entriesForDay);
      }
      return events;

  }, [scheduleData, selectedMonth, selectedYear]);

  const getMonthDays = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getMonthDays(selectedYear, selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);

  const calendarDays = useMemo(() => {
      const days = [];
       const safeFirstDay = isNaN(firstDayOfMonth) ? 0 : firstDayOfMonth;
       const safeDaysInMonth = isNaN(daysInMonth) || daysInMonth <= 0 ? 30 : daysInMonth;

      for (let i = 0; i < safeFirstDay; i++) days.push(null);
      for (let i = 1; i <= safeDaysInMonth; i++) days.push(i);
      return days;
  }, [selectedYear, selectedMonth, daysInMonth, firstDayOfMonth]);


   const getEventsForCalendarDay = (dayNum) => {
        if (dayNum === null || !Array.isArray(combinedEventsForMonth) || combinedEventsForMonth.length === 0) return [];
        const targetDate = new Date(selectedYear, selectedMonth, dayNum);
        targetDate.setHours(0, 0, 0, 0);

        return combinedEventsForMonth.filter(event => {
            if (!event || !event.date) return false;
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return isValidDate(eventDate) && eventDate.getTime() === targetDate.getTime();
        });
    };


  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getEventTypeClass = (type, isAvailableOverride = false) => {
    switch (type) {
      case 'shift': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200';
      case 'availability_override': return isAvailableOverride ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'recurring_availability': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300';
    }
  };

    const getEventIcon = (type, isAvailableOverride = false) => {
         const size = 14;
         const className = "inline mr-1";
         switch (type) {
            case 'shift': return <Briefcase size={size} className={className} />;
            case 'availability_override': return isAvailableOverride ? <UserCheck size={size} className={className} /> : <UserX size={size} className={className} />;
            case 'recurring_availability': return <Repeat size={size} className={className} />;
            default: return null;
         }
    };


  // --- Render Method ---

   if (loadingSchedule) {
        return (
        <div className="flex justify-center items-center min-h-[50vh] text-gray-500 dark:text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mr-3 text-indigo-500 dark:text-indigo-400" /> Loading Schedule...
        </div>
        );
    }

    if (scheduleError && !scheduleData) {
        return (
        <div className="max-w-2xl mx-auto mt-12 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 rounded" role="alert">
            <p className="font-bold flex items-center"><AlertCircle size={18} className="mr-2"/> Error Loading Schedule</p>
            <p>{scheduleError}</p>
        </div>
        );
    }

  return (
    <>
    <Navbar /> 
    <div className="pt-16">
      <HeroSection
        title="My Schedule Calendar"
        subtitle="View your upcoming schedule entries by month"
        image="https://images.pexels.com/photos/3846035/pexels-photo-3846035.jpeg"
      />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center mb-4 sm:mb-0">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mx-4">
                  {months[selectedMonth]} {selectedYear}
                </h2>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setViewType('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    viewType === 'calendar' ? 'bg-cyan-600 text-white dark:bg-cyan-700 dark:text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Calendar View
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    viewType === 'list' ? 'bg-cyan-600 text-white dark:bg-cyan-700 dark:text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  List View
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-teal-500 mr-1"></span>
                <span className="text-gray-600 dark:text-gray-400">Shifts</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-green-500 mr-1"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Available Exception</span>
              </div>
               <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-red-500 mr-1"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Unavailable Exception</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-blue-500 mr-1"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">General Availability</span>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          {viewType === 'calendar' && (
            <div className="p-6">
              {/* Render calendar grid if there are events, otherwise show message */}
              {(Array.isArray(combinedEventsForMonth) && combinedEventsForMonth.length > 0) ? (
                <div className="grid grid-cols-7 gap-px text-gray-700 dark:text-gray-300">
                  {DAYS_OF_WEEK_SHORT.map((day, index) => (
                    <div key={index} className="text-center font-medium py-2 border-b dark:border-gray-700">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, index) => {
                    const dayEvents = day !== null ? getEventsForCalendarDay(day) : [];
                    const hasEvents = dayEvents.length > 0;
                    const today = new Date();
                    const isToday = day !== null && selectedYear === today.getFullYear() &&
                                     selectedMonth === today.getMonth() &&
                                     day === today.getDate();

                    return (
                      <div key={index} className={`min-h-24 border border-gray-200 dark:border-gray-700 p-1 flex flex-col ${day !== null ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                        {day !== null && (
                          <>
                            <div className="text-right flex justify-end">
                              <span className={`inline-flex items-center justify-center rounded-full w-6 h-6 text-center text-sm font-semibold leading-none
                                ${isToday ? 'bg-indigo-600 text-white' : hasEvents ? 'bg-cyan-600 text-white dark:bg-cyan-700' : 'text-gray-700 dark:text-gray-300'}
                              `}>
                                {day}
                              </span>
                            </div>
                            <div className="mt-1 flex-grow overflow-hidden">
                              {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                <div
                                  key={event?._id || `cal-${index}-${eventIndex}`}
                                  className={`text-xs p-1 mb-0.5 rounded truncate ${getEventTypeClass(event?.type, event?.isAvailable)}`}
                                  title={event?.fullTitle || event?.title || ''}
                                >
                                  {event?.type === 'shift' ? 'Shift' :
                                   event?.type === 'availability_override' ? (event?.isAvailable ? 'Avail' : 'Unavail') :
                                   event?.type === 'recurring_availability' ? 'Gen Avail' :
                                   'Event'}
                                </div>
                              ))}
                            </div>
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left flex-shrink-0">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Show empty state message only if not loading and no general error
                !loadingSchedule && !scheduleError && (
                     <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                         <CalendarIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                         <p className="text-lg">No schedule entries found for {months[selectedMonth]} {selectedYear}.</p>
                         <p className="text-gray-400 dark:text-gray-500">Check your schedule configuration or try selecting a different month.</p>
                     </div>
                 )
              )}
            </div>
          )}

          {/* List View */}
          {viewType === 'list' && (
            <div className="p-6">
              {/* Render list if there are events, otherwise show message */}
              {(Array.isArray(combinedEventsForMonth) && combinedEventsForMonth.length > 0) ? (
                <div className="space-y-4">
                  {combinedEventsForMonth.map((event, index) => (
                    <div
                      key={event?._id || `list-${index}`}
                      className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-32 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <div className="text-lg font-bold text-gray-800 dark:text-white">{new Date(event?.date).getDate()}</div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm">
                            {new Date(event?.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short' }).replace('Invalid Date', 'N/A')}
                          </div>
                          {new Date(event?.date).getFullYear() !== new Date().getFullYear() && !isNaN(new Date(event?.date).getFullYear()) && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">{new Date(event?.date).getFullYear()}</div>
                          )}
                        </div>
                        <div className="flex-grow p-4">
                          <div className={`text-xs inline-block px-2 py-1 rounded-full font-medium ${getEventTypeClass(event?.type, event?.isAvailable)}`}>
                            {event?.type === 'shift' ? 'Shift' :
                             event?.type === 'availability_override' ? (event?.isAvailable ? 'Available Exception' : 'Unavailable Exception') :
                             event?.type === 'recurring_availability' ? 'General Availability' :
                             'Event'}
                          </div>
                          <h3 className="text-lg font-semibold mt-1 text-gray-800 dark:text-gray-200">{event?.fullTitle || event?.title || 'No Title'}</h3>
                          <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {event?.time && event.time !== 'Time Error' && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 shrink-0" />
                                <span>{event.time}</span>
                              </div>
                            )}
                            {event?.type === 'shift' && event?.originalData?.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 shrink-0" />
                                <span>Location: {event.originalData.location}</span>
                              </div>
                            )}
                            {(event?.type === 'availability_override' || event?.type === 'recurring_availability') && event?.originalData?.notes && (
                              <div className="flex items-center">
                                <Info className="h-4 w-4 mr-2 shrink-0" />
                                <span className="italic">Notes: {event.originalData.notes}</span>
                              </div>
                            )}
                            {(event?.type === 'availability_override' && event?.originalData?.reason) && (
                              <div className="flex items-center">
                                <Info className="h-4 w-4 mr-2 shrink-0" />
                                <span className="italic">Reason: {event.originalData.reason}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Show empty state message only if not loading and no general error
                !loadingSchedule && !scheduleError && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-lg">No schedule entries found for {months[selectedMonth]} {selectedYear}.</p>
                    <p className="text-gray-400 dark:text-gray-500">Check your schedule configuration or try selecting a different month.</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Calendar;