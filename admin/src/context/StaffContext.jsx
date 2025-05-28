import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios'; // ✅ Needed for API calls

export const StaffContext = createContext();

export const StaffContextProvider = ({ children }) => {
  const [staffToken, setStaffToken] = useState(localStorage.getItem('authToken') || '');
  const [profileData, setProfileData] = useState(null); // ✅ Add profile state

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  // ✅ Keep localStorage in sync with token
  useEffect(() => {
    if (staffToken) {
      localStorage.setItem('authToken', staffToken);
    } else {
      localStorage.removeItem('authToken');
      setProfileData(null); // Clear profile if token is removed
    }
  }, [staffToken]);

  const getProfileData = async () => {
    console.log("Attempting to fetch staff profile data from context...");
    if (!staffToken) {
      console.error("Cannot fetch profile: No staff token found in context.");
      return;
    }

    try {
      const response = await axios.get(`${backendUrl}/api/staff/profile`, {
        headers: { Authorization: `Bearer ${staffToken}` }
      });

      if (response.data?.success) {
        console.log("Profile data fetched successfully:", response.data.profile);
        setProfileData(response.data.profile);
      } else {
        console.error("Failed to fetch profile data:", response.data.message);
        setProfileData(null);
      }
    } catch (error) {
      console.error("Error fetching staff profile:", error.response?.data?.message || error.message);
      setProfileData(null);
    }
  };

  const contextValue = {
    staffToken,
    setStaffToken,
    backendUrl,
    profileData,
    setProfileData,
    getProfileData,
  };

  return (
    <StaffContext.Provider value={contextValue}>
      {children}
    </StaffContext.Provider>
  );
};
