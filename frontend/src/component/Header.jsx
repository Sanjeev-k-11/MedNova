import React, { useState, useEffect, useContext } from 'react';
// Import assets you still need (like arrow_icon or group_profiles if not from backend)
import { assets } from '../assets/assets'; // Assuming this path is correct and you need assets.group_profiles / assets.arrow_icon
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext'; // Assuming context path is correct

// Assuming your backend URL is correctly configured
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const Header = () => {
  // AppContext provides token and userData for determining logged-in/out state
  const { token, userData } = useContext(AppContext);

  // State for the fetched configuration data
  const [headerConfig, setHeaderConfig] = useState(null);
  // State to track fetching status
  const [isLoading, setIsLoading] = useState(true);
  // State to track errors during fetching
  const [error, setError] = useState(null);

  // State for the current index of the image slider
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- Effect to Fetch Header Configuration on Component Mount ---
  useEffect(() => {
    const fetchHeaderConfig = async () => {
      setIsLoading(true); // Start loading state
      setError(null); // Clear previous errors
      try {
        // Fetch configuration from the NEW PUBLIC backend endpoint
        // This endpoint does NOT require authentication
        const response = await fetch(`${backendUrl}/api/user/header`); // <-- Updated URL

        if (!response.ok) {
          // If the response is not OK (e.g., 404, 500)
          const errorData = await response.json();
          // Throw an error with message from backend or default HTTP status message
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Assuming data.data contains the config object { name, images, loggedOutContent, loggedInContent, loggedOutButton, loggedInButton, ... }
        setHeaderConfig(data.data); // Set the fetched data to state

      } catch (err) {
        // Catch any errors during the fetch process
        console.error("Error fetching public header config:", err);
        setError(`Failed to fetch configuration: ${err.message}`); // Set the error state
        setHeaderConfig(null); // Ensure config state is null on error
      } finally {
        setIsLoading(false); // End loading state
      }
    };

    // Execute the fetch function immediately when the component mounts.
    fetchHeaderConfig();

  }, []); // Empty dependency array: runs only once on component mount.

  // --- Effect for Image Slider Timer ---
  useEffect(() => {
    // Only start the timer if headerConfig is loaded and contains images.
    if (!headerConfig || !headerConfig.images || headerConfig.images.length === 0) {
       setCurrentIndex(0); // Reset index if images disappear
      return;
    }

    // Ensure the current index is valid for the array of images just loaded/updated
    if (currentIndex >= headerConfig.images.length) {
        setCurrentIndex(0); // Reset index if it's out of bounds
    }

    const interval = setInterval(() => {
      // Cycle through the fetched images array length
      setCurrentIndex((prevIndex) => (prevIndex + 1) % headerConfig.images.length);
    }, 5000); // Increased interval for a slower, calmer pace (as per original)

    // Cleanup function
    return () => clearInterval(interval);

  }, [headerConfig, currentIndex]); // Dependencies: Restart timer if config changes or index is reset

  // --- Conditional Rendering: Loading, Error, or No Data ---

  if (isLoading) {
    return (
      <div className='relative w-full min-h-screen flex items-center justify-center bg-gray-900 text-white'>
        <p>Loading header configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='relative w-full min-h-screen flex items-center justify-center bg-gray-900 text-red-500'>
        <p>Error: {error}</p>
        {/* Decide on a fallback UI if config fetch fails */}
      </div>
    );
  }

   // If not loading and no error, but headerConfig is null or images array is empty/missing.
   if (!headerConfig || !headerConfig.images || headerConfig.images.length === 0) {
     // Decide how to render this state. A message is simple.
     return (
          <div className='relative w-full min-h-screen flex items-center justify-center bg-gray-900 text-gray-400'>
            <p>{headerConfig ? 'Header configuration loaded but no images available.' : 'Header configuration not available.'}</p>
             {/* Add static default content here */}
          </div>
     );
   }


  // --- If config is loaded and has images, render the full Header ---

  // Define animation variants for the container div and its children
  // This allows for staggering effects
  const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
          opacity: 1,
          transition: {
              staggerChildren: 0.15 // Controls the delay between child animations
          }
      },
      exit: {
          opacity: 0,
          transition: { duration: 0.5, ease: "easeOut" } // Speed of the overall exit animation
      }
  };

   // Variants for individual text/image items inside the container
  const itemVariants = {
      hidden: { opacity: 0, y: 30 }, // Start hidden, slightly below final position
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }, // Animate to visible, final position
      exit: { opacity: 0, y: -30, transition: { duration: 0.4, ease: "easeIn" } } // Animate out
  };


   // Get the current image object from the fetched config based on the slider index
  const currentImage = headerConfig.images[currentIndex];
   // Use the fetched altText, with a fallback
  const currentAltText = currentImage?.altText || `Background slide ${currentIndex + 1}`;

   // Determine which content and button configuration to use based on user authentication status
   const isLoggedIn = token && userData;
   const displayContent = isLoggedIn ? headerConfig.loggedInContent : headerConfig.loggedOutContent;
   const displayButton = isLoggedIn ? headerConfig.loggedInButton : headerConfig.loggedOutButton;


  return (
    // --- Root Container (Kept original styling) ---
    <div className='relative w-full min-h-screen overflow-hidden bg-gray-900'>

      {/* --- Image Slider (Kept original animation and styling) --- */}
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex} // Key change triggers AnimatePresence exit/enter animation
          // Use the URL from the fetched header configuration
          src={currentImage.url}
          // Use the alt text from the fetched header configuration
          alt={currentAltText}
          className='absolute top-0 left-0 w-full h-full object-cover' // Styling kept
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }} // Transition kept (image crossfade)
        />
      </AnimatePresence>

      {/* --- Darker Overlay (Kept original styling) --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/80"></div>

      {/* --- Overlay Content Container (Kept original styling) --- */}
      <div className='relative z-10 flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 md:px-10 lg:px-20 min-h-screen'>

        {/* === Dynamic Content (Logged In/Out) === */}
        {/* Use AnimatePresence mode="wait" for smooth transitions between login states */}
        <AnimatePresence mode="wait">
            {/* Render content block only if displayContent data is available */}
            {displayContent && (
               <motion.div
                 // Key must change based on login state to trigger AnimatePresence transition
                 key={isLoggedIn ? "logged-in-content" : "logged-out-content"} // Unique keys for AnimatePresence
                 variants={containerVariants} // Apply container variants for staggering effects on children
                 initial="hidden" // Start with container hidden
                 animate="visible" // Animate container to visible (triggers child animations)
                 exit="exit"      // Animate container out
                 className="flex flex-col items-center w-full max-w-2xl" // Styling kept
               >
                 {/* --- Conditional Content Structure based on Login Status --- */}
                 {isLoggedIn ? (
                     <> {/* Use a React Fragment to group the multiple elements in the logged-in view */}
                         {/* Heading 1: "Welcome back," (from backend config) */}
                         {displayContent.heading && ( // Render only if heading exists in config
                             <motion.h1
                                  variants={itemVariants} // Apply item animation
                                 className='text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-2' // Original H1 styling (mb-2)
                             >
                               {displayContent.heading}
                             </motion.h1>
                         )}

                         {/* Heading 2: User's Name (from AppContext) */}
                         {(userData?.name || 'User') && ( // Render only if user name (or fallback) exists
                             <motion.h2
                                 variants={itemVariants} // Apply item animation
                                 className='text-5xl md:text-6xl lg:text-7xl font-bold text-teal-300 mb-6 capitalize' // Original H2 styling (mb-6)
                             >
                                 {userData?.name?.split(' ')[0] || 'User'}! {/* Display user's first name or 'User' */}
                             </motion.h2>
                         )}

                          {/* Paragraph (from backend config) */}
                         {displayContent.paragraph && ( // Render only if paragraph exists in config
                             <motion.p
                                variants={itemVariants} // Apply item animation
                                className="text-lg md:text-xl font-light mb-8 max-w-lg"> {/* Styling kept */}
                                {displayContent.paragraph}
                             </motion.p>
                         )}
                     </>
                 ) : (
                     // --- Logged-out Content Structure (Replicating original design) ---
                     <> {/* Use a React Fragment to group the heading and the image+paragraph div */}
                         {/* Heading 1: "Book Appointment With Trusted Doctors" (from backend config) */}
                         {displayContent.heading && ( // Render only if heading exists in config
                             <motion.h1
                                 variants={itemVariants} // Apply item animation
                                 className='text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-5' // Original H1 styling for logged out (mb-5)
                             >
                                {/* Assuming the line break is handled by CSS/width or can be included in the backend string */}
                                {displayContent.heading}
                                {/* If you want the specific <br /> */}
                                {/* {"Book Appointment "} <br className="hidden sm:block" /> {"With Trusted Doctors"} */}
                             </motion.h1>
                         )}

                          {/* Image and Paragraph Block (Replicating original static structure with backend paragraph) */}
                         {/* We keep the static image here as it seems part of the logged-out visual design */}
                         <motion.div
                            variants={itemVariants} // Apply item animation to the container div
                            className='flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-base md:text-lg font-light mb-8' // Original div styling
                          >
                              {/* Static Image (Assuming it's still needed in the logged-out design) */}
                             {/* Ensure assets is imported: import { assets } from '../assets/assets'; */}
                             <img className='w-28 md:w-32 flex-shrink-0' src={assets.group_profiles} alt='Illustrative group profiles' />

                             {/* Paragraph (from backend config) */}
                              {displayContent.paragraph && ( // Render only if paragraph exists in config
                               <p className="max-w-sm"> {/* Styling kept */}
                                   {displayContent.paragraph}
                               </p>
                             )}
                         </motion.div>
                     </>
                 )}
               </motion.div>
            )}
          </AnimatePresence>
          {/* === End Dynamic Content === */}


          {/* --- Dynamic Call to Action Button (Kept original styling and animations) --- */}
          {/* Render button only if the determined displayButton object exists */}
           {displayButton && (
             <motion.a
                // Use the link from the fetched header configuration button data
                href={displayButton.link}
                 // Kept original button styling and animations
                className='flex items-center gap-2.5 bg-white px-7 py-3.5 rounded-full text-gray-800 text-base md:text-lg font-semibold mt-6 hover:bg-gray-100 transition-all duration-300 ease-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50'
                whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.2, ease: "easeOut" } }}
                whileTap={{ scale: 0.98 }}
             >
               {/* Use the text from the fetched header configuration button data */}
               {displayButton.text}
               {/* Keep or remove the arrow icon based on whether it's part of your design */}
               {/* If 'assets' import is removed, you need to remove this too */}
                <img className='w-3.5 ml-1' src={assets.arrow_icon} alt='' />
             </motion.a>
          )}
        </div>
        {/* --- Dots Navigation --- */}
        {/* Show dots only if there is more than one image fetched */}
        {headerConfig.images.length > 1 && (
            <div className='absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2.5 z-10'> {/* Styling kept */}
              {/* Map over the fetched images array to create dots */}
              {headerConfig.images.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all duration-400 ease-in-out focus:outline-none focus:ring-1 focus:ring-white/80 focus:ring-offset-1 focus:ring-offset-black/60 ${
                    currentIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  onClick={() => setCurrentIndex(index)} // Keep click handler to change index
                />
              ))}
            </div>
        )}
      </div>
  );
};

export default Header;