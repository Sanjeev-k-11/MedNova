import React from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import Theme Stuff
import { ThemeProvider, useTheme } from "./context/ThemeContext"; // Adjust path if needed

// Components
import Nevbar from "./component/Nevbar"; // Assuming Nevbar is your Navbar component
import Footer from "./component/Footer";

// Pages (assuming paths are correct)
import Home from "./pages/Home";
import Doctor from "./pages/Doctor";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import MyAppointments from "./pages/MyAppointments";
import Appointment from "./pages/Appointment";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import MedicineList from "./pages/MedicineList";
import MyMedicines from "./pages/MyMedicines";

// Create a new component to consume the theme context
const ThemedAppContent = () => {
  const { currentTheme } = useTheme();

  return (
    // Apply main background and text color here
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 ease-in-out" // Kept min-h-screen, flex, flex-col, transition
      style={{
        backgroundColor: currentTheme.bgColor,
        color: currentTheme.textColor,
      }}
    >
      {/* Toast Notification Container */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* Navigation Bar */}
      <Nevbar /> {/* Nevbar now handles its own theme styles */}

      {/* Main Content Area - Adjusted for Full Width */}
      {/* Use flex-grow to make this area take up remaining space */}
      {/* REMOVED max-w-screen-xl and mx-auto */}
      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6"> {/* Kept padding for content spacing */}
        {/* Content will now stretch full width, but padding remains */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/doctor/:speciality" element={<Doctor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/appointment/:docId" element={<Appointment />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/medicine" element={<MedicineList />} />
          <Route path="/my-medicines" element={<MyMedicines />} />
         
           {/* Consider adding a 404 Not Found Route */}
           <Route path="*" element={<div className="text-center py-10">404 - Page Not Found</div>} /> {/* Added basic styling */}
        </Routes>
      </main>

      {/* Footer */}
      <Footer /> {/* Footer now handles its own theme styles */}
    </div>
  );
}


const App = () => {
  return (
    // Provide the theme context to the entire application
    <ThemeProvider>
      <ThemedAppContent />
    </ThemeProvider>
  );
};

export default App;
