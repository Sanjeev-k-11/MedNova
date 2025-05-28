import React, { useContext } from 'react';
import { specialityData } from '../assets/assets';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext'; // Make sure this import is correct

const SpecialityMenu = () => {
  const { token } = useContext(AppContext);
  const { currentTheme } = useTheme(); // Get the theme context

  return (
    // Apply both text color and font family from the theme context
    <div
      className='flex m-10 items-center flex-col gap-6'
      id='speciality'
      style={{
        color: currentTheme.textColor,
        fontFamily: currentTheme.fontFamily // Apply font family here
      }}
    >
      {/* --- CONTENT SHOWN BASED ON LOGIN STATUS (token) --- */}
      {token ? (
        // --- Logged-in view ---
        // This block is shown only if 'token' exists
        <>
          <h2 className="text-3xl font-medium">Find by Speciality</h2>
          <p className="sm:w-1/3 text-center text-sm opacity-80">
            Simply browse through our extensive list of trusted doctors and schedule your appointment hassle-free.
          </p>
          <div className='flex sm:justify-center gap-4 pt-5 w-full overflow-scroll'>
            {specialityData.map((item, index) => (
              <Link
                onClick={() => window.scrollTo(0, 0)} // Corrected: Use window.scrollTo
                className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-500'
                key={index}
                to={`/doctor/${item.speciality}`}
              >
                <img className='w-16 sm:w-24 mb-2' src={item.image} alt={item.speciality} />
                <p>{item.speciality}</p>
              </Link>
            ))}
          </div>
        </>
      ) : (
        // --- Logged-out view ---
        // This block is shown only if 'token' does NOT exist
        <div className='text-center flex flex-col items-center gap-5'>
          <h1 className="text-3xl font-bold text-blue-600">Welcome to Our Healthcare Platform!</h1>
          <p className="text-sm sm:w-1/2 opacity-80">
            Join our trusted community of patients and doctors. Create an account to access top-rated specialists,
            book appointments effortlessly, and ensure your well-being with professional care.
          </p>
          <video
            className="w-full sm:w-2/3 md:w-1/2 rounded-lg shadow-md"
            autoPlay
            loop
            muted
            playsInline
          >
            {/* Ensure this video path is correct for your project setup */}
            <source src="/src/assets/docs/v1.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default SpecialityMenu;