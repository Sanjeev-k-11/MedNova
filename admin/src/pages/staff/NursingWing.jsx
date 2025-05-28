// src/components/NursingWingInfo.jsx
import React, { useState } from 'react';
import {
  FaUserNurse, FaBriefcaseMedical, FaCalendarDay, FaPhoneAlt, FaBed,
  FaNotesMedical, FaClock, FaMapMarkerAlt, FaBell, FaCircle, FaCalendarWeek
} from 'react-icons/fa'; // Example icons

// --- Mock Data (Replace with API Data & State Management) ---
const mockStaffOnDuty = [
  { id: 'N101', name: 'Nurse Sarah Chen', shift: '07:00 - 19:00', specialization: 'ICU Lead', status: 'On Duty' },
  { id: 'N102', name: 'Nurse Michael Rodriguez', shift: '07:00 - 15:00', specialization: 'Pediatrics', status: 'On Duty' },
  { id: 'N103', name: 'Nurse Emily White', shift: '11:00 - 23:00', specialization: 'Geriatrics', status: 'Break' },
  { id: 'N104', name: 'Nurse David Kim', shift: '19:00 - 07:00', specialization: 'General Ward', status: 'On Duty' },
  { id: 'N105', name: 'Nurse Linda Brown', shift: '09:00 - 17:00', specialization: 'Cardiology', status: 'Off Duty' },
];

const mockWardAssignments = [
  { ward: 'Ward A (Rooms 101-110)', nurseName: 'Sarah Chen', nurseId: 'N101' },
  { ward: 'Pediatrics (Rooms 201-205)', nurseName: 'Michael Rodriguez', nurseId: 'N102' },
  { ward: 'Ward B (Rooms 111-120)', nurseName: 'David Kim', nurseId: 'N104' },
  { ward: 'Geriatrics (Rooms 301-310)', nurseName: 'Emily White', nurseId: 'N103' },
];

const mockAvailableServices = [
  'IV Therapy & Management', 'Medication Administration', 'Wound Care & Dressing Changes',
  'Vital Signs Monitoring', 'Patient Assessment', 'Catheter Care',
  'Injections (IM, SC)', 'Blood Glucose Monitoring', 'Patient Education',
];

const mockShiftSchedule = { // Simplified - Replace with actual schedule data/component
  today: [
    { nurseName: 'Sarah Chen', time: '07:00 - 19:00' },
    { nurseName: 'Michael Rodriguez', time: '07:00 - 15:00' },
    { nurseName: 'Emily White', time: '11:00 - 23:00' },
    { nurseName: 'David Kim', time: 'Starts 19:00' },
  ],
  tomorrow: [
     { nurseName: 'Sarah Chen', time: '07:00 - 19:00' },
     { nurseName: 'David Kim', time: 'Ends 07:00, Starts 19:00' },
     // ... more shifts
  ]
};

const mockEmergencyContacts = [
  { role: 'Head Nurse (Day)', name: 'Ms. Evelyn Reed', contact: 'Ext. 1234' },
  { role: 'Charge Nurse (Night)', name: 'Mr. David Kim', contact: 'Ext. 5678' },
  { role: 'On-Call Supervisor', name: 'Dr. Peterson (Via Operator)', contact: 'Operator: 0' },
];

// --- Helper Component for Status Badge ---
function StatusBadge({ status }) {
  let bgColor, textColor, dotColor;

  switch (status) {
    case 'On Duty':
      bgColor = 'bg-green-100 dark:bg-green-900';
      textColor = 'text-green-800 dark:text-green-200';
      dotColor = 'text-green-500 dark:text-green-400';
      break;
    case 'Break':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900';
      textColor = 'text-yellow-800 dark:text-yellow-300';
      dotColor = 'text-yellow-500 dark:text-yellow-400';
      break;
    case 'Off Duty':
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-600 dark:text-gray-400';
      dotColor = 'text-gray-500 dark:text-gray-500';
      break;
    default:
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-600 dark:text-gray-400';
      dotColor = 'text-gray-500';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      <FaCircle className={`mr-1.5 text-[8px] ${dotColor}`} />
      {status}
    </span>
  );
}


// --- Main Nursing Wing Info Component ---
function NursingWingInfo() {
  const [scheduleView, setScheduleView] = useState('today'); // 'today', 'week'

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      {/* --- Header --- */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Nursing Wing Information
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-3xl">
          Central hub for accessing nursing staff schedules, assignments, available services, and contact information for efficient coordination and patient care.
        </p>
      </header>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- Left Column (Span 2 on large screens) --- */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Current Staff on Duty Card */}
          <section className="card-style">
            <h2 className="card-header">
              <FaUserNurse className="mr-2 text-blue-500" /> Staff Currently On Duty
            </h2>
            <div className="space-y-3">
              {mockStaffOnDuty.map((staff) => (
                <div key={staff.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{staff.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {staff.specialization} <span className="mx-1 text-gray-300 dark:text-gray-500">|</span> Shift: {staff.shift}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <StatusBadge status={staff.status} />
                  </div>
                </div>
              ))}
               {/* Optional: Real-time location placeholder */}
               {/* <div className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center">
                    <FaMapMarkerAlt className="mr-1"/> Real-time location tracking not enabled.
               </div> */}
            </div>
          </section>

          {/* 2. Ward Assignments Card */}
          <section className="card-style">
            <h2 className="card-header">
              <FaBed className="mr-2 text-purple-500" /> Ward Assignments
            </h2>
            <ul className="space-y-2 list-none">
              {mockWardAssignments.map((assignment, index) => (
                <li key={index} className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{assignment.ward}</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{assignment.nurseName}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Shift Schedule Viewer Card */}
          <section className="card-style">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="card-header mb-0 flex-grow">
                   <FaCalendarDay className="mr-2 text-orange-500" /> Shift Schedule
                 </h2>
                 {/* Basic View Toggle */}
                 <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-md">
                     <button
                         onClick={() => setScheduleView('today')}
                         className={`px-3 py-1 text-xs rounded ${scheduleView === 'today' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/50'}`}
                     >
                         Today
                     </button>
                     <button
                         onClick={() => setScheduleView('week')}
                         className={`px-3 py-1 text-xs rounded ${scheduleView === 'week' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/50'}`}
                     >
                         Week
                     </button>
                 </div>
             </div>

            {scheduleView === 'today' && (
              <ul className="space-y-1 text-sm">
                  {mockShiftSchedule.today.map((shift, index) => (
                       <li key={`today-${index}`} className="flex justify-between p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                           <span>{shift.nurseName}</span>
                           <span className="text-gray-600 dark:text-gray-400">{shift.time}</span>
                       </li>
                  ))}
              </ul>
            )}
             {scheduleView === 'week' && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                  <FaCalendarWeek className="mx-auto text-3xl mb-2" />
                  <p className="text-sm">Weekly schedule view placeholder. Integrate a calendar component or detailed list here.</p>
              </div>
             )}
             {/* TODO: Integrate a proper calendar view component for weekly view */}
          </section>

        </div>

        {/* --- Right Column (Span 1) --- */}
        <div className="space-y-6">

          {/* Optional: Request Assistance Button */}
          <section>
             <button className="w-full flex items-center justify-center px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-150 ease-in-out">
                 <FaBell className="mr-2"/> Request Nurse Assistance
             </button>
          </section>

          {/* 3. Available Services Card */}
          <section className="card-style">
            <h2 className="card-header">
              <FaBriefcaseMedical className="mr-2 text-teal-500" /> Available Nursing Services
            </h2>
            <ul className="space-y-1.5 list-none text-sm">
              {mockAvailableServices.map((service, index) => (
                <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                    <FaNotesMedical className="mr-2 text-teal-400 text-xs flex-shrink-0" />
                    {service}
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Emergency Contact Card */}
          <section className="card-style">
            <h2 className="card-header">
              <FaPhoneAlt className="mr-2 text-red-500" /> Emergency Contacts
            </h2>
            <ul className="space-y-2 text-sm">
              {mockEmergencyContacts.map((contact, index) => (
                <li key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{contact.role}</p>
                  <p className="text-gray-600 dark:text-gray-300">{contact.name}</p>
                  <p className="text-red-600 dark:text-red-400 font-medium mt-0.5">{contact.contact}</p>
                </li>
              ))}
            </ul>
          </section>

        </div>

      </div>

        {/* Helper CSS for consistent card styling */}
       <style jsx global>{`
        .card-style {
           @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700;
        }
        .card-header {
            @apply text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2;
        }
       `}</style>

    </div>
  );
}

export default NursingWingInfo;