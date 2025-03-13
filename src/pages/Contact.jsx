import React from "react";
import { assets } from "../assets/assets";

const Contact = () => {
  return (
    <div className="px-6 py-12">
      {/* Heading */}
      <div className="text-center text-[22px] text-[#666]   font-semibold">
        CONTACT <span className="text-[#222] font-semibold">US</span>
      </div>

      {/* Contact Section */}
      <div className="mt-10 flex flex-col md:flex-row gap-12 items-center justify-center ">
        {/* Image */}
        <img
          className="w-full transition-transform    group duration-500 ease-in-out transform  hover:scale-105 hover:shadow-2xl md:max-w-[400px] rounded-lg shadow-md"
          src={assets.contact_image}
          alt="Doctor and Patient"
        />

        {/* Contact Details */}
        <div className="flex flex-col gap-6 text-[#666] md:w-2/4 text-[16px]">
          {/* Office Details */}
          <div>
            <h3 className="text-[18px] font-semibold text-[#666]">OUR OFFICE</h3>
            <p className="mt-1">DEV kumar</p>
            <p>Bihar,  India</p>
            <p className="mt-3">Tel: +919999999999</p>
            <p>Email: sy785@gmail.com</p>
          </div>

          {/* Careers Section */}
          <div>
            <h3 className="text-[18px] font-semibold text-[#666]">
              CAREERS AT PRESCRIPTO
            </h3>
            <p className="mt-1">Learn more about our teams and job openings.</p>
            <button className="mt-4 px-6 py-2 border border-[#000] text-[#000] rounded-md transition duration-300 hover:bg-black hover:text-white">
              Explore Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
