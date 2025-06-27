"use client"
import { useRef, useState } from "react";
import TreeProvider from "./lib/mapbox/TreeProvider";
import NDVIProvider from "./lib/mapbox/NDVIProvider";
import NDVIControlPanel from "./NDVIControlPanel";

export default function LapPage() {
  const treeMapContainerRef = useRef<HTMLDivElement | null>(null);
  const ndviMapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isToggled, setToggled] = useState<boolean>(true);

  const handleToggle = () => {
    setToggled(prev => !prev);
  };

  const initialViewState = {
    longitude: 80.27,
    latitude: 13.08,
    zoom: 10
  };

  return (
    <div>
      <div className="w-[1298px] h-[430px] relative">
        {/* Tree Map View */}
        <div 
          className={`absolute inset-0 h-full w-full rounded-[44px] ${isToggled ? 'block' : 'hidden'}`}
          ref={treeMapContainerRef}
        />
        {isToggled && (
          <TreeProvider
            mapContainerRef={treeMapContainerRef}
            initialViewState={initialViewState}
          >
            <button className="btn bg-white text-black absolute top-10 left-10" onClick={handleToggle}>
              <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" d="M5.005 11.19V12l6.998 4.042L19 12v-.81M5 16.15v.81L11.997 21l6.998-4.042v-.81M12.003 3 5.005 7.042l6.998 4.042L19 7.042 12.003 3Z"/>
              </svg>
              NDVI Layer
            </button>
          </TreeProvider>
        )}

        {/* NDVI Map View */}
        <div 
          className={`absolute inset-0 h-full w-full rounded-[44px] ${!isToggled ? 'block' : 'hidden'}`}
          ref={ndviMapContainerRef}
        />
        {!isToggled && (
          <NDVIProvider 
            mapContainerRef={ndviMapContainerRef}
            initialViewState={initialViewState}
          >
            <NDVIControlPanel userId="U9RW7PVxPWTrNG1B0hEHalC4w7b2" />
            <button className="btn bg-white text-black absolute top-10 left-10" onClick={handleToggle}>
              <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" d="M5.005 11.19V12l6.998 4.042L19 12v-.81M5 16.15v.81L11.997 21l6.998-4.042v-.81M12.003 3 5.005 7.042l6.998 4.042L19 7.042 12.003 3Z"/>
              </svg>
              Tree Layer
            </button>
          </NDVIProvider>
        )}
      </div>
    </div>
  );
}