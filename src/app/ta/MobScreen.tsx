"use client"
import AlertsComponentMob from './AlertComponentMob'
import WeatherCardMob from './WeatherCardMob'
import SimpleWindCompMob from './WindSpeedCompMob'
import MobPage from '../mapbox/MobPage'
import GroundStationNavMob from './GroundStationMobile'
import React, { useState, useRef } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'



export default function MobScreen() {
    const [currentPage, setCurrentPage] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
  
    const scrollToPage = (pageIndex: number) => {
      if (containerRef.current) {
        const pageHeight = window.innerHeight
        containerRef.current.scrollTo({
          top: pageIndex * pageHeight,
          behavior: 'smooth'
        })
        setCurrentPage(pageIndex)
      }
    }
  
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop
      const pageHeight = window.innerHeight
      const newPage = Math.round(scrollTop / pageHeight)
      
      if (newPage !== currentPage) {
        setCurrentPage(newPage)
      }
    }
  
    return (
      <div className="relative w-full max-w-sm mx-auto bg-gray-100 min-h-screen">
        {/* Navigation Indicators */}
        {/* <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          <button
            onClick={() => scrollToPage(0)}
            className={`w-3 h-3 rounded-full transition-colors ${
              currentPage === 0 ? 'bg-blue-600' : 'bg-gray-400'
            }`}
            aria-label="Go to Page 1"
          />
          <button
            onClick={() => scrollToPage(1)}
            className={`w-3 h-3 rounded-full transition-colors ${
              currentPage === 1 ? 'bg-blue-600' : 'bg-gray-400'
            }`}
            aria-label="Go to Page 2"
          />
        </div> */}
  
        {/* Navigation Arrows */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2">
          {currentPage === 1 && (
            <button
              onClick={() => scrollToPage(0)}
              className="bg-white bg-opacity-80 p-2 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
              aria-label="Go to previous page"
            >
              <ChevronUp className="w-6 h-6 text-gray-700" />
            </button>
          )}
          {currentPage === 0 && (
            <button
              onClick={() => scrollToPage(1)}
              className="bg-white bg-opacity-80 p-2 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
              aria-label="Go to next page"
            >
              <ChevronDown className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>
  
        {/* Scrollable Container */}
        <div
          ref={containerRef}
          className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Page 1
          <div className="min-h-screen flex flex-col justify-center items-center p-4 snap-start">
            <div className="w-full max-w-sm space-y-4">
              <WeatherCardMob />
              <SimpleWindCompMob />
              <AlertsComponentMob userId='U9RW7PVxPWTrNG1B0hEHalC4w7b2' />
            </div>
          </div> */}
                    {/* Page 1 */}
        <div className="min-h-screen flex flex-col justify-center items-center p-4 snap-start">
            <div className="w-full max-w-sm mx-auto flex flex-col items-center space-y-4">
              <WeatherCardMob />
              <SimpleWindCompMob />
              <AlertsComponentMob userId='U9RW7PVxPWTrNG1B0hEHalC4w7b2' />
            </div>
          </div>

  
          {/* Page 2 */}
          <div className="min-h-screen flex flex-col justify-center items-center p-4 snap-start">
          <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center space-y-4">
              <MobPage />
              <GroundStationNavMob />
            </div>
          </div>
        </div>
  
        {/* Hide scrollbar with CSS */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    )
  }