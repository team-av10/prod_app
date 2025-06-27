'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Zap } from 'lucide-react';

interface GroundStationButtonProps {
  stationNumber: number;
  isActive: boolean;
  onClick: () => void;
}

const GroundStationButton = ({ stationNumber, isActive, onClick }: GroundStationButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-full h-full rounded-xl transition-all duration-200 ease-out
        ${isActive 
          ? 'bg-blue-500 shadow-lg scale-95 shadow-blue-500/25' 
          : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 hover:shadow-md hover:scale-[1.02] active:scale-95'
        }
      `}
    >
      {/* Ground Station Icon */}
      <div className={`
        relative mb-1
        ${isActive ? 'text-white' : 'text-gray-700'}
      `}>
        <Radio className="w-6 h-6" />
        {/* Signal waves animation */}
        <div className={`
          absolute -top-1 -right-1 w-2 h-2 rounded-full
          ${isActive ? 'bg-green-400' : 'bg-gray-400'}
          ${isActive ? 'animate-pulse' : ''}
        `} />
      </div>
      
      {/* Station Number */}
      <span className={`
        text-xs font-semibold font-mono
        ${isActive ? 'text-white' : 'text-gray-600'}
      `}>
        {stationNumber}
      </span>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl border-2 border-white/30" />
      )}
    </button>
  );
};

export default function GroundStationNavMob() {
  const router = useRouter();
  const [activeStation, setActiveStation] = useState<number | null>(null);

  const handleStationClick = (stationNumber: number) => {
    setActiveStation(stationNumber);
    
    // Navigate to the respective ground station page
    setTimeout(() => {
      router.push(`/ground-station/${stationNumber}`);
    }, 150); // Small delay for visual feedback
  };

  return (
    <div 
      className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 shadow-sm border border-gray-200/50"
      style={{ 
        width: '192.98px', 
        height: '229.02px' 
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <Zap className="w-4 h-4 mr-1 text-blue-500" />
           தரைக்கூடங்கள்
        </h3>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>

      {/* Grid of Station Buttons */}
      <div className="grid grid-cols-2 gap-3 h-40">
        {[1, 2, 3, 4].map((stationNumber) => (
          <GroundStationButton
            key={stationNumber}
            stationNumber={stationNumber}
            isActive={activeStation === stationNumber}
            onClick={() => handleStationClick(stationNumber)}
          />
        ))}
      </div>

      {/* Status Bar */}
      <div className="mt-4 pt-3 border-t border-gray-200/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Status: Online</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="w-1 h-3 bg-green-400 rounded-full opacity-75"
                style={{
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}