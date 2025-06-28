"use client"
import React, { useState, useEffect } from 'react';
import { Thermometer, Cloud, Droplets, Gauge, Sunrise, Sunset, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import {db} from '../../lib/firebase'

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  pressure: number;
  cloudiness: number;
  sunrise: string;
  sunset: string;
  location: string;
}

const WeatherCard = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Manually set your user ID here
  const USER_ID = "fK5mN0qC0LZV5I1kYyPWLHW7yqO2"; // Replace with your actual user ID

  // Get current date
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      weekday: 'long' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  // Format time from timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get weather icon component based on description
  const getWeatherIcon = (description: string) => {
    if (description.toLowerCase().includes('cloud')) {
      return <Cloud className="w-10 h-10 text-white drop-shadow-lg" />;
    }
    // Add more weather conditions as needed
    return <Cloud className="w-10 h-10 text-white drop-shadow-lg" />;
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!USER_ID) {
        setError('User ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user location from Firestore
        const userDocRef = doc(db, 'users', USER_ID);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }

        const userData = userDoc.data();
        const location = "Gwalior";

        if (!location) {
          throw new Error('Location not found in user profile');
        }

        // Fetch weather data from API
        const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform API response to match our interface
        // Adjust these field mappings based on your actual API response structure
        setWeatherData({
          temperature: Math.round(data.main?.temp || data.current?.temp_c || 0),
          description: data.weather?.[0]?.description || data.current?.condition?.text || 'No data',
          humidity: data.main?.humidity || data.current?.humidity || 0,
          pressure: data.main?.pressure || data.current?.pressure_mb || 0,
          cloudiness: data.clouds?.all || data.current?.cloud || 0,
          sunrise: formatTime(data.sys?.sunrise || Date.now() / 1000),
          sunset: formatTime(data.sys?.sunset || Date.now() / 1000),
          location: location
        });

      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []); // Empty dependency array since USER_ID is constant

  // Loading state
  if (loading) {
    return (
      <div 
        className="w-[307px] h-[350px] rounded-[44px] p-6 relative overflow-hidden flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.9) 0%, rgba(48, 176, 199, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2 drop-shadow-lg" />
          <div 
            className="text-sm font-medium"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            Loading weather...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="w-[307px] h-[350px] rounded-[44px] p-6 relative overflow-hidden flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.9) 0%, rgba(255, 149, 0, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <div className="text-center">
          <Cloud className="w-8 h-8 text-white mx-auto mb-2 drop-shadow-lg" />
          <div 
            className="text-sm font-medium"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            Weather Unavailable
          </div>
          <div 
            className="text-xs mt-1 opacity-80"
            style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Main render with weather data
  return (
    <div 
      className="w-[307px] h-[350px] rounded-[44px] p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.95) 0%, rgba(48, 176, 199, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
      }}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span 
            className="text-sm font-medium tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            Today
          </span>
          <Thermometer className="w-6 h-6 text-white drop-shadow-md" />
        </div>
        <div className="text-right">
          <div 
            className="text-sm tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            {getCurrentDate()}
          </div>
          <div 
            className="text-lg font-semibold capitalize tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            {weatherData?.description || 'Loading...'}
          </div>
        </div>
      </div>

      {/* Temperature Section */}
      <div className="flex items-center justify-between mb-8">
        <div 
          className="text-4xl font-bold tracking-tight"
          style={{ 
            color: 'rgba(255, 255, 255, 0.98)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          {weatherData?.temperature}°C
        </div>
        {weatherData && getWeatherIcon(weatherData.description)}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Humidity */}
        <div 
          className="rounded-2xl p-3 text-center transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Droplets className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-md" />
          <div 
            className="text-xs font-medium tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            Humidity
          </div>
          <div 
            className="text-sm font-semibold tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            {weatherData?.humidity}%
          </div>
        </div>

        {/* Pressure */}
        <div 
          className="rounded-2xl p-3 text-center transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Gauge className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-md" />
          <div 
            className="text-xs font-medium tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            Pressure
          </div>
          <div 
            className="text-sm font-semibold tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            {weatherData?.pressure}hPa
          </div>
        </div>

        {/* Cloudiness */}
        <div 
          className="rounded-2xl p-3 text-center transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Cloud className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-md" />
          <div 
            className="text-xs font-medium tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            Cloudiness
          </div>
          <div 
            className="text-sm font-semibold tracking-tight"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}
          >
            {weatherData?.cloudiness}%
          </div>
        </div>
      </div>

      {/* Sunrise/Sunset Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sunrise className="w-6 h-6 text-white drop-shadow-md" />
          <div>
            <div 
              className="text-sm font-medium tracking-tight"
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
              }}
            >
              Sunrise
            </div>
            <div 
              className="text-sm font-semibold tracking-tight"
              style={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
              }}
            >
              {weatherData?.sunrise}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sunset className="w-6 h-6 text-white drop-shadow-md" />
          <div>
            <div 
              className="text-sm font-medium tracking-tight"
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
              }}
            >
              Sunset
            </div>
            <div 
              className="text-sm font-semibold tracking-tight"
              style={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
              }}
            >
              {weatherData?.sunset}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;