import React from "react";
import { assets } from "../assets/assets";
import { motion } from "framer-motion";
import AIChat from '../component/AIChat';
import { useTheme } from '../context/ThemeContext'; // <--- 1. Import useTheme

const About = () => {
  const { currentTheme } = useTheme(); // <--- 2. Get the current theme

  return (
    // Apply base theme text color to the main container
    <div
      className="px-6 md:px-12 lg:px-20 py-10" // Removed text-gray-700
      style={{ color: currentTheme.textColor }} // <--- 3. Apply base text color
    >
      {/* Heading - Inherits theme color, keeps blue span */}
      <motion.div
        className="text-center text-3xl font-semibold pt-10" // Removed text-gray-800
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        ABOUT <span className="text-blue-600">US</span> {/* Keep blue for emphasis */}
      </motion.div>

      {/* Content Section */}
      <div className="my-16 flex flex-col md:flex-row gap-12 items-center">
        {/* Image */}
        <motion.img
          className="w-full md:max-w-[400px] rounded-lg shadow-lg"
          src={assets.about_image}
          alt="About Us"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        />

        {/* Text Content - Inherits theme color */}
        <motion.div
          className="flex flex-col justify-center gap-6 md:w-2/4 text-lg"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Paragraphs inherit theme color */}
          <p className="opacity-90"> {/* Optional: Added slight opacity */}
            Welcome to <span className="font-bold text-blue-600">MEDNOVA</span>, your trusted partner in managing your healthcare
            needs conveniently and efficiently. At MedNova, we understand the
            challenges individuals face when it comes to scheduling doctor
            appointments and managing their health records.
          </p>
          <p className="opacity-90">
            MedNova is committed to excellence in healthcare technology. We
            continuously strive to enhance our platform, integrating the latest
            advancements to improve user experience and deliver superior service.
          </p>
          {/* Vision heading inherits theme color */}
          <b className="text-xl font-bold">Our Vision</b>
          {/* Vision paragraph inherits theme color */}
          <p className="opacity-90">
            Our vision is to create a seamless healthcare experience for every user.
            We aim to bridge the gap between patients and healthcare providers,
            making it easier for you to access the care you need when you need it.
          </p>
        </motion.div>
      </div>

      {/* WHY CHOOSE US Section */}
      <div className="mt-16">
         {/* Heading inherits theme color */}
        <h3 className="text-3xl font-semibold text-center mb-10">
          WHY CHOOSE US
        </h3>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {[
            {
              title: "EFFICIENCY",
              description: "Streamlined appointment scheduling that fits into your busy lifestyle.",
            },
            {
              title: "CONVENIENCE",
              description: "Access to a network of trusted healthcare professionals in your area.",
            },
            {
              title: "PERSONALIZATION",
              description: "Tailored recommendations and reminders to help you stay on top of your health.",
            },
            {
              title: "RELIABILITY",
              description: "Secure and verified appointments, ensuring your peace of mind.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              // Card keeps its specific styles (bg-white, etc.) for contrast and design
              className="p-6 border rounded-lg shadow-md transition duration-300 transform
                         bg-white hover:bg-blue-50 hover:shadow-lg hover:scale-105"
              whileHover={{ scale: 1.05 }}
            >
              {/* Card Title - Keep specific blue for emphasis */}
              <h4 className="text-xl font-bold text-blue-600 transition duration-300">
                {feature.title}
              </h4>
              {/* Card Description - Keep specific gray for readability on white background */}
              <p className="text-gray-600 mt-3">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        {/* AIChat component */}
        <AIChat />
      </div>
    </div>
  );
};

export default About;