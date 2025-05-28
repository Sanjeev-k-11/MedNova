import React, { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState(null); // Local state for the selected image
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("userData");
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      } else {
        loadUserProfileData(); // Fetch fresh data if not in localStorage
      }
    } catch (error) {
      console.error("Invalid userData in localStorage:", error);
      localStorage.removeItem("userData");
      loadUserProfileData();
    }
  }, []);

  if (!userData) {
    return <div className="text-center p-6">Loading Profile...</div>;
  }

  // Handle Image Selection
  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImage(selectedImage);
  };

  // Handle Form Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => {
      const updatedData = { ...prev, [name]: value };
      localStorage.setItem("userData", JSON.stringify(updatedData));
      return updatedData;
    });
  };

  // Handle Address Input Change
  const handleAddressChange = (name, value) => {
    setUserData((prev) => {
      const updatedAddress = { ...prev.address, [name]: value };
      const updatedData = { ...prev, address: updatedAddress };
      localStorage.setItem("userData", JSON.stringify(updatedData));
      return updatedData;
    });
  };

  // Update Profile Data
  const updateUserProfileData = async () => {
    try {
      const missingFields = [];
      if (!userData.name) missingFields.push("Name");
      if (!userData.email) missingFields.push("Email");
      if (!userData.phone) missingFields.push("Phone");
      if (!userData.address?.line1) missingFields.push("Street Address");
      if (!userData.address?.line2) missingFields.push("City");
      if (userData.gender === "Not Selected") missingFields.push("Gender");
      if (!userData.birthday) missingFields.push("Birthday");

      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(", ")}`);
        return;
      }

      const formData = new FormData();
      if (image) {
        formData.append("image", image);
      }
      formData.append("userId", userData._id);
      formData.append("name", userData.name);
      formData.append("phone", userData.phone);
      formData.append("address", JSON.stringify(userData.address)); // Ensure the address is correctly formatted
      formData.append("dob", userData.birthday);
      formData.append("gender", userData.gender);

      const { data } = await axios.post(`${backendUrl}/api/user/update-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message);
        setUserData(data.user);
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error(`API Error: ${error.message}`);
    }
  };

  // Determine Image Source
  const imageSource = image ? URL.createObjectURL(image) : userData.image || "/default-profile.png";

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br  p-8">
      <button onClick={() => navigate(-1)} className="self-start mb-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-sm">
        ← Back
      </button>

      <div className="max-w-xl w-full p-8 bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="flex flex-col items-center relative">
          <label htmlFor="imageUpload" className="cursor-pointer">
            <img src={imageSource} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-md hover:opacity-80 transition" />
          </label>
          {isEditing && <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} ref={fileInputRef} />}
        </div>

        {isEditing ? (
          <input type="text" name="name" value={userData.name} onChange={handleChange} className="text-xl font-bold text-center w-full mt-4 border-b border-gray-400 focus:outline-none" />
        ) : (
          <h2 className="text-xl font-bold text-center mt-4">{userData.name}</h2>
        )}

        <hr className="my-4 border-gray-300" />

        <div className="space-y-3">
          <h3 className="text-gray-700 font-semibold text-base">📩 Contact Information</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <strong>Email:</strong>
            <span className="text-blue-500">{userData.email}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <strong>Phone:</strong>
            {isEditing ? (
              <input type="text" name="phone" value={userData.phone} onChange={handleChange} className="border border-gray-300 rounded p-1 text-center w-1/2" />
            ) : (
              <span className="text-blue-500">{userData.phone}</span>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <h3 className="text-gray-700 font-semibold text-base">📍 Address</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <strong>Street:</strong>
            {isEditing ? (
              <input
                type="text"
                name="line1"
                value={userData.address?.line1 || ""}
                onChange={(e) => handleAddressChange("line1", e.target.value)}
                className="border border-gray-300 rounded p-1 text-center w-1/2"
              />
            ) : (
              <span>{userData.address?.line1 || "Not Selected"}</span>
            )}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <strong>City:</strong>
            {isEditing ? (
              <input
                type="text"
                name="line2"
                value={userData.address?.line2 || ""}
                onChange={(e) => handleAddressChange("line2", e.target.value)}
                className="border border-gray-300 rounded p-1 text-center w-1/2"
              />
            ) : (
              <span>{userData.address?.line2 || "Not Selected"}</span>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <h3 className="text-gray-700 font-semibold text-base">📌 Basic Information</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <strong>Gender:</strong>
            {isEditing ? (
              <select
                name="gender"
                value={userData.gender}
                onChange={handleChange}
                className="border border-gray-300 rounded p-1 text-center w-1/2"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Not Selected">Not Selected</option>
              </select>
            ) : (
              <span>{userData.gender || "Not Selected"}</span>
            )}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <strong>Birthday:</strong>
            {isEditing ? (
              <input
                type="date"
                name="birthday"
                value={userData.birthday || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded p-1 text-center w-1/2"
              />
            ) : (
              <span>{userData.birthday || "Not Selected"}</span>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              if (isEditing) updateUserProfileData();
              setIsEditing(!isEditing);
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-600 transition"
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
