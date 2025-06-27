"use client"
import React, { useState, useEffect } from 'react';
import { Loader2, Wind } from 'lucide-react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface WindData {
  windSpeed: number;
  windDirection: string;
  windDegree: number;
}

interface SimpleWindComponentProps {
  className?: string;
}

const SimpleWindComponent: React.FC<SimpleWindComponentProps> = ({
  className = ''
}) => {
  const [windData, setWindData] = useState<WindData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Manually set your user ID here
  const USER_ID = "fK5mN0qC0LZV5I1kYyPWLHW7yqO2"; // Replace with your actual user ID

  // Convert wind degree to cardinal direction
  const degreeToCardinal = (degree: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
  };

  useEffect(() => {
    const fetchWindData = async () => {
      if (!USER_ID) {
        setError('User ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user location from Firestore
        console.log('Fetching location for user:', USER_ID); // Debug log
        const userDocRef = doc(db, 'users', USER_ID);
        const userDoc = await getDoc(userDocRef);

        console.log('User doc exists:', userDoc.exists()); // Debug log

        if (!userDoc.exists()) {
          throw new Error('User document not found in Firestore');
        }

        const userData = userDoc.data();
        console.log('User data:', userData); // Debug log
        const location = userData?.location;

        if (!location) {
          throw new Error('Location field not found in user document');
        }

        console.log('Location found:', location); // Debug log

        // Fetch weather data from API
        const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Weather API response:', data); // Debug log

        // Transform API response to match our interface
        // Adjust these field mappings based on your actual API response structure
        const windSpeedMs = data.wind?.speed || data.current?.wind_kph * 0.277778 || 0; // Convert kph to m/s if needed
        const windDegree = data.wind?.deg || data.current?.wind_degree || 0;
        
        setWindData({
          windSpeed: Math.round(windSpeedMs * 10) / 10, // Round to 1 decimal place
          windDirection: degreeToCardinal(windDegree),
          windDegree: windDegree
        });

      } catch (err) {
        console.error('Error fetching wind data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch wind data');
      } finally {
        setLoading(false);
      }
    };

    fetchWindData();
  }, []); // Empty dependency array since USER_ID is constant

  // Loading state
  if (loading) {
    return (
      <div className={`relative w-52 h-28 ${className}`}>
        <div
          className="absolute inset-0 rounded-[20px] bg-white/90 backdrop-blur-xl border border-gray-200/30 shadow-xl flex items-center justify-center overflow-hidden"
          style={{
            transform: 'rotate(-0.4deg)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
          }}
        >
          {/* Subtle animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400"
              style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
              }}
            />
          </div>
          
          <div className="text-center relative z-10">
            <div className="bg-blue-100/50 rounded-full p-2 mb-2 mx-auto w-fit">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
            <div className="text-gray-700 text-xs font-medium">Loading wind data...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`relative w-52 h-28 ${className}`}>
        <div
          className="absolute inset-0 rounded-[20px] bg-white/90 backdrop-blur-xl border border-red-200/40 shadow-xl flex items-center justify-center overflow-hidden"
          style={{
            transform: 'rotate(-0.4deg)',
            background: 'linear-gradient(135deg, rgba(255,245,245,0.95) 0%, rgba(254,242,242,0.95) 100%)'
          }}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 75% 25%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)'
              }}
            />
          </div>
          
          <div className="text-center relative z-10 px-3">
            <div className="bg-red-100/60 rounded-full p-2 mb-2 mx-auto w-fit">
              <Wind className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-red-700 text-xs font-semibold mb-1">Wind Unavailable</div>
            <div className="text-red-600 text-xs opacity-80 leading-tight">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Main render with wind data
  return (
    <div className={`relative w-52 h-28 ${className}`}>
      {/* Main iOS-styled background with glassmorphism */}
      <div
        className="absolute inset-0 rounded-[20px] bg-white/85 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden"
        style={{
          transform: 'rotate(-0.4deg)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.85) 50%, rgba(241,245,249,0.9) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
        }}
      >
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute top-0 right-0 w-16 h-16 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
              transform: 'translate(20%, -20%)'
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-12 h-12 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
              transform: 'translate(-20%, 20%)'
            }}
          />
        </div>

        {/* Subtle top highlight */}
        <div 
          className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />
      </div>
     
      {/* Wind Speed Section - Left Side */}
      <div className="absolute left-5 top-1/2 transform -translate-y-1/2 z-10">
        {/* Wind speed value with iOS typography */}
        <div className="mb-1">
          <span 
            className="text-gray-900 font-semibold tracking-tight"
            style={{ 
              fontSize: '26px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {windData?.windSpeed}
          </span>
          <span 
            className="text-gray-600 font-medium ml-1"
            style={{ 
              fontSize: '14px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
            }}
          >
            m/s
          </span>
        </div>
       
        {/* Wind speed label */}
        <div>
          <span 
            className="text-gray-500 font-medium"
            style={{
              fontSize: '11px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              letterSpacing: '0.015em'
            }}
          >
            காற்றின் வேகம்
          </span>
        </div>
      </div>
     
      {/* Wind Direction Section - Right Side */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10">
        {/* Wind direction icon background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/30"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.05)'
            }}
          />
        </div>
        
        {/* Wind direction value */}
        <div className="mb-1 text-center relative z-10">
          <span 
            className="text-gray-900 font-bold tracking-tight"
            style={{ 
              fontSize: '22px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {windData?.windDirection}
          </span>
        </div>
       
        {/* Wind direction label */}
        <div className="text-center relative z-10">
          <span 
            className="text-gray-500 font-medium"
            style={{
              fontSize: '11px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              letterSpacing: '0.015em'
            }}
          >
             திசை
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleWindComponent;