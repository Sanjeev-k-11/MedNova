// src/pages/HomePage.jsx
import React from 'react';
import HeroSection from '../../components/HeroSection';
import CardSection from '../../components/CardSection';
import StatsSection from '../../components/StatsSection';
import Navbar from '../../components/DNavbar'; // <-- Import your Navbar component
import { Heart, Users, Calendar, FileText, Newspaper, ClipboardList, Clock, MapPin } from 'lucide-react';

const HomePage = () => {
  const departmentCards = [
    
    {
      id: 1,
      title: 'Department Map',
      content: 'View the layout of the nursing wing and locate specific rooms and facilities.',
      icon: <MapPin className="h-8 w-8" />,
      link: '/DepartmentMap'
    },
    {
      id: 2,
      title: 'Department Schedule',
      content: 'Access the nursing wing schedule, including shift rotations, training sessions, and important department meetings.',
      icon: <Calendar className="h-8 w-8" />,
      link: '/calendar'
    },
    
  ];

  const departmentStats = [
    {
      id: 1,
      value: '150+',
      label: 'Dedicated Staff Members',
      icon: <Users className="h-10 w-10" />
    },
    {
      id: 2,
      value: '24/7',
      label: 'Hours of Operation',
      icon: <Clock className="h-10 w-10" />
    },
    {
      id: 3,
      value: '98%',
      label: 'Patient Satisfaction Rate',
      icon: <Heart className="h-10 w-10" />
    },
    {
      id: 4,
      value: '45+',
      label: 'Years of Excellence',
      icon: <Calendar className="h-10 w-10" />
    }
  ];

  return (
    // Use a React Fragment <> if the Navbar is a direct sibling to the main content div
    <>
      <Navbar /> {/* <-- Render the Navbar component here */}

      {/*
        The rest of the page content.
        The 'pt-16' class on this div is likely to push the content down
        to make space for a fixed-position header of roughly that height.
        Adjust 'pt-16' if your Navbar has a different height or positioning.
      */}
      <div className="pt-16">
        <HeroSection
          title="Nursing Wing"
          subtitle="Providing compassionate care with dedication and excellence"
        />

        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to the Nursing Department</h2>
              <p className="max-w-2xl mx-auto text-lg text-gray-600">
                Our department is the heart of patient care at Memorial Hospital, providing around-the-clock comprehensive nursing services with compassion and clinical excellence.
              </p>
            </div>

            <div className="bg-cyan-50 border-l-4 border-cyan-600 p-6 rounded-r-lg mb-12">
              <h3 className="text-xl font-semibold text-cyan-800 mb-2">Department Announcement</h3>
              <p className="text-cyan-700">
                New staffing schedules for the upcoming quarter are now available. Please check the calendar for your updated rotations and training sessions.
              </p>
            </div>
          </div>
        </div>

        <CardSection
          title="Department Information"
          description="Everything you need to know about the Nursing Wing at Memorial Hospital."
          cards={departmentCards}
        />

        <StatsSection
          stats={departmentStats}
          title="Department Overview"
          subtitle="Key statistics about our nursing department's impact and capabilities"
        />

        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                <img
                  className="h-48 w-full object-cover md:h-full md:w-48"
                  src="https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg"
                  alt="Department leadership"
                />
              </div>
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-cyan-600 font-semibold">Message from Leadership</div>
                <h3 className="mt-1 text-xl font-semibold text-gray-900">A Commitment to Excellence</h3>
                <p className="mt-2 text-gray-600">
                  "Our nursing team strives every day to provide exceptional care to our patients while advancing our practice through continuous learning and innovation. We are committed to creating a supportive environment for both our patients and our staff."
                </p>
                <div className="mt-4">
                  <p className="text-gray-900 font-medium">Dr. Sarah Johnson</p>
                  <p className="text-gray-600 text-sm">Chief Nursing Officer</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div> {/* <-- Close the main content div */}
    </> // <-- Close the React Fragment
  );
};

export default HomePage;