import React, { useState } from 'react';
import { assets } from '../assets/assets';

const MyProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    image: assets.profile_pic,
    name: "WWWWWW",
    email: "ssssss@gmail.com",
    phone: "0000000000",
    address: {
      line1: "patna ,Bihar, India",
      line2: "Phagwara, India"
    },
    gender: "Not Selected",
    birthday: "Not Selected",
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserData({ ...userData, image: imageUrl });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md mt-10 m-5">
      {/* Profile Image Section */}
      <div className="flex flex-col items-center">
        <label htmlFor="imageUpload" className="relative cursor-pointer">
          <img
            src={userData.image}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
          />
        </label>
        {isEditing && (
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        )}
      </div>

      {/* Editable Name */}
      {isEditing ? (
        <input
          type="text"
          name="name"
          value={userData.name}
          onChange={handleChange}
          className="text-xl font-semibold text-center w-full mt-3 border border-gray-300 rounded p-1"
        />
      ) : (
        <h2 className="text-xl font-semibold text-center mt-3">{userData.name}</h2>
      )}
      <hr className="my-4 border-gray-300" />

      {/* Contact Information */}
      <div>
        <h3 className="text-gray-700 font-semibold text-sm md:text-base">CONTACT INFORMATION</h3>
        <div className="flex justify-between text-xs md:text-sm text-gray-600 m-2">
          <strong>Email:</strong>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              className="border border-gray-300 rounded p-1 text-right w-1/2"
            />
          ) : (
            <span className="text-blue-500">{userData.email}</span>
          )}
        </div>
        <div className="flex justify-between text-xs md:text-sm text-gray-600 m-2">
          <strong>Phone:</strong>
          {isEditing ? (
            <input
              type="text"
              name="phone"
              value={userData.phone}
              onChange={handleChange}
              className="border border-gray-300 rounded p-1 text-right w-1/2"
            />
          ) : (
            <span className="text-blue-500">{userData.phone}</span>
          )}
        </div>
      </div>

      {/* Address Information */}
      <div className="mt-4">
        <h3 className="text-gray-700 font-semibold text-sm md:text-base">ADDRESS</h3>
        <div className="flex justify-between text-xs md:text-sm text-gray-600 m-2">
          <strong>Line 1:</strong>
          {isEditing ? (
            <input
              type="text"
              name="line1"
              value={userData.address.line1}
              onChange={(e) =>
                setUserData({ ...userData, address: { ...userData.address, line1: e.target.value } })
              }
              className="border border-gray-300 rounded p-1 text-right w-1/2"
            />
          ) : (
            <span className="text-gray-600">{userData.address.line1}</span>
          )}
        </div>
        <div className="flex justify-between text-xs md:text-sm text-gray-600 m-2">
          <strong>Line 2:</strong>
          {isEditing ? (
            <input
              type="text"
              name="line2"
              value={userData.address.line2}
              onChange={(e) =>
                setUserData({ ...userData, address: { ...userData.address, line2: e.target.value } })
              }
              className="border border-gray-300 rounded p-1 text-right w-1/2"
            />
          ) : (
            <span className="text-gray-600">{userData.address.line2}</span>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="mt-4">
        <h3 className="text-gray-700 font-semibold text-sm md:text-base">BASIC INFORMATION</h3>
        <div className="flex justify-between text-xs md:text-sm text-gray-600 m-2">
          <strong>Gender:</strong>
          {isEditing ? (
            <select
              name="gender"
              value={userData.gender}
              onChange={handleChange}
              className="border border-gray-300 rounded p-1 text-right w-1/2"
            >
              <option value="Not Selected">Not Selected</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <span>{userData.gender}</span>
          )}
        </div>
        <div className="flex justify-between text-xs md:text-sm text-gray-600 m-2">
          <strong>Birthday:</strong>
          {isEditing ? (
            <input
              type="date"
              name="birthday"
              value={userData.birthday}
              onChange={handleChange}
              className="border border-gray-300 rounded p-1 text-right w-1/2"
            />
          ) : (
            <span>{userData.birthday}</span>
          )}
        </div>
      </div>

      {/* Edit & Save Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white transition text-xs md:text-sm"
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>
    </div>
  );
};

export default MyProfile;
