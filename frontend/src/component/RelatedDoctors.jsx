import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // <--- 1. Import useTheme

const RelatedDoctors = () => {
  const { doctors } = useContext(AppContext);
  const { docId } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme(); // <--- 2. Get the current theme

  // Find the current doctor (handle case where doctor might not be found)
  const currentDoctor = doctors.find(doc => doc._id === docId);

  // Filter related doctors based on the current doctor's specialty
  // Ensure currentDoctor exists before accessing its speciality
  const relatedDoctors = currentDoctor
    ? doctors.filter(doc => doc.speciality === currentDoctor.speciality && doc._id !== docId)
    : []; // Return empty array if current doctor not found

  const handleDoctorClick = (id) => {
    navigate(`/appointment/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Don't render the section if there are no related doctors
  if (relatedDoctors.length === 0) {
    return null; // Or return a message like <p>No related doctors found.</p>
  }

  return (
    // Apply base theme text color to the section container
    <div
      className="flex flex-col items-center gap-6 my-16 md:mx-10" // Removed text-gray-900
      style={{ color: currentTheme.textColor }} // <--- 3. Apply base text color
    >
      {/* Heading inherits text color */}
      <h1 className="text-3xl font-medium">Top Doctors to Book</h1>
      {/* Description inherits text color - removed text-gray-600, added opacity */}
      <p className="sm:w-1/3 text-center text-sm opacity-80">
        Simply browse through our extensive list of experienced doctors and book your appointment easily.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {relatedDoctors.map(doc => (
          <div
            key={doc._id}
            // Card keeps its own background/shadow for contrast/design
            className="border rounded-lg p-4 shadow-md bg-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            onClick={() => handleDoctorClick(doc._id)}
            // Text inside the card will use the theme color applied to the parent section
          >
            <img
              src={doc.image}
              alt={doc.name}
              className="w-full h-60 object-cover rounded-md"
            />
            {/* Doctor name inherits text color */}
            <h3 className="mt-3 text-lg font-semibold">{doc.name}</h3>
            {/* Speciality inherits text color - removed text-gray-500, added opacity */}
            <p className="text-sm opacity-70">{doc.speciality}</p>
            {/* Fees inherit text color - removed text-gray-700 */}
            <p className="text-sm font-semibold mt-1">Fees: ₹ {doc.fees}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedDoctors;