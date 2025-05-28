import React from 'react';

const HeroSection = ({ 
  title, 
  subtitle = "Department Information",
  image = "https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg"
}) => {
  return (
    <div className="relative h-80 md:h-96 overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(${image})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/90 to-cyan-700/70"></div>
      </div>
      
      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-cyan-100 animate-fade-in-delayed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
