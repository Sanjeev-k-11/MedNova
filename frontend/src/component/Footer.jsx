import React from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPhone, FaEnvelope, FaHeartbeat } from "react-icons/fa";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#5d54a4] rounded-xl mt-10 text-white py-14 px-6 md:px-12 lg:px-20">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14">
        {/* Left Section */}
        <div>
          <img className="mb-5 w-40" src={assets.logo} alt="Logo" />
          <p className="w-full md:w-2/3 leading-6 text-gray-200">
            Your Health, Our Priority! Find trusted doctors, book appointments seamlessly, 
            and take charge of your well-being. Secure, hassle-free healthcare at your fingertips.
          </p>
        </div>

        {/* Company Section - Kept Unchanged */}
        <div>
          <p className="text-xl font-medium mb-5">Company</p>
          <ul className="flex flex-col gap-2 text-gray-300">
            <li>
              <a
                onClick={() => {
                  navigate("/");
                  window.scrollTo(0, 0);
                }}
                className="hover:underline cursor-pointer transition-all duration-300 hover:text-gray-100"
              >
                Home
              </a>
            </li>
            <li>
              <a
                onClick={() => {
                  navigate("/about");
                  window.scrollTo(0, 0);
                }}
                className="hover:underline cursor-pointer transition-all duration-300 hover:text-gray-100"
              >
                About us
              </a>
            </li>
            <li>
              <a
                onClick={() => {
                  navigate("/contact");
                  window.scrollTo(0, 0);
                }}
                className="hover:underline cursor-pointer transition-all duration-300 hover:text-gray-100"
              >
                Contact us
              </a>
            </li>
            <li>
              <a
                onClick={() => {
                  navigate("/privacy");
                  window.scrollTo(0, 0);
                }}
                className="hover:underline cursor-pointer transition-all duration-300 hover:text-gray-100"
              >
                Privacy policy
              </a>
            </li>
          </ul>
        </div>

        {/* Right Section - Contact Details */}
        <div className="bg-red-700 rounded-lg p-6 shadow-xl text-white max-w-sm w-full">
          <p className="text-lg font-semibold">Get in Touch</p>
          <ul className="flex flex-col gap-3 text-gray-300 mt-3">
            <li className="flex items-center gap-2">
              <FaPhone className="text-lg text-gray-100" /> +111111111111
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-lg text-gray-100" /> sk546@gmail.com
            </li>
            <li className="flex items-center gap-2">
              <FaHeartbeat className="text-lg text-red-300" /> 24/7 Emergency Support
            </li>
          </ul>
        </div>
      </div>

      {/* Divider & Copyright */}
      <div className="mt-10">
        <hr className="border-gray-400" />
        <motion.p
          className="py-5 text-center text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          © 2024 MedNova - All Rights Reserved.
        </motion.p>
      </div>
    </div>
  );
};

export default Footer;
