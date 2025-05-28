import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";

const textVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8 } },
};

const Banner = () => {
  const navigate = useNavigate();
  const { token, user } = useContext(AppContext);

  const handleNavigation = () => {
    document.body.classList.add("fade-out");
    setTimeout(() => {
      navigate("/login");
      scrollTo(0, 0);
    }, 500);
  };

  return (
    <motion.div
      className="relative flex bg-[#d789d7] rounded-lg px-6 sm:px-14 md:px-12 my-20 md:mx-10 overflow-hidden shadow-xl h-[55vh]"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#d789d7] to-[#a36ba3] opacity-60 rounded-lg"></div>

      <div className="flex-1 py-8 sm:py-16 lg:py-24 lg:pl-5 text-white relative z-10">
        {token ? (
          <motion.div
            className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold"
            variants={textVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="tracking-wide">Welcome, {user?.name} 👋</p>
            <p className="mt-4">Your trusted healthcare partner</p>
          </motion.div>
        ) : (
          <motion.div
            className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold"
            variants={textVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="tracking-wide">Book Appointment</p>
            <p className="mt-4">With 100+ Trusted Doctors</p>
          </motion.div>
        )}

        {/* Create Account Button - Always visible when NOT logged in */}
        {!token && (
          <motion.button
            onClick={handleNavigation}
            className="bg-white text-sm sm:text-base text-gray-600 px-8 py-3 rounded-full mt-6 hover:scale-105 transition-all shadow-lg relative"
            whileHover={{
              boxShadow: "0px 0px 15px rgba(255, 255, 255, 0.8)",
              scale: 1.1,
            }}
            whileTap={{ scale: 0.95 }}
          >
            Create Account
          </motion.button>
        )}
      </div>

      <motion.div
        className="hidden md:block md:w-1/2 lg:w-[370px] relative z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <img
          className="w-full absolute bottom-0 right-0 max-w-md drop-shadow-lg"
          src={assets.appointment_img}
          alt="Doctor Appointment"
        />
      </motion.div>
    </motion.div>
  );
};

export default Banner;
