"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapContext } from '../../context/map-context';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { database } from '../../../../lib/firebase';
import { ref, onValue, get } from 'firebase/database';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type MapComponentProps = {
    mapContainerRef: React.RefObject<HTMLDivElement | null>;
    initialViewState: {
        longitude: number;
        latitude: number;
        zoom: number;
    };
    children?: React.ReactNode;
};

export default function TreeProvider({
    mapContainerRef,
    children,
}: MapComponentProps) {
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const [groundStations, setGroundStations] = useState<any[]>([]);
    const [trees, setTrees] = useState<any[]>([]);
    const clientId = "U9RW7PVxPWTrNG1B0hEHalC4w7b2";
    const [toggleMap, setToggleMap] = useState(false);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || map.current) return;

        const initializeMap = () => {
            if (!mapContainerRef.current) return;

            map.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                zoom: 10,
                center: [80.27, 13.08],
                style: 'mapbox://styles/mapbox/satellite-streets-v12'
            });

            map.current.on('load', () => {
                setIsMapInitialized(true);
            });
        };

        initializeMap();

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
                setIsMapInitialized(false);
            }
        };
    }, [mapContainerRef]);

    // Handle Firebase data
    useEffect(() => {
        console.log('Setting up Firebase listeners...');
        setIsLoading(true);
        setError(null);
        
        // Function to process Firebase data
        const processData = (data: any) => {
            if (!data) {
                console.log('No data received from Firebase');
                return [];
            }
            console.log('Processing data:', data);
            const processed = Object.keys(data)
                .map((key) => ({
                    id: key,
                    lat: data[key]?.lat,
                    long: data[key]?.long,
                    score: data[key]?.score,
                }))
                .filter(item => 
                    item.lat !== undefined && 
                    item.long !== undefined &&
                    !isNaN(item.lat) &&
                    !isNaN(item.long)
                );
            console.log('Processed data:', processed);
            return processed;
        };

        // Function to fetch data
        const fetchData = async () => {
            try {
                // Fetch ground stations
                const gsRef = ref(database, `users/${clientId}/gsLocal`);
                const gsSnapshot = await get(gsRef);
                console.log('Ground stations snapshot:', gsSnapshot.val());
                const gsData = processData(gsSnapshot.val());
                setGroundStations(gsData);

                // Fetch trees
                const treesRef = ref(database, `users/${clientId}/treeLocal`);
                const treesSnapshot = await get(treesRef);
                console.log('Trees snapshot:', treesSnapshot.val());
                const treesData = processData(treesSnapshot.val());
                setTrees(treesData);

                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
                setIsLoading(false);
            }
        };

        // Initial fetch
        fetchData();

        // Set up real-time listeners
        const gsRef = ref(database, `users/${clientId}/gsLocal`);
        const unsubscribeGroundStations = onValue(gsRef, (snapshot) => {
            console.log('Ground stations update received:', snapshot.val());
            const data = processData(snapshot.val());
            setGroundStations(data);
        }, (error) => {
            console.error('Error in ground stations listener:', error);
            setError(error.message);
        });

        const treesRef = ref(database, `users/${clientId}/treeLocal`);
        const unsubscribeTrees = onValue(treesRef, (snapshot) => {
            console.log('Trees update received:', snapshot.val());
            const data = processData(snapshot.val());
            setTrees(data);
        }, (error) => {
            console.error('Error in trees listener:', error);
            setError(error.message);
        });
        
        return () => {
            console.log('Cleaning up Firebase listeners...');
            unsubscribeGroundStations();
            unsubscribeTrees();
        };
    }, [clientId]);

    // Function to remove all markers
    const removeAllMarkers = () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
    };

    // Function to create marker element
    const createMarkerElement = (iconUrl: string, className: string, score: number) => {
        const el = document.createElement('div');
        el.className = className;
        el.style.backgroundImage = `url(${iconUrl})`;
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = 'cover';

        if (score < 5) {
            const warningIcon = document.createElement('div');
            warningIcon.className = 'warning-icon';
            warningIcon.style.backgroundImage = 'url(/warning.png)';
            warningIcon.style.width = '15px';
            warningIcon.style.height = '15px';
            warningIcon.style.backgroundSize = 'cover';
            warningIcon.style.position = 'absolute';
            warningIcon.style.top = '-10px';
            warningIcon.style.left = '10px';
            el.appendChild(warningIcon);
        }

        return el;
    };

    // Function to add markers
    const addMarkers = () => {
        if (!map.current) return;

        // Add ground station markers
        groundStations.forEach((station) => {
            const el = createMarkerElement('/antenna.png', 'ground-station-marker', station.score);
            const marker = new Marker(el)
                .setLngLat([station.long, station.lat])
                .addTo(map.current!);
            markersRef.current.push(marker);
        });

        // Add tree markers
        trees.forEach((tree) => {
            const el = createMarkerElement('/tree.png', 'tree-marker', tree.score);
            const marker = new Marker(el)
                .setLngLat([tree.long, tree.lat])
                .addTo(map.current!);
            markersRef.current.push(marker);
        });
    };

    // Handle map style changes and markers
    useEffect(() => {
        if (!map.current || !isMapInitialized || isLoading) return;

        const updateMapStyle = () => {
            if (!map.current) return;

            const style = toggleMap ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/satellite-streets-v12";
            map.current.setStyle(style);

            map.current.once('style.load', () => {
                if (!map.current) return;

                if (toggleMap) {
                    // Add radar layer for dark mode
                    if (!map.current.getSource('radar')) {
                        map.current.addSource('radar', {
                            type: 'image',
                            url: 'https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif',
                            coordinates: [
                                [-80.425, 46.437],
                                [-71.516, 46.437],
                                [-71.516, 37.936],
                                [-80.425, 37.936]
                            ]
                        });
                    }

                    if (!map.current.getLayer('radar-layer')) {
                        map.current.addLayer({
                            id: 'radar-layer',
                            type: 'raster',
                            source: 'radar',
                            paint: {
                                'raster-fade-duration': 0
                            }
                        });
                    }
                } else {
                    // Remove radar layer and add markers for satellite mode
                    if (map.current.getLayer('radar-layer')) {
                        map.current.removeLayer('radar-layer');
                    }
                    if (map.current.getSource('radar')) {
                        map.current.removeSource('radar');
                    }

                    removeAllMarkers();
                    addMarkers();
                }
            });
        };

        updateMapStyle();
    }, [map, groundStations, trees, toggleMap, isMapInitialized, isLoading]);

    // Update markers when data changes
    useEffect(() => {
        if (!map.current || !isMapInitialized || isLoading || toggleMap) return;

        removeAllMarkers();
        addMarkers();
    }, [groundStations, trees, isMapInitialized, isLoading, toggleMap]);

    if (error) {
        console.error('Error in TreeProvider:', error);
    }

    return (
        <MapContext.Provider value={{ map: map.current!, toggleMap, setToggleMap }}>
            {children}
        </MapContext.Provider>
    );
}