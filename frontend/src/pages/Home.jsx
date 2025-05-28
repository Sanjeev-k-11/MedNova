import React from 'react';
import Header from '../component/Header';
import SpecialityMenu from '../component/SpecialityMenu';
import TopDoctors from '../component/TopDoctors';
import Banner from '../component/Banner';
import AIChat from '../component/AIChat'; // Import AI Chat Component
import MedicineSection from '../component/MedicineForm';


const Home = () => {
  return (
    <div>
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <MedicineSection/>
      <Banner />
      
      {/* AI Chat Floating Button */}
      <AIChat />
    </div>
  );
};

export default Home;
