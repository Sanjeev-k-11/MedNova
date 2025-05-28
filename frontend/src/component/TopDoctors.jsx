import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const TopDoctors = () => {
  const navigate = useNavigate();
  const { doctors, token } = useContext(AppContext);
  const { currentTheme } = useTheme(); // Get the current theme

  // Filter top doctors with different specialties (max 6)
  const uniqueSpecialties = new Set();
  const topDoctors = doctors.filter((doc) => {
    // Ensure doc and doc.speciality exist before accessing
    if (doc && doc.speciality && !uniqueSpecialties.has(doc.speciality) && uniqueSpecialties.size < 6) {
      uniqueSpecialties.add(doc.speciality);
      return true;
    }
    return false;
  });

  return (
    // Apply base theme text color AND font family to the main container
    <div
      className="flex flex-col items-center gap-4 m-10 md:mx-10"
      style={{
        color: currentTheme.textColor,
        fontFamily: currentTheme.fontFamily // Apply font family here
      }}
    >
      {/* Heading inherits font family */}
      <h1 className="text-2xl font-medium">Top Doctors to Book</h1>
      {/* Description inherits font family */}
      <p className="sm:w-1/3 text-center text-sm opacity-80">
        Simply browse through our extensive list of trusted doctors.
      </p>

      {/* Grid Layout for Top 6 Doctors (Responsive) */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-3 sm:px-0 pt-4">
        {topDoctors.map((item, index) => (
          <motion.div
            key={index}
            onClick={() => (token ? navigate(`/appointment/${item._id}`) : navigate('/login'))}
            // Keep specific card styling (bg, border, shadow)
            className="border rounded-xl overflow-hidden cursor-pointer bg-white shadow-md hover:shadow-xl transition-all"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, rotate: 1 }}
            // Apply explicit text color for card content (contrast)
            // Font family will be inherited from the main container OR you could explicitly set it here if needed
            style={{
              color: '#1F2937', // Keep dark text for readability on white card
              borderColor: currentTheme.textColor === '#FFFFFF' ? '#DDD' : 'rgb(191 219 254)'
            }}
          >
            <img
              className="w-full h-[250px] object-cover" // Fixed height image
              src={item.image}
              alt={item.name}
            />
            <div className="p-4 text-center">
              {/* Availability Indicator - Keep semantic colors */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <p className={`w-2 h-2 rounded-full ${item.available ? "bg-green-500" : "bg-red-500"}`}></p>
                <span className={item.available ? "text-green-500" : "text-red-500"}>
                  {item.available ? "Available" : "Unavailable"}
                </span>
              </div>
              {/* Card text (name, specialty) will inherit font family */}
              <p className="text-lg font-medium pt-2">{item.name}</p>
              <p className="text-sm opacity-75">{item.speciality}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* "View More Doctors" Button - inherits font family */}
      <motion.button
        onClick={() => (token ? navigate("/doctor") : navigate("/login"))}
        // Keep specific button styling
        className="bg-blue-500 text-white px-10 py-2 rounded-full mt-6 hover:bg-blue-600 transition-all text-sm"
        whileHover={{ scale: 1.1, rotate: -2 }}
        whileTap={{ scale: 0.9 }}
      >
        View More Doctors
      </motion.button>
    </div>
  );
};

export default TopDoctors;