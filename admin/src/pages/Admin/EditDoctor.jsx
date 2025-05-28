import React, { useState, useContext, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { useParams, useNavigate } from 'react-router-dom';

const EditDoctor = () => {
    const { doctors, updateDoctor } = useContext(AdminContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        speciality: "",
        fee: "",
        todayWorkTime: "",
        about: "",
        image: null,
    });

    // Find doctor if navigated via URL
    useEffect(() => {
        if (id && doctors.length > 0) {
            const doctor = doctors.find((doc) => doc._id === id);
            if (doctor) {
                setSelectedDoctor(doctor);
                setFormData({
                    name: doctor.name,
                    email: doctor.email,
                    speciality: doctor.speciality,
                    fee: doctor.fee,
                    todayWorkTime: doctor.todayWorkTime,
                    about: doctor.about,
                    image: doctor.image, // Keep existing image
                });
            }
        }
    }, [id, doctors]);

    // Search functionality
    const handleSearch = (e) => {
        setSearch(e.target.value.toLowerCase());
    };

    // Select doctor from search
    const selectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
        setFormData({
            name: doctor.name,
            email: doctor.email,
            speciality: doctor.speciality,
            fee: doctor.fee,
            todayWorkTime: doctor.todayWorkTime,
            about: doctor.about,
            image: doctor.image, // Keep existing image
        });
        navigate(`/edit-doctor/${doctor._id}`); // Update URL
    };

    // Handle input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, image: file });
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDoctor) return;

        const updatedData = new FormData();
        updatedData.append("name", formData.name);
        updatedData.append("email", formData.email);
        updatedData.append("speciality", formData.speciality);
        updatedData.append("fee", formData.fee);
        updatedData.append("todayWorkTime", formData.todayWorkTime);
        updatedData.append("about", formData.about);
        if (formData.image instanceof File) {
            updatedData.append("image", formData.image);
        }

        await updateDoctor(selectedDoctor._id, updatedData);
        alert("Doctor details updated successfully!");
        navigate("/doctor-list"); // Redirect after update
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Edit Doctor Details</h1>

            {/* Search Input */}
            <input
                type="text"
                placeholder="Search doctor by name..."
                className="p-2 border rounded-lg w-1/2 mb-4"
                value={search}
                onChange={handleSearch}
            />

            {/* Doctor List */}
            <div className="mb-4">
                {doctors
                    .filter((doc) => doc.name.toLowerCase().includes(search))
                    .map((doctor) => (
                        <button
                            key={doctor._id}
                            onClick={() => selectDoctor(doctor)}
                            className="block p-2 border rounded-lg mb-2 hover:bg-gray-100 w-1/2"
                        >
                            {doctor.name} - {doctor.speciality}
                        </button>
                    ))}
            </div>

            {/* Edit Form */}
            {selectedDoctor && (
                <form onSubmit={handleSubmit} className="p-4 border rounded-lg">
                    {/* Display Existing Image */}
                    <div className="mb-4">
                        <label className="block font-medium">Current Image:</label>
                        <img
                            src={selectedDoctor.image}
                            alt="Doctor"
                            className="w-32 h-32 object-cover rounded-md"
                        />
                    </div>

                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-2 border rounded mb-2"
                    />

                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 border rounded mb-2"
                    />

                    <label>Specialty:</label>
                    <input
                        type="text"
                        name="speciality"
                        value={formData.speciality}
                        onChange={handleChange}
                        className="w-full p-2 border rounded mb-2"
                    />

                    <label>Fee:</label>
                    <input
                        type="number"
                        name="fee"
                        value={formData.fee}
                        onChange={handleChange}
                        className="w-full p-2 border rounded mb-2"
                    />

                    <label>Today's Work Time:</label>
                    <input
                        type="text"
                        name="todayWorkTime"
                        value={formData.todayWorkTime}
                        onChange={handleChange}
                        className="w-full p-2 border rounded mb-2"
                    />

                    <label>About:</label>
                    <textarea
                        name="about"
                        value={formData.about}
                        onChange={handleChange}
                        className="w-full p-2 border rounded mb-2"
                    />

                    {/* Upload New Image */}
                    <label>Upload New Image:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full p-2 border rounded mb-2"
                    />

                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                        Update Doctor
                    </button>
                </form>
            )}
        </div>
    );
};

export default EditDoctor;
