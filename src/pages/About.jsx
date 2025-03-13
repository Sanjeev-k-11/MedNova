import React from 'react';
import { assets } from '../assets/assets';

const About = () => {
  return (
    <div className="px-6">
      {/* Heading */}
      <div className="text-center text-2xl pt-10 text-gray-500">
        <p>
          ABOUT <span className="text-gray-700 font-medium">US</span>
        </p>
      </div>

      {/* Content Section */}
      <div className="my-10 flex flex-col md:flex-row gap-12 items-center">
        {/* Image */}
        <img className="w-full md:max-w-[360px] rounded-lg shadow-md" src={assets.about_image} alt="About Us" />

        {/* Text Content */}
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-500">
          <p className="text-gray-700">
            Welcome to Prescripto, your trusted partner in managing your healthcare
            needs conveniently and efficiently. At Prescripto, we understand the
            challenges individuals face when it comes to scheduling doctor
            appointments and managing their health records.
          </p>
          <p className="text-gray-700">
            Prescripto is committed to excellence in healthcare technology. We
            continuously strive to enhance our platform, integrating the latest
            advancements to improve user experience and deliver superior service.
          </p>
          <b className="font-bold text-lg">Our Vision</b>
          <p className="text-gray-700">
            Our vision is to create a seamless healthcare experience for every user.
            We aim to bridge the gap between patients and healthcare providers,
            making it easier for you to access the care you need when you need it.
          </p>
        </div>
      </div>

      {/* WHY CHOOSE US Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-semibold text-center mb-6">WHY CHOOSE US</h3>
        <div className="grid md:grid-cols-3 gap-6 h-40 text-center">
          {[
            { title: 'EFFICIENCY', description: 'Streamlined appointment scheduling that fits into your busy lifestyle.' },
            { title: 'CONVENIENCE', description: 'Access to a network of trusted healthcare professionals in your area.' },
            { title: 'PERSONALIZATION', description: 'Tailored recommendations and reminders to help you stay on top of your health.' },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 border rounded-lg shadow-md transition duration-300 transform 
                         hover:bg-blue-100 hover:shadow-lg hover:scale-105"
            >
              <h4 className="font-bold text-lg transition duration-300 hover:text-blue-600 hover:scale-105">
                {feature.title}:
              </h4>
              <p className="text-gray-600 mt-2 transition duration-300 hover:text-blue-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
