import React, { useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/doctorContext';
import { useTheme } from '../context/ThemeContext';
import { StaffContext } from '../context/StaffContext'; // Ensure path is correct

const Sidebar = () => {
  const { currentTheme } = useTheme();
  const { token: adminToken } = useContext(AdminContext);
  const { dtoken: doctorToken } = useContext(DoctorContext);

  // Get context values - Assuming context provides isLoadingProfile for better UX
  // profileData should contain the 'role' property
  const { staffToken, profileData, getProfileData, isLoadingProfile, error: profileError } = useContext(StaffContext);

  // Fetch profile data when needed
  useEffect(() => {
    // Fetch only if staffToken exists, profileData is not yet loaded,
    // it's not currently loading, and there wasn't a previous load error
    if (staffToken && !profileData && !isLoadingProfile && !profileError) {
      console.log("Sidebar triggering staff profile fetch...");
      getProfileData();
    }
  }, [staffToken, profileData, getProfileData, isLoadingProfile, profileError]); // Add error to dependencies

  // --- Link Definitions for each role ---
  const adminLinks = [
    { to: '/admin-dashboard', icon: assets.home_icon, label: 'Dashboard' },
    { to: '/all-appointments', icon: assets.appointment_icon, label: 'Appointments' },
    { to: '/add-doctor', icon: assets.add_icon, label: 'Add Doctor' },
    { to: '/medicine-add', icon: assets.add_icon, label: 'Add Medicine' },
    { to: '/staf-add', icon: assets.add_icon, label: 'Add Staff' },
    { to: '/doctor-list', icon: assets.people_icon, label: 'Doctor List' },
    { to: '/medicine-list', icon: assets.list_icon, label: 'Medicine List' },
    { to: '/purchases', icon: assets.list_icon, label: 'Purchases' },
    { to: '/staff-list', icon: assets.list_icon, label: 'Staff List' },
    { to: '/AllUser', icon: assets.list_icon, label: 'User' },

    // Add other admin specific links
  ];

  const doctorLinks = [
    { to: '/doctor-dashboard', icon: assets.home_icon, label: 'Dashboard' },
    { to: '/doctor-appointments', icon: assets.appointment_icon, label: 'Appointments' },
    { to: '/doctor-profile', icon: assets.people_icon, label: 'Profile' },
    // Add other doctor specific links
  ];

  // Links specific to the 'nurse' role
  const nurseLinks = [
    { to: '/staff-dashboard', icon: assets.home_icon, label: 'Dashboard' },
    { to: '/patientList', icon: assets.list_icon, label: 'Patient List' },
    { to: '/Schedule', icon: assets.appointment_icon, label: 'Schedule' }, // Nurse Schedule
    { to: '/wards', icon: assets.home_icon, label: 'Ward Management' }, // Example Nurse Link
    // Add other nurse specific links
  ];

  // Links specific to the 'receptionist' role
  const receptionistLinks = [
    { to: '/staff-dashboard', icon: assets.home_icon, label: 'Dashboard' },
    { to: '/Schedule', icon: assets.appointment_icon, label: 'Schedule' }, // Receptionist Schedule/Appointments
    { to: '/patient', icon: assets.add_icon, label: 'Add Patient' },
    { to: '/patientList', icon: assets.list_icon, label: 'Patient List' },
   
    // Add other receptionist specific links
  ];

  // Links specific to the generic 'staff' role (if different from others)
  const staffGenericLinks = [
    { to: '/staff-dashboard', icon: assets.home_icon, label: 'Dashboard' },
    { to: '/Schedule', icon: assets.appointment_icon, label: 'Schedule' }, // General Schedule
    { to: '/contact', icon: assets.people_icon, label: 'Contact Info' },
    { to: '/Department/Location', icon: assets.people_icon, label: 'Nurse department' },
    { to: '/student-add', icon: assets.people_icon, label: 'student Add' },
    { to: '/students', icon: assets.people_icon, label: 'all student' },
    
    // Add other generic staff specific links
  ];

  // Links specific to the 'technician' role
  const technicianLinks = [
    { to: '/staff-dashboard', icon: assets.home_icon, label: 'Dashboard' },
    { to: '/Schedule', icon: assets.appointment_icon, label: 'Procedure Schedule' }, // Technician Schedule
    { to: '/equipment', icon: assets.list_icon, label: 'Equipment Management' }, // Example Technician Link
    // Add other technician specific links
  ];

  // --- Link Rendering Function --- (Keep your existing renderLinks function)
  const renderLinks = (links) => (
    <ul className="space-y-1.5 mt-4 relative">
      {links.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            style={({ isActive }) => ({
              color: currentTheme.textColor, // Use text color from theme
            })}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 w-full rounded-md transition-all duration-200 ease-in-out group relative ${
                isActive
                  ? `bg-${currentTheme.accentColor}-100 dark:bg-${currentTheme.accentColor}-900/60 border-r-4 border-${currentTheme.accentColor}-600 dark:border-${currentTheme.accentColor}-400 font-semibold text-${currentTheme.accentColor}-800 dark:text-${currentTheme.accentColor}-100 shadow-inner`
                  : `hover:bg-black/10 dark:hover:bg-white/10`
              }`
            }
            title={item.label}
          >
            <img
              className="w-5 h-5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
              src={item.icon}
              alt=""
              role="img"
              aria-hidden="true"
            />
            <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {item.label}
            </span>
          </NavLink>
        </li>
      ))}
    </ul>
  );

  // --- Determine Links to Render ---
  let linksToRenderArray = null; // Use array here
  let userRole = 'None';

  if (adminToken) {
    linksToRenderArray = adminLinks;
    userRole = 'Admin';
  } else if (doctorToken) {
    linksToRenderArray = doctorLinks;
    userRole = 'Doctor';
  } else if (staffToken) {
    // For staff, links depend on the fetched profile data's role
    userRole = `Staff${profileData?.role ? ` (${profileData.role})` : ''}`; // Display specific role if available

    // Determine links only AFTER profile data is loaded and not loading
    if (!isLoadingProfile && profileData) {
      const staffRoleLower = profileData.role.toLowerCase();

      switch (staffRoleLower) {
        case 'nurse':
          linksToRenderArray = nurseLinks;
          break;
        case 'receptionist':
          linksToRenderArray = receptionistLinks;
          break;
        case 'technician':
           linksToRenderArray = technicianLinks;
           break;
        case 'staff': // This is the 'staff' role specifically
          linksToRenderArray = staffGenericLinks;
          break;
        default:
          // Handle unexpected roles or roles that might have a default view
          console.warn(`Unknown staff role: ${profileData.role}. Using generic staff links.`);
          linksToRenderArray = staffGenericLinks; // Fallback
          break;
      }
    } else if (!isLoadingProfile && profileError) {
         // If profile failed to load after trying
         console.error("Failed to load staff profile, sidebar may be incomplete.", profileError);
         // Optionally show a minimal sidebar or error message here
         // For now, linksToRenderArray remains null, showing loading/error state
         userRole = 'Staff (Error)'; // Indicate an error
    }
     // If isLoadingProfile is true, linksToRenderArray remains null,
     // and the loading message is shown in the render block.
  }


  // --- Component Return ---
  // Decide if sidebar should be visible at all
  const isSidebarVisible = adminToken || doctorToken || staffToken;

  return (
    <aside
      className={`w-60 h-screen fixed top-0 left-0 flex flex-col shadow-lg dark:shadow-gray-900/50 transition-colors duration-300 z-40 border-r border-gray-200 dark:border-gray-700 ${!isSidebarVisible ? 'hidden' : ''}`}
      style={{ backgroundColor: currentTheme.sidebarBgColor }}
      aria-label="Main Navigation"
    >
      {isSidebarVisible && ( // Only render header if sidebar is visible
        <>
          <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 text-center">
            <span style={{ color: currentTheme.textColor }} className="font-bold text-xl">YourApp</span>
            {/* Display role based on token or loaded staff profile */}
            <span style={{ color: currentTheme.textColor }} className="block text-xs opacity-70 mt-1">{userRole} Panel</span>
          </div>

          {/* Conditional rendering based on loading state for STAFF */}
          {staffToken && isLoadingProfile && !profileData && !profileError && (
             <div className="px-3 py-4 flex-grow">
                {/* Optionally render base links even while loading if desired, but showing a message is clearer */}
                <p className="p-4 text-center text-xs" style={{ color: currentTheme.textColor }}>Loading menu...</p>
             </div>
           )}

           {/* Show error message if staff profile failed to load */}
           {staffToken && !isLoadingProfile && profileError && (
              <div className="px-3 py-4 flex-grow">
                 <p className="p-4 text-center text-xs text-red-600 dark:text-red-400">Error loading menu.</p>
                 {/* Optionally add a retry button */}
              </div>
           )}


          {/* Render determined links only when not loading (or for admin/doctor who don't load profile) */}
          {/* This condition is true if linksToRenderArray is set AND (it's not staff OR staff profile is loaded) */}
          {linksToRenderArray && (!staffToken || (staffToken && !isLoadingProfile && profileData)) && (
            <div className="px-3 py-4 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-10">
              {renderLinks(linksToRenderArray)}
            </div>
          )}

           {/* If staffToken exists but no profile data AND not loading/error (shouldn't happen if useEffect works) */}
           {/* Add a fallback or warning if staffToken exists but no links were determined */}
           {staffToken && !isLoadingProfile && !profileData && !profileError && (
              <div className="px-3 py-4 flex-grow">
                 <p className="p-4 text-center text-xs text-yellow-600 dark:text-yellow-400">Staff profile data missing.</p>
              </div>
           )}
        </>
      )}
    </aside>
  );
};

export default Sidebar;