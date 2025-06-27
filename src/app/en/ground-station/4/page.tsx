'use client';

import { useEffect, useState, useRef } from 'react';
import { DonutChart } from '../components/DonutChart';
import { DataTable } from '../components/DataTable';
import moment from 'moment';
import { ref, onValue, off } from "firebase/database";
import {database} from '@/lib/firebase'

// Define types for better TypeScript support
interface SensorData {
  soilTemp: number;
  waterFlow: number;
  envTemp: number;
  humidity: number;
  ph: number;
  pressure: number;
  altitude: number;
}

interface MinuteEntry extends SensorData {
  timestamp: string;
  fullTimestamp: string;
  hasData: boolean;
}

interface MinuteData {
  [key: string]: MinuteEntry;
}

// Firebase data can have various property names
interface FirebaseData {
  soilTemp?: number;
  soil_temp?: number;
  soilTemperature?: number;
  flowRate?: number;
  flow_rate?: number;
  waterFlow?: number;
  flow?: number;
  environmentTemp?: number;
  env_temp?: number;
  envTemp?: number;
  temperature?: number;
  humidity?: number;
  hum?: number;
  phValue?: number;
  pHValue?: number;
  ph?: number;
  atmosPressure?: number;
  pressure?: number;
  atm_pressure?: number;
  altitude?: number;
  alt?: number;
  [key: string]: any; // Allow other properties
}

const getTrendSymbol = (current: number, previous: number): string => {
    return '';
};

// Generate the last 10 minutes timestamps with default values
const generateMinuteSlots = (): MinuteData => {
    const slots: MinuteData = {};
    for (let i = 9; i >= 0; i--) {
        const time = moment().subtract(i, 'minutes');
        const timeKey = time.format('HH:mm');
        slots[timeKey] = {
            timestamp: timeKey,
            fullTimestamp: time.format('HH:mm:ss'),
            soilTemp: 0,
            waterFlow: 0,
            envTemp: 0,
            humidity: 0,
            ph: 7,
            pressure: 1013,
            altitude: 0,
            hasData: false
        };
    }
    return slots;
};

export default function GroundStation() {
    const [currentData, setCurrentData] = useState<SensorData>({
        soilTemp: 0,
        waterFlow: 0,
        envTemp: 0,
        humidity: 0,
        ph: 7,
        pressure: 1013,
        altitude: 0,
    });

    const [previousData, setPreviousData] = useState<SensorData>({
        soilTemp: 0,
        waterFlow: 0,
        envTemp: 0,
        humidity: 0,
        ph: 7,
        pressure: 1013,
        altitude: 0,
    });

    const [minuteData, setMinuteData] = useState<MinuteData>(() => generateMinuteSlots());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousDataRef = useRef<SensorData>(currentData); // Use ref to track previous data

    const userId = "U9RW7PVxPWTrNG1B0hEHalC4w7b2";

    const tableHeaders = [
        'Timestamp',
        'Soil Temp (°C)',
        'Env Temp (°C)',
        'Humidity (%)',
        'pH',
        'ATM (hPa)',
        'Flow (L/s)',
    ];

    // Update minute slots every minute while preserving existing data
    useEffect(() => {
        const updateMinuteSlots = () => {
            setMinuteData(prevData => {
                const newSlots = generateMinuteSlots();
                
                // Preserve existing real data that's still within the 10-minute window
                Object.keys(newSlots).forEach(timeKey => {
                    const prevEntry = prevData[timeKey];
                    if (prevEntry && prevEntry.hasData) {
                        // Keep the real data, don't overwrite with default values
                        newSlots[timeKey] = { ...prevEntry };
                    }
                });
                
                console.log('Updated minute slots, preserved data for:', 
                    Object.keys(newSlots).filter(key => newSlots[key]?.hasData));
                return newSlots;
            });
        };

        // Update immediately
        updateMinuteSlots();

        // Set up interval to update every minute
        intervalRef.current = setInterval(updateMinuteSlots, 60000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const dataRef = ref(database, `users/${userId}/gsLocal/gs4`);
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            const firebaseData: FirebaseData | null = snapshot.val();
            console.log('Raw Firebase Data:', firebaseData);
            
            if (!firebaseData) return;
            
            // Store previous data using ref before updating
            setPreviousData(previousDataRef.current);
            
            // Extract new data from Firebase with proper fallbacks
            const newData: SensorData = {
                soilTemp: firebaseData.soilTemp || firebaseData.soil_temp || firebaseData.soilTemperature || 0,
                waterFlow: firebaseData.flowRate || firebaseData.flow_rate || firebaseData.waterFlow || firebaseData.flow || 0,
                envTemp: firebaseData.environmentTemp || firebaseData.env_temp || firebaseData.envTemp || firebaseData.temperature || 0,
                humidity: firebaseData.humidity || firebaseData.hum || 0,
                ph: firebaseData.phValue || firebaseData.pHValue || firebaseData.ph || 0,
                pressure: firebaseData.atmosPressure || firebaseData.pressure || firebaseData.atm_pressure || 0,
                altitude: firebaseData.altitude || firebaseData.alt || 0,
            };
            
            console.log('Processed data:', newData);
            
            // Update ref with new data
            previousDataRef.current = newData;
            setCurrentData(newData);

            // Update ONLY the current minute's data with new Firebase data
            const currentTime = moment();
            const currentMinute = currentTime.format('HH:mm');
            
            setMinuteData(prevData => {
                // Check if we have a slot for the current minute
                const currentSlot = prevData[currentMinute];
                if (currentSlot) {
                    const updatedData = { ...prevData };
                    
                    // Only update the current minute slot, don't touch others
                    updatedData[currentMinute] = {
                        timestamp: currentMinute,
                        fullTimestamp: currentTime.format('HH:mm:ss'),
                        ...newData, // Use the new Firebase data
                        hasData: true
                    };
                    
                    console.log(`Updated ONLY minute ${currentMinute} with new data:`, updatedData[currentMinute]);
                    return updatedData;
                } else {
                    // If somehow the current minute slot doesn't exist, create it
                    console.log(`Creating new slot for minute ${currentMinute}`);
                    return {
                        ...prevData,
                        [currentMinute]: {
                            timestamp: currentMinute,
                            fullTimestamp: currentTime.format('HH:mm:ss'),
                            ...newData,
                            hasData: true
                        }
                    };
                }
            });
        });

        return () => {
            off(dataRef, 'value', unsubscribe);
        };
    }, [userId]); // REMOVED currentData dependency - this was causing infinite loop!

    // Convert minute data to table format
    const tableData = Object.keys(minuteData)
        .sort() // Sort by time
        .map((timeKey, index, sortedKeys) => {
            const entry = minuteData[timeKey];
            if (!entry) return ['', '', '', '', '', '', '']; // Fallback for missing entries
            
            const prevKey = index > 0 ? sortedKeys[index - 1] : timeKey;
            const prevEntry = minuteData[prevKey];
            
            return [
                entry.timestamp,
                entry.soilTemp.toFixed(1),
                entry.envTemp.toFixed(1),
                entry.humidity.toFixed(1),
                entry.ph.toFixed(1),
                entry.pressure.toFixed(1),
                entry.waterFlow.toFixed(1),
            ];
        });

    const dataWithRealData = Object.values(minuteData).filter(entry => entry?.hasData).length;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent text-center">
                Ground Station Dashboard
            </h1>
            
            {/* Debug info - remove in production */}
            <div className="mb-4 p-4 bg-gray-100 rounded text-sm">
                <strong>Debug Info:</strong><br/>
                Last update: {new Date().toLocaleTimeString()}<br/>
                Current minute: {moment().format('HH:mm')}<br/>
                Minute slots: {Object.keys(minuteData).join(', ')}<br/>
                Slots with real data: {dataWithRealData}/10<br/>
                Current data - Soil Temp: {currentData.soilTemp}, Water Flow: {currentData.waterFlow}
            </div>
            
            {/* Donut Charts - showing current data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center">
                        <DonutChart
                            value={Math.round(currentData.soilTemp)}
                            maxValue={50}
                            label={`Soil Temp °C`}
                            color="#FF6B6B"
                        />
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center">
                        <DonutChart
                            value={Math.round(currentData.waterFlow)}
                            maxValue={5}
                            label={`Flow Speed L/s`}
                            color="#4ECDC4"
                        />
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center">
                        <DonutChart
                            value={Math.round(currentData.envTemp)}
                            maxValue={40}
                            label={`Env Temp °C`}
                            color="#FF6B6B"
                        />
                    </div>
                </div>
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center">
                        <DonutChart
                            value={Math.round(currentData.humidity)}
                            maxValue={100}
                            label={`Humidity`}
                            color="#4ECDC4"
                        />
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center">
                        <DonutChart
                            value={Math.round(currentData.ph)}
                            maxValue={14}
                            label={`pH`}
                            color="#FF6B6B"
                        />
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center">
                        <DonutChart
                            value={Math.round(currentData.pressure)}
                            maxValue={1100}
                            label={`Pressure`}
                            color="#FF6B6B"
                        />
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center">
                        <DonutChart
                            value={Math.round(currentData.altitude)}
                            maxValue={200}
                            label={`Altitude`}
                            color="#4ECDC4"
                        />
                    </div>
                </div>
            </div>

            {/* Data Table - showing historical data per minute */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Sensor Data Log (Per Minute)</h2>
                <div className="mb-2 text-sm text-gray-600">
                    Showing last 10 minutes of data. Entries with real data: {dataWithRealData}
                </div>
                <DataTable headers={tableHeaders} data={tableData} />
            </div>
        </div>
    );
}