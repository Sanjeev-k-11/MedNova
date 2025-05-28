import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";

const DoctorDetails = () => {
    const { id } = useParams(); // Get doctor ID from URL
    const { doctors } = useContext(AdminContext);
    const [doctor, setDoctor] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const foundDoctor = doctors.find((doc) => doc._id === id);
        setDoctor(foundDoctor);
    }, [id, doctors]);

    if (!doctor) {
        return <p className="text-center text-gray-600">Doctor not found...</p>;
    }

    return (
        <div className="container mx-auto p-6">
            <button
                onClick={() => navigate(-1)}
                className="mb-4 text-blue-600 hover:underline"
            >
                ← Back
            </button>

            <div className="bg-white p-6 shadow-md rounded-lg">
                <div className="flex flex-col md:flex-row">
                    <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="w-48 h-48 object-cover rounded-md mx-auto md:mx-0"
                    />
                    <div className="md:ml-6 flex flex-col justify-center">
                        <h1 className="text-2xl font-bold text-gray-800">{doctor.name}</h1>
                        <p className="text-gray-600 text-lg">{doctor.speciality}</p>
                        <p className="text-gray-500">Salary: ₹ {doctor.salary}</p>
                        <p className="text-gray-500">phone:📞 {doctor.phone}</p>
                        <p className="text-gray-500">Work Time: {doctor.todayWorkTime}</p>
                        <p className="mt-4 text-gray-700">{doctor.about}</p>

                        <div className="mt-4">
                            <span
                                className={`px-4 py-1 rounded-lg text-white ${
                                    doctor.available ? "bg-green-500" : "bg-red-500"
                                }`}
                            >
                                {doctor.available ? "Available" : "Not Available"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDetails;
