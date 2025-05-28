import React, { useState, useEffect, useContext } from "react";
import axios from 'axios';
import { motion } from "framer-motion";
import AIChat from '../component/AIChat';
import { useTheme } from '../context/ThemeContext';
import { AppContext } from '../context/AppContext'; // Adjust path
import { assets } from "../assets/assets"; // Keep fallback image import

// Import Icons (Example using Feather icons, choose any set you like)
import { FiMapPin, FiPhone, FiMail, FiBriefcase, FiLifeBuoy } from 'react-icons/fi'; // Example icons

const Contact = () => {
  const { currentTheme } = useTheme();
  // Define theme colors or fallbacks more explicitly
  const textColor = currentTheme.textColor || '#333'; // Default text
  const primaryColor = currentTheme.primaryColor || '#2563EB'; // Default blue-600
  const accentColor = currentTheme.accentColor || '#D1D5DB'; // Default gray-300 for borders/bg accents
  const headingColor = currentTheme.headingColor || '#1F2937'; // Default darker gray/black for headings
  const cardBgColor = currentTheme.cardBgColor || '#FFFFFF'; // Default white for cards
  const cardBgOpacity = currentTheme.cardBgOpacity || 'bg-opacity-80'; // Control card background opacity if theme allows
  const subtleBgColor = currentTheme.subtleBgColor || '#F9FAFB'; // Very light gray page background

  const { backendUrl } = useContext(AppContext);

  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContactInfo = async () => {
      if (!backendUrl) {
        setError("Backend URL is not configured.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/user/contact`); // Ensure this is the correct PUBLIC endpoint
        if (response.data?.success && response.data?.data) {
          setContactData(response.data.data);
        } else {
          setError(response.data?.message || "Contact information not found.");
          setContactData(null);
        }
      } catch (err) {
        console.error("Error fetching contact data:", err);
        setError(err.response?.data?.message || "Failed to load contact information.");
        setContactData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchContactInfo();
  }, [backendUrl]);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const imageVariants = {
     hidden: { opacity: 0, x: -50 },
     visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  }

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ backgroundColor: subtleBgColor, color: textColor }}>
        Loading Contact Information...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] px-6 md:px-12 lg:px-20 py-14 flex flex-col items-center justify-center text-center" style={{ backgroundColor: subtleBgColor, color: currentTheme.errorColor || 'red' }}>
        <h2 className="text-2xl font-semibold mb-4">Oops! Something went wrong.</h2>
        <p className="mb-6">{error}</p>
        {error !== "Backend URL is not configured." && <p>Please try refreshing the page.</p>}
        <div className="mt-10 w-full max-w-2xl">
            <AIChat />
        </div>
      </div>
    );
  }

  if (!contactData) {
     return (
       <div className="min-h-[60vh] px-6 md:px-12 lg:px-20 py-14 flex flex-col items-center justify-center text-center" style={{ backgroundColor: subtleBgColor, color: textColor }}>
        <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
        <p>Details are currently unavailable.</p>
         <div className="mt-10 w-full max-w-2xl">
            <AIChat />
        </div>
       </div>
     );
   }

  // --- Success State ---
  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-12 lg:px-20 py-16 md:py-20" style={{ backgroundColor: subtleBgColor, color: textColor }}>
      <motion.div
        className="text-center mb-16"
        initial="hidden"
        animate="visible"
        variants={itemVariants}
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight" style={{ color: headingColor }}>
          CONTACT <span style={{ color: primaryColor }}>US</span>
        </h1>
        <p className="mt-4 text-lg opacity-80 max-w-2xl mx-auto">
          Get in touch with us for any inquiries, support, or career opportunities.
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start" // Changed from justify-center
        variants={containerVariants}
        initial="hidden"
        whileInView="visible" // Animate when scrolled into view
        viewport={{ once: true, amount: 0.2 }} // Trigger animation once when 20% is visible
      >
        {/* Image Section */}
        <motion.div
          className="w-full lg:w-5/12 xl:w-4/12 flex-shrink-0" // Control width more precisely
          variants={imageVariants}
        >
          <img
            className="w-full h-auto rounded-xl shadow-lg object-cover aspect-[4/3]" // Aspect ratio for consistency
            src={contactData.contactImage || assets.contact_image}
            alt="Mednova Contact illustration"
            style={{ border: `1px solid ${accentColor}30` }} // Subtle border matching theme accent
          />
        </motion.div>

        {/* Details Section */}
        <motion.div
          className="w-full lg:w-7/12 xl:w-8/12 flex flex-col gap-8"
          variants={containerVariants} // Use container variants to stagger children below
        >
          {/* Office Section Card */}
          <motion.div
            className={`p-6 sm:p-8 rounded-lg shadow-md ${cardBgOpacity}`}
            style={{ backgroundColor: cardBgColor, border: `1px solid ${accentColor}50` }}
            variants={itemVariants}
          >
            <h3 className="text-2xl font-semibold mb-5 flex items-center gap-3" style={{ color: headingColor }}>
               <FiMapPin style={{ color: primaryColor }} />
               {contactData.officeHeading || 'Our Office'}
            </h3>
            <div className="space-y-3 text-base sm:text-lg opacity-90">
              {contactData.contactName && <p>{contactData.contactName}</p>}
              {contactData.location && <p className="flex items-start gap-2"><FiMapPin className="mt-1 text-sm flex-shrink-0" style={{ color: primaryColor }}/><span>{contactData.location}</span></p>}
              {contactData.primaryPhoneNumber && (
                <p className="flex items-center gap-2">
                  <FiPhone className="text-sm flex-shrink-0" style={{ color: primaryColor }}/>
                  <a href={`tel:${contactData.primaryPhoneNumber}`} className="hover:underline" style={{ color: primaryColor }}>{contactData.primaryPhoneNumber}</a>
                </p>
              )}
              {contactData.secondaryPhoneNumber && (
                <p className="flex items-center gap-2">
                   <FiPhone className="text-sm flex-shrink-0" style={{ color: primaryColor }}/>
                   <a href={`tel:${contactData.secondaryPhoneNumber}`} className="hover:underline" style={{ color: primaryColor }}>{contactData.secondaryPhoneNumber}</a>
                </p>
              )}
              {contactData.email && (
                <p className="flex items-center gap-2">
                  <FiMail className="text-sm flex-shrink-0" style={{ color: primaryColor }}/>
                  <a href={`mailto:${contactData.email}`} className="hover:underline break-all" style={{ color: primaryColor }}>{contactData.email}</a>
                </p>
              )}
            </div>
          </motion.div>

          {/* Careers Section Card */}
           {(contactData.careersHeading || contactData.careersDescription || (contactData.careersButtonLink && contactData.careersButtonText)) && ( // Only render if there's content
            <motion.div
                className={`p-6 sm:p-8 rounded-lg shadow-md ${cardBgOpacity}`}
                style={{ backgroundColor: cardBgColor, border: `1px solid ${accentColor}50` }}
                variants={itemVariants}
            >
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3" style={{ color: headingColor }}>
                <FiBriefcase style={{ color: primaryColor }} />
                {contactData.careersHeading || 'Careers at Mednova'}
                </h3>
                {contactData.careersDescription && <p className="mb-5 text-base sm:text-lg opacity-90">{contactData.careersDescription}</p>}
                {contactData.careersButtonLink && contactData.careersButtonText && (
                <a
                    href={contactData.careersButtonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block" // Make the anchor inline-block for button styles
                >
                    <motion.button
                        className="px-6 py-3 rounded-md transition duration-300 shadow-md font-medium text-white" // Removed border, added font-medium
                        style={{ backgroundColor: primaryColor }}
                        whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }} // Enhanced hover effect
                        whileTap={{ scale: 0.95 }}
                    >
                    {contactData.careersButtonText}
                    </motion.button>
                </a>
                )}
            </motion.div>
           )}

          {/* Support Section Card */}
          {(contactData.supportHeading || contactData.supportDescription) && ( // Only render if there's content
            <motion.div
                className={`p-6 sm:p-8 rounded-lg shadow-md ${cardBgOpacity}`}
                style={{ backgroundColor: cardBgColor, border: `1px solid ${accentColor}50` }}
                variants={itemVariants}
            >
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3" style={{ color: headingColor }}>
                <FiLifeBuoy style={{ color: primaryColor }}/>
                {contactData.supportHeading || 'Reliability & Support'}
                </h3>
                {contactData.supportDescription && <p className="text-base sm:text-lg opacity-90">{contactData.supportDescription}</p>}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

       {/* AI Chat Section - Positioned below main content */}
       <motion.div
          className="mt-16 md:mt-20 w-full max-w-4xl mx-auto" // Center and constrain width
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
       >
          <AIChat />
       </motion.div>
    </div>
  );
};

export default Contact;