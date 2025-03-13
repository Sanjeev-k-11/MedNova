import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';

const RelatedDoctors = () => {
  const { doctors } = useContext(AppContext);
  const { docId } = useParams();
  const navigate = useNavigate();
  
  const currentDoctor = doctors.find(doc => doc._id === docId);
  const relatedDoctors = doctors.filter(doc => doc.speciality === currentDoctor?.speciality && doc._id !== docId);

  const handleDoctorClick = (id) => {
    navigate(`/appointment/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col items-center gap-6 my-16 text-gray-900 md:mx-10">
      <h1 className="text-3xl font-medium">Top Doctors to Book</h1>
      <p className="sm:w-1/3 text-center text-sm text-gray-600">
        Simply browse through our extensive list of experienced doctors and book your appointment easily.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {relatedDoctors.map(doc => (
          <div 
            key={doc._id} 
            className="border rounded-lg p-4 shadow-md bg-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            onClick={() => handleDoctorClick(doc._id)}
          >
            <img 
              src={doc.image} 
              alt={doc.name} 
              className="w-full h-60 object-cover rounded-md" 
            />
            <h3 className="mt-3 text-lg font-semibold">{doc.name}</h3>
            <p className="text-sm text-gray-500">{doc.speciality}</p>
            <p className="text-sm font-semibold mt-1 text-gray-700">Fees: ${doc.fees}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedDoctors;
