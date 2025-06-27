import React, { createContext, useContext } from 'react';
import mapboxgl from 'mapbox-gl';

export interface NDVILayer {
    id: string;
    imageUrl: string;
    bounds: [[number, number], [number, number], [number, number], [number, number]];
    date: string;
}

interface MapContextType01 {
    map: mapboxgl.Map;
    toggleMap: boolean;
    setToggleMap: (toggle: boolean) => void;
    // NDVI functions
    addNDVILayer: (polygon: number[][], date: string, layerId?: string) => Promise<string | undefined>;
    removeNDVILayer: (layerId: string) => void;
    toggleNDVIVisibility: () => void;
    clearAllNDVILayers: () => void;
    ndviLayers: NDVILayer[];
    showNDVI: boolean;
}

export const MapContext2 = createContext<MapContextType01 | null>(null);

export const useMapContext = () => {
    const context = useContext(MapContext2);
    if (!context) {
        throw new Error('useMapContext must be used within a MapProvider');
    }
    return context;
};