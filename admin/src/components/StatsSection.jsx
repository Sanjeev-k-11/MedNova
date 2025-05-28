import React from 'react';

const StatsSection = ({ stats, title, subtitle }) => {
  return (
    <section className="bg-gradient-to-r from-cyan-700 to-teal-700 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>}
            {subtitle && <p className="max-w-2xl mx-auto text-lg text-cyan-100">{subtitle}</p>}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div 
              key={stat.id}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 text-center transform transition-transform duration-300 hover:scale-105"
            >
              {stat.icon && (
                <div className="text-white mb-4 flex justify-center">
                  {stat.icon}
                </div>
              )}
              <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
              <p className="text-cyan-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
