"use client"
import React from 'react'
import WindSpeedComponent from './WindSpeedComponent'
import WeatherCard from './WeatherCard'
import NDVIStatsPage from '../statpage/NDVIStatsPage'
import LapPage from '../mapbox/LapPage'
import AlertsComponent from './AlertsComponent'
import GroundStationNav from './GroundStation'

export default function LapScreen() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Main Container */}
      <div className="flex flex-col gap-4 h-screen max-w-7xl mx-auto">
        
        {/* Top Row - Components 1, 2, 3, 4, 5 */}
        <div className="flex gap-4 flex-none">
          
          {/* Left Column - Components 1 and 2 stacked */}
          <div className="flex flex-col gap-4">
            {/* Component 1 - DroneDashboard */}
            <div>
              <GroundStationNav/>
            </div>
            
            {/* Component 2 - WindSpeedComponent */}
            <div>
              <WindSpeedComponent/>
            </div>
          </div>
          
          {/* Component 3 - WeatherCard */}
          <div>
            <WeatherCard
            />
          </div>
          
          {/* Component 4 - NDVIStatsPage */}
          <div className="rounded-[44px]">
            <NDVIStatsPage/>
          </div>
          
          {/* Component 5 - AlertPanel */}
          <div className="rounded-[44px]">
            {/* <AlertPanel uniqueUserId="U9RW7PVxPWTrNG1B0hEHalC4w7b2"/> */}
            <AlertsComponent userId='U9RW7PVxPWTrNG1B0hEHalC4w7b2'/>
          </div>
          
        </div>
        
        {/* Bottom Row - Component 6 (Map) */}
        <div>
          <LapPage/>
        </div>
        
      </div>
    </div>
  )
}