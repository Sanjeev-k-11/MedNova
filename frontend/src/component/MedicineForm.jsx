import React from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';

export default function MedicineSection() {
    const navigate = useNavigate();

    // Mock authentication function (replace with real auth logic)
    const isAuthenticated = () => {
        return localStorage.getItem('token'); // Example token check
    };

    // Navigate to Medicine List
    const handleExploreClick = () => {
        if (isAuthenticated()) {
            navigate('/medicine');
        } else {
            navigate('/login');
        }
    };

    // Navigate to individual medicine
    const handleMedicineClick = (medicineId) => {
        if (isAuthenticated()) {
            navigate('/medicine');
        } else {
            navigate('/login');
        }
    };

    return (
        <section className="p-8 bg-gradient-to-r from-green-400 to-blue-500 bg-green-500 rounded-2xl shadow-lg text-center">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-white mb-4">We Provide Quality Medicines</h1>
                <p className="text-lg text-gray-100 mb-6">
                    "Your Health, Our Priority. Trusted Medicines at Your Doorstep."
                </p>
            </div>

            <div className="relative w-full h-18 overflow-hidden rounded-2xl shadow-md mb-6">
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <button
                        onClick={handleExploreClick}
                        className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-green-600 hover:shadow-xl transition-all duration-300"
                    >
                        Explore Medicines
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    onClick={() => handleMedicineClick(1)}
                    className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
                >
                    <img src={assets.medicine1} alt="Pain Relief" className="h-40 w-full object-cover rounded-t-2xl" />
                    <h2 className="text-xl font-semibold mt-4">Pain Relief</h2>
                    <p className="text-gray-600">Effective pain relief medicines for instant comfort.</p>
                </div>

                <div
                    onClick={() => handleMedicineClick(2)}
                    className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
                >
                    <img src={assets.medicine2} alt="Daily Vitamins" className="h-40 w-full object-cover rounded-t-2xl" />
                    <h2 className="text-xl font-semibold mt-4">Daily Vitamins</h2>
                    <p className="text-gray-600">Boost your health with essential daily vitamins.</p>
                </div>

                <div
                    onClick={() => handleMedicineClick(3)}
                    className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
                >
                    <img src={assets.medicine3} alt="Cold & Flu" className="h-40 w-full object-cover rounded-t-2xl" />
                    <h2 className="text-xl font-semibold mt-4">Cold & Flu</h2>
                    <p className="text-gray-600">Stay protected with reliable cold and flu medicines.</p>
                </div>
            </div>
        </section>
    );
}