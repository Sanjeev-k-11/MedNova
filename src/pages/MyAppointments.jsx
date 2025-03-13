import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const MyAppointments = () => {
  const { doctors } = useContext(AppContext);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <p className="text-lg font-semibold text-center mb-4">My Appointments</p>
      <div className="space-y-4">
        {doctors.slice(6, 10).map((item, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-4 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4">
            {/* Doctor Image */}
            <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-full border" />
            </div>

            {/* Doctor Info */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-lg font-bold">{item.name}</p>
              <p className="text-gray-600">{item.speciality}</p>
              <p className="text-gray-700 font-semibold mt-2">Address:</p>
              <p className="text-gray-600">{item.address.line1}</p>
              <p className="text-gray-600">{item.address.line2}</p>
              <p className="text-gray-700 mt-2">
                <span className="font-semibold">Date & Time: </span>25 July 2025 | 8:30 PM
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col space-y-2 w-full md:w-auto">
              <button className="bg-transparent text-blue-500 border border-blue-500 px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white transition w-full md:w-auto">
                  Pay Online
              </button>
              <button className="bg-transparent text-red-500 border border-red-500 px-4 py-2 rounded-md hover:bg-red-500 hover:text-white transition w-full md:w-auto">
                  Cancel Appointment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyAppointments;
