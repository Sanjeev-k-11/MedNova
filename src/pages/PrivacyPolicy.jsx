import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-50 min-h-screen flex justify-center px-6 py-12 md:px-16">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-xl p-8 md:p-12">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">Privacy Policy</h1>
        <p className="text-gray-600 text-center mb-8">
          Your privacy matters to us. Learn how <strong>MedNova</strong> protects your data.
        </p>

        {/* Section Container */}
        <div className="space-y-8">
          {/* Section */}
          <div className="p-6 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <h2 className="text-2xl font-semibold text-blue-700">1. Information We Collect</h2>
            <ul className="list-disc list-inside mt-2 text-gray-700">
              <li><strong>Personal:</strong> Name, email, phone number, etc.</li>
              <li><strong>Health Data:</strong> Medical history, prescriptions.</li>
              <li><strong>Usage Data:</strong> Features accessed, interactions.</li>
              <li><strong>Device Info:</strong> IP address, browser type, OS.</li>
            </ul>
          </div>

          {/* Section */}
          <div className="p-6 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <h2 className="text-2xl font-semibold text-blue-700">2. How We Use Your Data</h2>
            <ul className="list-disc list-inside mt-2 text-gray-700">
              <li>To improve healthcare services and user experience.</li>
              <li>To process transactions and send notifications.</li>
              <li>To comply with legal and regulatory requirements.</li>
            </ul>
          </div>

          {/* Section */}
          <div className="p-6 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <h2 className="text-2xl font-semibold text-blue-700">3. Data Sharing</h2>
            <p className="text-gray-700 mt-2">
              We never sell your data. We may share it with healthcare providers or required authorities.
            </p>
          </div>

          {/* Section */}
          <div className="p-6 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <h2 className="text-2xl font-semibold text-blue-700">4. Your Rights</h2>
            <ul className="list-disc list-inside mt-2 text-gray-700">
              <li>Access, update, or delete your data.</li>
              <li>Opt-out of marketing communications.</li>
              <li>Request data portability.</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="p-6 bg-gray-200 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-semibold text-blue-700">Contact Us</h2>
            <p className="text-gray-700 mt-2">
              If you have any questions, email us at:  
              <span className="block font-bold text-blue-600">support@mednova.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
