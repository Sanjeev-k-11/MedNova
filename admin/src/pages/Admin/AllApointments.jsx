import React, { useContext, useEffect, useState, useMemo } from 'react'; // Added useMemo
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

// Import libraries for Excel download
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AllAppointments = () => {
  const { token, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext);
  const { calculateAge, slotDataFormat, currency } = useContext(AppContext); // Assume slotDataFormat handles date formatting

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- New State for Date Filtering ---
  const [selectedMonth, setSelectedMonth] = useState(''); // '' means "All Months"
  const [selectedYear, setSelectedYear] = useState(''); // '' means "All Years"

  // Fetch all appointments on mount or token change
  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        setLoading(true);
        setError(null); // Reset error state on new fetch
        try {
          await getAllAppointments();
        } catch (err) {
          console.error("Error fetching appointments:", err);
          setError("Failed to load appointments. Please try again later.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // Not logged in or no token
      }
    };
    fetchData();
    // Include getAllAppointments in dependency array as recommended by React Hook linting rules
  }, [token]);

  // --- Memoized Filtering Logic ---
  const monthYearFilteredAppointments = useMemo(() => {
    if (!appointments) return [];

    // Filter by month and year first
    let dateFiltered = appointments;

    if (selectedYear !== '') {
        dateFiltered = dateFiltered.filter(item => {
            try {
                const appointmentDate = new Date(item.slotDate);
                return appointmentDate.getFullYear() === parseInt(selectedYear);
            } catch (e) {
                console.error("Error parsing date for filtering:", item.slotDate, e);
                return false; // Exclude items with invalid dates
            }
        });
    }

    if (selectedMonth !== '') {
        dateFiltered = dateFiltered.filter(item => {
             try {
                const appointmentDate = new Date(item.slotDate);
                // getMonth() is 0-indexed, selectedMonth is 0-indexed number string or ''
                return appointmentDate.getMonth() === parseInt(selectedMonth); 
             } catch (e) {
                 console.error("Error parsing date for filtering:", item.slotDate, e);
                 return false;
             }
        });
    }
    
    return dateFiltered;

  }, [appointments, selectedMonth, selectedYear]); // Dependencies for month/year filtering


  // Filter the month/year results by search term for DISPLAY in the table
  const filteredAppointmentsForDisplay = useMemo(() => {
       if (!monthYearFilteredAppointments) return [];
       
       if (searchTerm === '') {
           return monthYearFilteredAppointments;
       }

       const lowerSearchTerm = searchTerm.toLowerCase();
       return monthYearFilteredAppointments.filter(item =>
           (item.userData.name && item.userData.name.toLowerCase().includes(lowerSearchTerm)) || // Check if names exist
           (item.docData.name && item.docData.name.toLowerCase().includes(lowerSearchTerm))
       );
  }, [monthYearFilteredAppointments, searchTerm]); // Dependencies for text search filtering


  // Calculate totals from the original (unfiltered) list for overall stats
  const completedAppointments = useMemo(() => appointments?.filter(item => item.isCompleted && !item.cancelled) || [], [appointments]);
  const totalIncome = completedAppointments.reduce((acc, item) => acc + item.amount, 0);
  const completedAppointmentsCount = completedAppointments.length;

  // --- Excel Download Logic ---
  const handleDownloadExcel = () => {
    if (!monthYearFilteredAppointments || monthYearFilteredAppointments.length === 0) {
      alert("No appointments to download for the selected period.");
      return;
    }

    // Prepare data for the sheet
    const dataForSheet = [
      [
        '#',
        'Patient Name',
        'Patient Email', // Added email for more info
        'Patient Phone', // Added phone
        'Age',
        'Appointment Date',
        'Appointment Time',
        'Doctor Name',
        'Doctor Speciality', // Added speciality
        'Fees (' + currency + ')',
        'Status',
        'Payment Method' // Added payment method
      ], // Header Row
    ];

    monthYearFilteredAppointments.forEach((item, index) => {
      const status = item.cancelled ? 'Cancelled' : (item.isCompleted ? 'Completed' : 'Pending');
      const paymentMethod = item.isPaidOnline ? 'Online' : (item.isCompleted ? 'Cash' : 'N/A'); // Assume cash if completed and not paid online

      dataForSheet.push([
        index + 1,
        item.userData.name,
        item.userData.email,
        item.userData.phone,
        calculateAge(item.userData.dob),
        slotDataFormat(item.slotDate), // Format date as needed
        item.slotTime,
        item.docData.name,
        item.docData.speciality, // Assuming speciality is available
        item.amount.toFixed(2), // Ensure fees are formatted
        status,
        paymentMethod,
      ]);
    });

    // Create a workbook and add a sheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dataForSheet); // aoa_to_sheet is great for Array of Arrays

    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Convert buffer to Blob and save
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Generate filename based on selected month/year
    const monthName = selectedMonth === '' ? 'AllMonths' : new Date(2000, parseInt(selectedMonth), 1).toLocaleString('default', { month: 'long' });
    const yearName = selectedYear === '' ? 'AllYears' : selectedYear;
    const filename = `Appointments_${monthName}_${yearName}.xlsx`;

    saveAs(data, filename);
  };

  // --- Options for Month and Year Selectors ---
  const months = [
    { value: '', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  // Generate years dynamically based on available appointment data, or a fixed range
  const availableYears = useMemo(() => {
      const years = new Set();
      if (appointments) {
          appointments.forEach(item => {
              try {
                 const appointmentDate = new Date(item.slotDate);
                 years.add(appointmentDate.getFullYear());
              } catch (e) {
                  // Ignore invalid dates
              }
          });
      }
      const sortedYears = Array.from(years).sort((a, b) => b - a); // Sort descending
       // Add a default "All Years" option
      return [{ value: '', label: 'All Years' }, ...sortedYears.map(year => ({ value: year.toString(), label: year.toString() }))];
  }, [appointments]);


  return (
    <div className='w-full p-4 sm:p-6'>
      <h1 className='text-2xl font-semibold mb-6 text-gray-800'>All Appointments</h1>

      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Total Income */}
        <div className='flex items-center gap-4 bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm'>
          {/* Ensure earning_icon exists or use a fallback */}
          <img src={assets.earning_icon || assets.completed_icon} alt='Income' className='w-10 h-10 text-green-600' /> 
          <div>
            <p className='text-sm text-green-600'>Total Income</p>
            <p className='font-semibold text-xl text-green-800'>{currency}{totalIncome.toFixed(2)}</p>
          </div>
        </div>
        {/* Completed Appointments Count */}
        <div className='flex items-center gap-4 bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm'>
           {/* Assume you have a completed_icon or use another one */}
          <img src={assets.completed_icon || assets.list_icon} alt='Completed' className='w-10 h-10 text-blue-600' />
          <div>
            <p className='text-sm text-blue-600'>Completed Appointments</p>
            <p className='font-semibold text-xl text-blue-800'>{completedAppointmentsCount}</p>
          </div>
        </div>
      </div>

      {/* --- Filter and Search Controls --- */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
         {/* Month Selector */}
         <select
             value={selectedMonth}
             onChange={(e) => setSelectedMonth(e.target.value)}
             className="flex-shrink-0 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 w-full sm:w-auto"
         >
             {months.map(month => (
                 <option key={month.value} value={month.value}>{month.label}</option>
             ))}
         </select>

         {/* Year Selector */}
          <select
             value={selectedYear}
             onChange={(e) => setSelectedYear(e.target.value)}
             className="flex-shrink-0 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 w-full sm:w-auto"
         >
             {availableYears.map(year => (
                 <option key={year.value} value={year.value}>{year.label}</option>
             ))}
         </select>

         {/* Search Bar */}
         <div className="relative flex-grow w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Patient or Doctor Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
            />
            {/* Assuming search_icon exists in assets */}
            {/* <img src={assets.search_icon} alt="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" /> */}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadExcel}
            className='flex-shrink-0 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition duration-150 w-full sm:w-auto flex items-center justify-center gap-2 text-sm'
          >
              {/* You might want an Excel icon here */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            Download Excel ({monthYearFilteredAppointments.length})
          </button>
      </div>


      {/* --- Appointments List --- */}
      <div className='bg-white border border-gray-200 rounded-lg shadow-md text-sm max-h-[60vh] overflow-y-auto'> {/* Adjusted max-height */}
        {loading ? (
          <div className="text-center p-10 text-gray-500">Loading appointments...</div> // Replace with a spinner component if desired
        ) : error ? (
          <div className="text-center p-10 text-red-600">{error}</div>
        ) : (
          <>
            {/* Table Header (visible on sm screens and up) */}
            {/* Adjusted grid columns to match displayed data */}
            <div className='hidden sm:grid grid-cols-[40px_minmax(150px,_3fr)_minmax(50px,_1fr)_minmax(150px,_3fr)_minmax(150px,_3fr)_minmax(60px,_1fr)_minmax(100px,_1fr)] py-3 px-4 border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold'>
              <p>#</p>
              <p>Patient</p>
              <p>Age</p>
              <p>Date & Time</p>
              <p>Doctor</p>
              <p>Fees</p>
              <p className='text-center'>Status / Action</p>
            </div>

            {/* Table Body */}
            {filteredAppointmentsForDisplay.length > 0 ? (
              filteredAppointmentsForDisplay.map((item, index) => (
                <div
                  className='grid grid-cols-1 sm:grid-cols-[40px_minmax(150px,_3fr)_minmax(50px,_1fr)_minmax(150px,_3fr)_minmax(150px,_3fr)_minmax(60px,_1fr)_minmax(100px,_1fr)] items-center gap-y-2 sm:gap-y-0 text-gray-700 py-4 px-4 border-b last:border-b-0 hover:bg-gray-50 transition duration-150'
                  key={item._id || index} // Use item._id if available and unique
                >
                  {/* --- Column Data --- */}
                  {/* # */}
                  <div className="flex items-center">
                    <p className="sm:hidden font-semibold text-xs text-gray-500 w-20">#:</p>
                    <p>{index + 1}</p>
                  </div>

                  {/* Patient */}
                  <div className="flex items-center gap-2">
                     <p className="sm:hidden font-semibold text-xs text-gray-500 w-20">Patient:</p>
                    <img
                      src={item.userData.image || assets.profile_icon} // Fallback icon
                      alt={item.userData.name}
                      className='w-10 h-10 rounded-full border object-cover'
                      onError={(e) => e.target.src = assets.profile_icon} // Handle broken image links
                    />
                    <p className='font-medium text-gray-800'>{item.userData.name}</p>
                  </div>

                  {/* Age */}
                  <div className="flex items-center">
                    <p className="sm:hidden font-semibold text-xs text-gray-500 w-20">Age:</p>
                    <p>{calculateAge(item.userData.dob)}</p>
                  </div>

                  {/* Date & Time */}
                   <div className="flex items-center">
                     <p className="sm:hidden font-semibold text-xs text-gray-500 w-20">When:</p>
                     {/* Ensure slotDataFormat is correctly implemented to handle item.slotDate */}
                     <p>{slotDataFormat(item.slotDate)} | <span className='font-semibold text-indigo-600'>{item.slotTime}</span></p>
                   </div>


                  {/* Doctor */}
                  <div className="flex items-center gap-2">
                    <p className="sm:hidden font-semibold text-xs text-gray-500 w-20">Doctor:</p>
                    <img
                      src={item.docData.image || assets.profile_icon} // Fallback icon
                      alt={item.docData.name}
                      className='w-10 h-10 rounded-full border object-cover'
                       onError={(e) => e.target.src = assets.profile_icon}
                    />
                    <p className='font-medium text-gray-800'>{item.docData.name}</p>
                  </div>

                  {/* Fees */}
                  <div className="flex items-center">
                    <p className="sm:hidden font-semibold text-xs text-gray-500 w-20">Fees:</p>
                    <p className='font-medium'>{currency}{item.amount.toFixed(2)}</p>
                   </div>


                  {/* Action / Status */}
                  <div className="flex items-center justify-start sm:justify-center">
                    <p className="sm:hidden font-semibold text-xs text-gray-500 w-20">Status:</p>
                    <div className='flex flex-col items-start sm:items-center'>
                      {item.cancelled ? (
                        <span className='inline-block bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full'>Cancelled</span>
                      ) : item.isCompleted ? (
                        <>
                          <span className='inline-block bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full'>Completed</span>
                          {item.isPaidOnline && (
                            <span className='text-blue-500 text-xs mt-1'>Paid Online</span>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to cancel the appointment for ${item.userData.name} on ${slotDataFormat(item.slotDate)}?`)) {
                              cancelAppointment(item._id);
                            }
                          }}
                          className='flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium p-1 rounded hover:bg-red-100 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
                          title="Cancel Appointment"
                          disabled={!cancelAppointment} // Disable if cancelAppointment function isn't available
                        >
                           {/* Ensure assets.cancel_icon exists */}
                          <img className='w-4 h-4' src={assets.cancel_icon || assets.cross_icon} alt=''/> {/* Added fallback cross_icon */}
                          <span className="hidden sm:inline">Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-10 text-gray-500">
                {/* Optional: Add an icon for no data */}
                {/* <img src={assets.no_data_icon} alt="No appointments" className="w-16 h-16 mx-auto mb-4 opacity-50" /> */}
                <p>No appointments found{searchTerm ? ' matching your search criteria' : (selectedMonth !== '' || selectedYear !== '' ? ' for the selected period' : '')}.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllAppointments;