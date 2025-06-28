import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase'; // Adjust path as needed
import { ref, onValue, off } from 'firebase/database';
import { AlertTriangle } from 'lucide-react';

interface Alert {
  id: string;
  message: string;
}

interface AlertsComponentProps {
  userId: string;
}

const AlertsComponent: React.FC<AlertsComponentProps> = ({ userId }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const alertsRef = ref(database, `users/${userId}/alert`);
    
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      if (snapshot.exists()) {
        const alertsData = snapshot.val();
        const alertsArray: Alert[] = Object.keys(alertsData)
          .sort() // Sort to maintain order (01, 02, 03, 04)
          .map(key => ({
            id: key,
            message: alertsData[key] // Direct string value
          }));
        setAlerts(alertsArray);
      } else {
        setAlerts([]);
      }
    });

    return () => {
      off(alertsRef);
    };
  }, [userId]);

  return (
    <div className="w-[430px] h-[343px] relative overflow-hidden">
      {/* Background with iOS-style gradient and blur effect */}
      <div 
        className="absolute inset-0 rounded-[44px] shadow-2xl"
        style={{ 
          background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.95) 0%, rgba(48, 176, 199, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          transform: 'rotate(-0.47deg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
        }}
      />
      
      {/* Alert items container */}
      <div className="relative z-10 flex flex-col gap-[13px] pt-[37px] px-[20px]">
        {alerts.slice(0, 4).map((alert) => (
          <div
            key={alert.id}
            className="w-[391px] h-[61px] rounded-[30px] flex items-center px-[26px] gap-[39px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Warning icon with iOS styling */}
            <div className="flex-shrink-0">
              <div className="w-[42px] h-[35px] flex items-center justify-center rounded-4xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                <AlertTriangle 
                  className="w-[24px] h-[20px] text-white" 
                  strokeWidth={2}
                  fill="none"
                />
              </div>
            </div>
            
            {/* Alert message with iOS typography */}
            <div className="flex-1 overflow-hidden">
              <p 
                className="whitespace-nowrap overflow-hidden text-ellipsis font-medium tracking-tight"
                style={{ 
                  color: 'rgba(0, 0, 0, 0.85)',
                  fontSize: '16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                }}
              >
                {alert.message}
              </p>
            </div>
          </div>
        ))}
        
        {/* Show placeholder items if less than 4 alerts */}
        {Array.from({ length: Math.max(0, 4 - alerts.length) }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="w-[391px] h-[61px] rounded-[30px] flex items-center px-[26px] gap-[39px] opacity-40"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className="flex-shrink-0">
              <div className="w-[42px] h-[35px] flex items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-md">
                <AlertTriangle 
                  className="w-[24px] h-[20px] text-white opacity-70" 
                  strokeWidth={2}
                  fill="none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p 
                className="whitespace-nowrap overflow-hidden text-ellipsis font-medium tracking-tight"
                style={{ 
                  color: 'rgba(0, 0, 0, 0.4)',
                  fontSize: '16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                }}
              >
                No alerts
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsComponent;