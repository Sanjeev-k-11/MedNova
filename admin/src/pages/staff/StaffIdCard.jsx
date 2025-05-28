// src/components/StaffIdCard.jsx
import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import {
  User,
  Briefcase,
  Hash,
  CheckCircle,
  XCircle,
  MapPin,
  Globe,
  Mail,
  Phone,
} from "lucide-react";

const StaffIdCard = ({ staffData }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!staffData) {
      return (
          <div className="w-80 max-w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              <p className="text-sm">Staff data not available for ID card.</p>
          </div>
      );
  }

  // Placeholder College/Company Information (Hardcoded for demonstration)
  // Match structure from image
  const collegeInfo = {
      name: "medical college",
      address: {
          line1: "madhubani",
          line2: "maharaj ganj,madhubani", // Optional
          city: "Madhubani",
          state: "Bihar", // Or Region/Province
          postalCode: "847211",
          country: "India"
      },
      
      contactEmail: "sy781405@gmail.com",
      contactPhone: "9534757076",
      // Add other details like founding year, motto, etc.
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    // --- Outer Container: Sets perspective and handles size/centering ---
    <div
        className="flip-container w-80 max-w-full mx-auto rounded-lg shadow-xl cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
        aria-label="Flip Staff ID Card"
    >
      {/* --- Flip Card: This is the element that rotates --- */}
      <div className={`flip-card w-full rounded-lg ${isFlipped ? 'is-flipped' : ''}`}>

        {/* --- Front Side --- */}
        {/* Use a dark background here too for consistency if desired, or keep white */}
        <div className="flip-card-front w-full h-full bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center">
            {/* Company Logo/Name Placeholder (Front) */}
            <div className="mb-4">
              <span className="text-xl font-semibold text-sky-600 dark:text-sky-400">medical college</span>
            </div>

            {/* Profile Image */}
            <div className="w-24 h-24 mb-4 rounded-full overflow-hidden border-4 border-sky-200 dark:border-sky-600 bg-gray-100 dark:bg-gray-600 shadow-inner">
                 <img
                    src={staffData.image || assets.default_profile}
                    alt={`${staffData.name}'s profile picture`}
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = assets.default_profile}
                />
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{staffData.name || 'Staff Name'}</h2>

            {/* Role */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{staffData.role || 'Role'}</p>

            {/* Separator */}
            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>

            {/* Key Details (VID, Status) */}
            <div className="w-full text-left space-y-3">
              {/* Staff ID (VID) */}
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" title="Staff ID (VID)" />
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Staff ID (VID)</p>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 break-all">{staffData.vid || 'N/A'}</span>
                </div>
              </div>

              {/* Status */}
               <div className="flex items-center gap-2">
                  {staffData.isActive ?
                     <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" title="Status: Active"/>
                     :
                     <XCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" title="Status: Inactive"/>
                  }
                  <div>
                       <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Status</p>
                       <span className={`text-sm font-medium ${staffData.isActive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {staffData.isActive ? 'Active' : 'Inactive'}
                       </span>
                  </div>
               </div>
            </div>
        </div> {/* End Front Side */}


        {/* --- Back Side --- */}
        {/* Match image styles: dark background, specific padding, rounded corners, border */}
        {/* Changed text color back to gray-200 as main text color */}
        <div className="flip-card-back w-full h-full bg-[#1f2937] p-6 rounded-lg border border-[#374151] text-left text-gray-200">

           {/* Header Matching Image */}
           {/* Adjusted font size, weight, and color to match image */}
           <h3 className="text-lg font-bold text-white mb-6 uppercase">Mednova / Mednova.store</h3>

           {/* Content Grid/Layout Matching Image */}
           {/* Use space-y for spacing between these content blocks */}
           <div className="w-full space-y-5"> {/* Adjusted space-y value based on visual estimation */}

              {/* Name Section - No icon, just label and value */}
              <div>
                 <p className="text-xs text-gray-400 uppercase font-semibold mb-1 leading-none">NAME</p> {/* Added leading-none for tight fit */}
                 <span className="text-sm font-medium text-gray-200">{collegeInfo.name}</span>
              </div>

              {/* Address Section - Icon + Label/Value block */}
              {/* Use flex items-start for vertical alignment of icon */}
              <div className="flex items-start gap-3"> {/* Gap between icon and text block */}
                  <MapPin size={16} className="text-gray-500 flex-shrink-0 mt-1"/> {/* Gray icon, mt-1 aligns with first line */}
                  <div> {/* Container for label and value */}
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1 leading-none">ADDRESS</p>
                      <span className="text-sm text-gray-200 leading-relaxed">
                          {collegeInfo.address.line1}<br/>
                          {collegeInfo.address.line2 && <>{collegeInfo.address.line2}<br/></>}
                          {collegeInfo.address.city}, {collegeInfo.address.state} {collegeInfo.address.postalCode}<br/>
                          {collegeInfo.address.country}
                      </span>
                  </div>
              </div>


              {/* Contact Email Section - Icon + Label/Value block */}
              {collegeInfo.contactEmail && (
                  <div className="flex items-start gap-3">
                      <Mail size={16} className="text-gray-500 flex-shrink-0 mt-1"/> {/* Gray icon, mt-1 aligns with first line */}
                      <div>
                          <p className="text-xs text-gray-400 uppercase font-semibold mb-1 leading-none">EMAIL</p>
                          <a href={`mailto:${collegeInfo.contactEmail}`} className="text-sm text-gray-200 hover:underline break-all">{collegeInfo.contactEmail}</a> {/* Lighter gray value */}
                      </div>
                  </div>
              )}

               {/* Contact Phone Section - Icon + Label/Value block */}
              {collegeInfo.contactPhone && (
                   <div className="flex items-start gap-3">
                       <Phone size={16} className="text-gray-500 flex-shrink-0 mt-1"/> {/* Gray icon, mt-1 aligns with first line */}
                       <div>
                           <p className="text-xs text-gray-400 uppercase font-semibold mb-1 leading-none">PHONE</p>
                           <a href={`tel:${collegeInfo.contactPhone}`} className="text-sm text-gray-200 hover:underline break-all">{collegeInfo.contactPhone}</a> {/* Lighter gray value */}
                       </div>
                   </div>
               )}
           </div> {/* End Content Layout */}

           {/* Optional: Footer note */}
           {/*
           <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
               This card is the property of {collegeInfo.name}.
           </div>
           */}
        </div> {/* End Back Side */}

      </div> {/* End Flip Card */}

      {/* --- Style Block for 3D Flip --- */}
      <style jsx>{`
        .flip-container {
            perspective: 1000px;
        }

        .flip-card {
            height: 100%;
            min-height: 380px; /* Adjust if content is taller */
            position: relative;
            transition: transform 0.7s ease-in-out;
            transform-style: preserve-3d;
        }

        .flip-card-front,
        .flip-card-back {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            /* Important: Ensure both sides have similar padding or structure if content height varies significantly */
        }

        .flip-card-back {
            transform: rotateY(180deg);
        }

        .flip-card.is-flipped {
            transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default StaffIdCard;