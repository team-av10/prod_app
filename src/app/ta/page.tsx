"use client"
import { useState, useEffect } from 'react'
import MobScreen from './MobScreen'  // Adjust path as needed
import LapScreen from './LapScreen'  // Adjust path as needed

export default function ResponsivePage() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const checkScreenSize = () => {
      // You can adjust this breakpoint as needed
      // 1024px is typically the laptop breakpoint
      setIsMobile(window.innerWidth < 1024)
    }

    // Initial check
    checkScreenSize()

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize)

    // Cleanup event listener
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Show nothing or loading state while determining screen size
  if (isMobile === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Render based on screen size
  return (
    <div className="w-full h-screen">
      {isMobile ? <MobScreen /> : <LapScreen />}
    </div>
  )
}