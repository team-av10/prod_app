"use client"
import React, { useState, useEffect } from 'react';

const AV10Homepage = () => {
  const quotes = [
    "Precision farming with smart technology",
    "துல்லியமான விவசாயம் புத்திசாலித்தனமான தொழில்நுட்பத்துடன்",
    "स्मार्ट तकनीक के साथ सटीक खेती",
    "Data-driven farming solutions",
    "தரவு சார்ந்த விவசாய தீர்வுகள்",
    "डेटा आधारित कृषि समाधान"
  ];

  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="av10-logo.png" alt="AV10" className="h-10" />
            <span className="text-xl font-bold text-gray-800">AV10</span>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Dashboard
          </button>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              AV10 Farming Dashboard
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Monitor and manage your farm with precision technology. 
              Get real-time insights for better crop management.
            </p>

            {/* Quote Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
              <p className="text-gray-700 text-center transition-opacity duration-500">
                "{quotes[currentQuote]}"
              </p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4">
              {/* <button className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700">
                Open Dashboard
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded hover:border-gray-400">
                Learn More
              </button> */}
            </div>
          </div>

          {/* Right Side */}
          <div>
            <img 
              src="dashboard.png" 
              alt="Dashboard" 
              className="w-full rounded-lg shadow-lg"
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default AV10Homepage;