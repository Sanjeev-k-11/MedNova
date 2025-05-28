import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import AIChat from '../component/AIChat';
import { useTheme } from '../context/ThemeContext';
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';

const Doctor = () => {
  const { speciality } = useParams();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const { doctors, token } = useContext(AppContext);
  const { currentTheme } = useTheme();

  // --- Theme Defaults & Fallbacks ---
  const themeDefaults = {
    background: '#FFFFFF',
    textColor: '#1F2937', // Dark Gray
    cardBackground: '#FFFFFF',
    secondaryBackground: '#F9FAFB', // Light Gray
    inputBackground: '#FFFFFF',
    borderColor: '#D1D5DB', // Medium Gray
    primary: '#4F46E5', // Indigo
    primaryTextColor: '#FFFFFF', // White for primary background
    hoverBackground: 'rgba(79, 70, 229, 0.05)', // Light primary tint for hover
    focusRingColor: '#6366F1', // Indigo-500 for focus rings
    // ... other theme properties
  };

  // Merge provided theme with defaults to ensure all keys exist
  const theme = { ...themeDefaults, ...currentTheme };

  // --- Apply Filters ---
  useEffect(() => {
    let filteredDoctors = doctors;
    if (speciality) {
      filteredDoctors = filteredDoctors.filter(
        (doc) => doc.speciality.trim().toLowerCase() === speciality.trim().toLowerCase()
      );
    }
    if (token && searchQuery) {
      filteredDoctors = filteredDoctors.filter((doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilterDoc(filteredDoctors);
  }, [doctors, speciality, searchQuery, token]);

  // --- Helper Function for dynamic styles ---
  const getThemedStyles = (elementType, isActive = false) => {
    switch (elementType) {
      case 'container':
        return {   color: theme.textColor };
      case 'card':
        return { backgroundColor: theme.cardBackground, borderColor: theme.borderColor, color: theme.textColor };
      case 'input':
        return { backgroundColor: theme.inputBackground, color: theme.textColor, borderColor: theme.borderColor };
      case 'filterButton': // Mobile toggle button
        return isActive
         ? { backgroundColor: theme.primary, color: theme.primaryTextColor, borderColor: theme.primary }
         : { backgroundColor: 'transparent', color: theme.textColor, borderColor: theme.borderColor };
      case 'filterListContainer':
         return { backgroundColor: theme.secondaryBackground, borderColor: theme.borderColor };
      case 'filterItem':
        if (isActive) {
          // Active state: Solid primary background, high-contrast text
          return {
            backgroundColor: theme.primary,
            color: theme.primaryTextColor,
            borderColor: theme.primary, // Match border to background
          };
        } else {
          // Inactive state: Transparent background, theme text color, theme border
          return {
            backgroundColor: 'transparent',
            color: theme.textColor,
            borderColor: theme.borderColor, // Or theme.primary for outline style? Let's stick to default border for now.
          };
        }
       case 'filterItemHover': // Style for hover on inactive items
          return {
              backgroundColor: theme.hoverBackground, // Use a dedicated hover background
          };
      default:
        return { color: theme.textColor };
    }
  };

  const handleSpecialtyClick = (spec) => {
    const newPath = speciality === spec ? '/doctor' : `/doctor/${spec}`;
    navigate(newPath);
    if (window.innerWidth < 640) {
      setShowFilter(false);
    }
  }

  // State to manage hover style for filter items (needed for applying JS style on hover)
  const [hoveredSpec, setHoveredSpec] = useState(null);

  return (
    <div className='p-4 md:p-6 min-h-screen' style={getThemedStyles('container')}>
      <h1 className="text-2xl font-semibold mb-2">Find Your Specialist</h1>
      <p className='text-sm opacity-80 mb-6'>Browse doctors by specialty or search by name.</p>

      {token && (
        <div className="mb-6 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-60">
            <FiSearch style={{ color: theme.textColor }} />
          </span>
          <input
            type="text"
            placeholder="Search doctor by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
                ...getThemedStyles('input'),
                '--tw-ring-color': theme.focusRingColor, // Set focus ring color using CSS var
                '--tw-ring-offset-color': theme.background // Set focus ring offset color
            }}
          />
        </div>
      )}

      <button
        className={`py-2 px-4 border rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out flex items-center gap-2 sm:hidden mb-4`}
        onClick={() => setShowFilter((prev) => !prev)}
        style={getThemedStyles('filterButton', showFilter)} // Pass active state
      >
        {showFilter ? <FiX /> : <FiFilter />}
        {showFilter ? 'Close Filters' : 'Show Filters'}
      </button>

      <div className='flex flex-col sm:flex-row items-start gap-6'>
        {/* --- Filters Section --- */}
        <div
          className={`
            w-full sm:w-64 flex-shrink-0
            ${showFilter ? 'flex flex-col' : 'hidden'} sm:flex sm:flex-col
            gap-2 text-sm transition-all duration-300 ease-in-out
            sm:sticky sm:top-20
            p-4 rounded-lg border
          `}
           style={getThemedStyles('filterListContainer')} // Themed background/border for the container
        >
           <h3 className="text-lg font-medium mb-3" style={{ color: theme.textColor }}>Specialties</h3>
          {["General Physician", "Gynecologist", "Dermatologist", "Pediatrician", "Neurologist", "Gastroenterologist"].map((spec) => {
              const isActive = speciality === spec;
              const isHovered = hoveredSpec === spec;

              // Combine base, active/inactive, and hover styles
              let itemStyle = {
                  ...getThemedStyles('filterItem', isActive),
                  '--tw-ring-color': theme.focusRingColor,
                  '--tw-ring-offset-color': theme.secondaryBackground // Offset from filter container BG
              };
              if (!isActive && isHovered) {
                  itemStyle = { ...itemStyle, ...getThemedStyles('filterItemHover') };
              }

              return (
                  <button
                      key={spec}
                      onClick={() => handleSpecialtyClick(spec)}
                      onMouseEnter={() => setHoveredSpec(spec)}
                      onMouseLeave={() => setHoveredSpec(null)}
                      className={`
                          w-full text-left pl-3 py-2 pr-4 border rounded-md transition-colors duration-150 ease-in-out cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1
                      `}
                      style={itemStyle} // Apply combined dynamic styles
                  >
                      {spec}
                      {isActive && <span className="text-xs ml-2 font-normal opacity-80">(Active)</span>}
                  </button>
              );
          })}
           {speciality && (
               <button
                  onClick={() => navigate('/doctor')}
                  className="w-full text-left pl-3 py-2 pr-4 mt-2 text-xs opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: theme.textColor }}
               >
                 Clear Specialty Filter
               </button>
           )}
        </div>

        {/* --- Doctor Cards Grid --- */}
        <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
           {filterDoc.length > 0 ? (
              filterDoc.map((item) => (
                 <div
                    key={item._id}
                    onClick={() => navigate(`/appointment/${item._id}`)}
                    className='border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-in-out shadow-sm hover:shadow-lg hover:-translate-y-1 flex flex-col'
                    style={getThemedStyles('card')}
                 >
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700">
                       <img
                          className="w-full h-full object-cover object-center"
                          src={item.image}
                          alt={`${item.name} - ${item.speciality}`}
                          onError={(e) => { e.target.src = '/default-avatar.png'; }} // Update path
                       />
                    </div>
                    <div className='p-4 flex flex-col flex-grow'>
                       <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                       <p className='text-sm opacity-80 mb-3'>{item.speciality}</p>
                       <div className='mt-auto pt-3 border-t' style={{ borderColor: theme.borderColor }}>
                          <div className='flex items-center gap-2 text-sm'>
                             <span className={`w-2.5 h-2.5 rounded-full ${item.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                             <span className={`${item.available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {item.available ? 'Available Now' : 'Unavailable'} {/* Slightly clearer text */}
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>
              ))
           ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-16">
                 <p className="text-lg opacity-75" style={{ color: theme.textColor }}>
                    No doctors found matching your criteria.
                 </p>
              </div>
           )}
        </div>
      </div>

      <AIChat />
    </div>
  );
};

export default Doctor;