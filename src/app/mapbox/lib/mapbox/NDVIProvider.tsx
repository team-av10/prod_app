"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapContext2 } from '../../context/map-context2';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { database } from '../../../../lib/firebase';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type MapComponentProps = {
    mapContainerRef: React.RefObject<HTMLDivElement | null>;
    initialViewState: {
        longitude: number;
        latitude: number;
        zoom: number;
    };
    children?: React.ReactNode;
};

interface NDVILayer {
    id: string;
    imageUrl: string;
    bounds: [[number, number], [number, number], [number, number], [number, number]];
    date: string;
    polygon: number[][];
}

interface GroundStation {
    id: string;
    lat: number;
    long: number;
    score: number;
}

interface Tree {
    id: string;
    lat: number;
    long: number;
    score: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NDVIProvider({
    mapContainerRef,
    initialViewState,
    children,
}: MapComponentProps) {
    
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    // Map reference
    const map = useRef<mapboxgl.Map | null>(null);
    
    // Firebase data
    const [groundStations, setGroundStations] = useState<GroundStation[]>([]);
    const [trees, setTrees] = useState<Tree[]>([]);
    
    // NDVI layers
    const [ndviLayers, setNdviLayers] = useState<NDVILayer[]>([]);
    const [showNDVI, setShowNDVI] = useState(true);
    
    // Map state
    const [toggleMap, setToggleMap] = useState(false); // false = satellite, true = dark
    const [mapStyleLoaded, setMapStyleLoaded] = useState(false);
    
    // Client configuration
    const clientId = "U9RW7PVxPWTrNG1B0hEHalC4w7b2";
    
    // ========================================================================
    // MAP INITIALIZATION
    // ========================================================================
    
    useEffect(() => {
        // Prevent re-initialization if map already exists
        if (!mapContainerRef.current || map.current) return;

        // Initialize Mapbox map
        map.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            zoom: initialViewState.zoom,
            center: [initialViewState.longitude, initialViewState.latitude],
            style: 'mapbox://styles/mapbox/satellite-v9'
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

        // Handle style load
        map.current.on('style.load', () => {
            console.log('✅ Initial style loaded');
            setMapStyleLoaded(true);
        });

        // Log map initialization
        console.log('🗺️ Map initialized:', {
            center: [initialViewState.longitude, initialViewState.latitude],
            zoom: initialViewState.zoom
        });

        // Cleanup on unmount
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [mapContainerRef, initialViewState]);

    // ========================================================================
    // FIREBASE DATA SUBSCRIPTIONS
    // ========================================================================
    
    useEffect(() => {
        // Subscribe to ground stations data
        const unsubscribeGroundStations = onValue(
            ref(database, `users/${clientId}/gsLocal`), 
            (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const stations = Object.keys(data).map((key) => ({
                        id: key,
                        lat: data[key]?.lat,
                        long: data[key]?.long,
                        score: data[key]?.score,
                    })).filter(item => 
                        item.lat !== undefined && 
                        item.long !== undefined &&
                        !isNaN(item.lat) &&
                        !isNaN(item.long)
                    );
                    setGroundStations(stations);
                } else {
                    setGroundStations([]);
                }
            }
        );

        // Subscribe to trees data
        const unsubscribeTrees = onValue(
            ref(database, `users/${clientId}/treeLocal`), 
            (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const treeData = Object.keys(data).map((key) => ({
                        id: key,
                        lat: data[key]?.lat,
                        long: data[key]?.long,
                        score: data[key]?.score,
                    })).filter(item => 
                        item.lat !== undefined && 
                        item.long !== undefined &&
                        !isNaN(item.lat) &&
                        !isNaN(item.long)
                    );
                    setTrees(treeData);
                } else {
                    setTrees([]);
                }
            }
        );
        
        // Cleanup subscriptions
        return () => {
            unsubscribeGroundStations();
            unsubscribeTrees();
        };
    }, [clientId]);

    // ========================================================================
    // TEST FUNCTION FOR DEBUGGING
    // ========================================================================
    
    /**
     * Test function to add a static image layer for debugging
     */
    const addTestLayer = (): void => {
        if (!map.current) return;

        const testId = 'test-layer';
        
        // Remove existing test layer
        if (map.current.getLayer(testId)) {
            map.current.removeLayer(testId);
        }
        if (map.current.getSource(testId)) {
            map.current.removeSource(testId);
        }

        // Add a test image layer using Mapbox's example
        map.current.addSource(testId, {
            type: 'image',
            url: 'https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif',
            coordinates: [
                [-80.425, 46.437], // top-left
                [-71.516, 46.437], // top-right
                [-71.516, 37.936], // bottom-right
                [-80.425, 37.936]  // bottom-left
            ]
        });

        map.current.addLayer({
            id: testId,
            type: 'raster',
            source: testId,
            paint: {
                'raster-opacity': 0.8
            }
        });

        console.log('🧪 Test layer added - if you can see this, the layer system works');
        
        // Fit to test layer bounds
        map.current.fitBounds([
            [-80.425, 37.936],
            [-71.516, 46.437]
        ], { padding: 50 });
    };

    // ========================================================================
    // NDVI LAYER MANAGEMENT FUNCTIONS
    // ========================================================================
    
    /**
     * Add NDVI layer to the map with comprehensive debugging
     */
    const addNDVILayer = async (
        polygon: number[][], 
        date: string, 
        layerId?: string
    ): Promise<string | undefined> => {
        if (!map.current) {
            console.warn('❌ Map not initialized');
            return;
        }

        console.log('🔄 Starting NDVI layer addition...', { 
            polygon, 
            date, 
            layerId,
            mapCenter: map.current.getCenter(),
            mapZoom: map.current.getZoom()
        });

        try {
            // Validate polygon
            if (!polygon || polygon.length < 4) {
                throw new Error('Invalid polygon - needs at least 4 coordinates');
            }

            console.log('📡 Making API request...');
            
            // Fetch NDVI image from Sentinel Hub API
            const response = await axios.post('/api/sentinelhub-01', { 
                polygon, 
                date 
            }, {
                responseType: 'blob',
                timeout: 30000
            });

            console.log('📊 API Response received:', {
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers['content-type'],
                contentLength: response.headers['content-length'],
                dataSize: response.data.size,
                dataType: response.data.type
            });

            if (response.status === 200) {
                // Validate response data
                if (!response.data || response.data.size === 0) {
                    throw new Error('Empty response from API');
                }

                // Check if it's actually an image
                const contentType = response.headers['content-type'] || response.data.type;
                if (!contentType || !contentType.startsWith('image/')) {
                    console.warn('⚠️ Response may not be an image:', contentType);
                    
                    // Try to read as text to see if it's an error message
                    const text = await response.data.text();
                    console.log('📄 Response content:', text.substring(0, 500));
                    throw new Error(`Invalid response type: ${contentType}`);
                }

                // Create blob URL for the image
                const imageUrl = URL.createObjectURL(response.data);
                console.log('🖼️ Image blob URL created:', imageUrl);
                
                // Calculate bounds from polygon coordinates
                const lngs = polygon.map(coord => coord[0]);
                const lats = polygon.map(coord => coord[1]);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                
                console.log('📐 Calculated bounds:', { minLng, maxLng, minLat, maxLat });
                
                // Validate bounds
                if (minLng >= maxLng || minLat >= maxLat) {
                    throw new Error('Invalid polygon bounds');
                }
                
                // Create coordinates for Mapbox (counter-clockwise from top-left)
                const coordinates = [
                    [minLng, maxLat], // top-left
                    [maxLng, maxLat], // top-right
                    [maxLng, minLat], // bottom-right
                    [minLng, minLat]  // bottom-left
                ] as [[number, number], [number, number], [number, number], [number, number]];

                console.log('🎯 Image coordinates:', coordinates);

                // Generate unique layer ID
                const id = layerId || `ndvi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // Remove existing layer with same ID if it exists
                if (map.current.getLayer(id)) {
                    console.log('🔄 Removing existing layer:', id);
                    map.current.removeLayer(id);
                }
                if (map.current.getSource(id)) {
                    console.log('🔄 Removing existing source:', id);
                    map.current.removeSource(id);
                }

                // Create and test image loading
                console.log('🖼️ Testing image loading...');
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Image loading timeout'));
                    }, 10000);

                    img.onload = () => {
                        clearTimeout(timeout);
                        console.log('✅ Image loaded successfully:', {
                            width: img.width,
                            height: img.height,
                            naturalWidth: img.naturalWidth,
                            naturalHeight: img.naturalHeight
                        });

                        try {
                            if (!map.current) {
                                reject(new Error('Map instance lost during image loading'));
                                return;
                            }

                            // Add image source to map
                            console.log('➕ Adding image source to map...');
                            map.current.addSource(id, {
                                type: 'image',
                                url: imageUrl,
                                coordinates: coordinates
                            });

                            // Verify source was added
                            const source = map.current.getSource(id);
                            console.log('📍 Source added:', !!source);

                            // Add raster layer with explicit opacity
                            console.log('🎨 Adding raster layer...');
                            map.current.addLayer({
                                id: id,
                                type: 'raster',
                                source: id,
                                paint: {
                                    'raster-fade-duration': 0,
                                    'raster-opacity': showNDVI ? 0.8 : 0.8 // Force visibility for testing
                                },
                                layout: {
                                    'visibility': 'visible'
                                }
                            });

                            // Verify layer was added
                            const layer = map.current.getLayer(id);
                            console.log('🎭 Layer added:', !!layer);

                            // Check layer properties
                            if (layer) {
                                const opacity = map.current.getPaintProperty(id, 'raster-opacity');
                                const visibility = map.current.getLayoutProperty(id, 'visibility');
                                console.log('🔍 Layer properties:', { opacity, visibility });
                            }

                            // Store layer information
                            const newLayer: NDVILayer = {
                                id,
                                imageUrl,
                                bounds: [
                                    [minLng, maxLat], 
                                    [maxLng, maxLat], 
                                    [maxLng, minLat], 
                                    [minLng, minLat]
                                ] as [[number, number], [number, number], [number, number], [number, number]],
                                date,
                                polygon
                            };

                            // Update state
                            setNdviLayers(prev => [...prev.filter(layer => layer.id !== id), newLayer]);
                            
                            console.log('✅ NDVI layer added successfully:', id);
                            
                            // Fit map to layer bounds for testing
                            const bounds = new mapboxgl.LngLatBounds();
                            coordinates.forEach(coord => bounds.extend(coord));
                            map.current.fitBounds(bounds, { 
                                padding: 100,
                                duration: 2000
                            });
                            
                            // Force map repaint and trigger layer refresh
                            setTimeout(() => {
                                if (map.current) {
                                    map.current.triggerRepaint();
                                    // Force layer update
                                    map.current.setPaintProperty(id, 'raster-opacity', 0.8);
                                }
                            }, 100);
                            
                            resolve(id);
                        } catch (error) {
                            clearTimeout(timeout);
                            console.error('❌ Error adding layer to map:', error);
                            reject(error);
                        }
                    };

                    img.onerror = (error) => {
                        clearTimeout(timeout);
                        console.error('❌ Image loading failed:', error);
                        console.error('🖼️ Failed image URL:', imageUrl);
                        reject(new Error('Failed to load NDVI image'));
                    };

                    console.log('🔄 Starting image load...');
                    img.src = imageUrl;
                });
                
            } else {
                throw new Error(`API returned status ${response.status}: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error('❌ Error in addNDVILayer:', error);
            
            // Enhanced error reporting
            if (error.response) {
                console.error('📡 API Error Response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            }
            
            // Provide user-friendly error messages
            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout - please try again');
            } else if (error.response?.status === 400) {
                throw new Error('Invalid polygon or date format');
            } else if (error.response?.status === 401) {
                throw new Error('Authentication failed - check API credentials');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error - please try again later');
            } else {
                throw new Error(error.message || 'Failed to fetch NDVI data');
            }
        }
    };

    /**
     * Remove NDVI layer from the map
     */
    const removeNDVILayer = (layerId: string): void => {
        if (!map.current) return;

        console.log('🗑️ Removing NDVI layer:', layerId);

        // Remove layer and source from map
        if (map.current.getLayer(layerId)) {
            map.current.removeLayer(layerId);
            console.log('✅ Layer removed from map');
        }
        if (map.current.getSource(layerId)) {
            map.current.removeSource(layerId);
            console.log('✅ Source removed from map');
        }

        // Clean up blob URL and update state
        setNdviLayers(prev => {
            const layer = prev.find(l => l.id === layerId);
            if (layer) {
                URL.revokeObjectURL(layer.imageUrl);
                console.log('✅ Blob URL revoked');
            }
            return prev.filter(l => l.id !== layerId);
        });

        console.log('✅ NDVI layer removed:', layerId);
    };

    /**
     * Toggle visibility of all NDVI layers
     */
    const toggleNDVIVisibility = (): void => {
        if (!map.current) return;

        const newVisibility = !showNDVI;
        setShowNDVI(newVisibility);

        console.log(`👁️ Toggling NDVI visibility to: ${newVisibility}`);

        // Update opacity for all NDVI layers
        ndviLayers.forEach(layer => {
            if (map.current!.getLayer(layer.id)) {
                map.current!.setPaintProperty(
                    layer.id, 
                    'raster-opacity', 
                    newVisibility ? 0.8 : 0
                );
                console.log(`🎨 Updated opacity for layer ${layer.id}: ${newVisibility ? 0.8 : 0}`);
            }
        });

        console.log(`👁️ NDVI layers ${newVisibility ? 'shown' : 'hidden'}`);
    };

    /**
     * Remove all NDVI layers
     */
    const clearAllNDVILayers = (): void => {
        console.log('🧹 Clearing all NDVI layers...');
        
        // Remove each layer
        ndviLayers.forEach(layer => {
            removeNDVILayer(layer.id);
        });
        
        // Reset state
        setNdviLayers([]);
        setShowNDVI(false);
        
        console.log('✅ All NDVI layers cleared');
    };

    /**
     * Update NDVI layer opacity
     */
    const updateNDVILayerOpacity = (layerId: string, opacity: number): void => {
        if (!map.current || !map.current.getLayer(layerId)) return;
        
        map.current.setPaintProperty(layerId, 'raster-opacity', opacity);
        console.log(`🎨 Updated opacity for layer ${layerId}: ${opacity}`);
    };

    /**
     * Debug layer visibility - Comprehensive debugging function
     */
    const debugNDVILayer = (layerId: string): void => {
        if (!map.current) {
            console.log('❌ Map not initialized');
            return;
        }
        
        console.log('🔍 === DEBUGGING LAYER ===', layerId);
        
        const layer = map.current.getLayer(layerId);
        const source = map.current.getSource(layerId);
        
        console.log('📋 Layer exists:', !!layer);
        console.log('📋 Source exists:', !!source);
        
        if (layer) {
            const opacity = map.current.getPaintProperty(layerId, 'raster-opacity');
            const visibility = map.current.getLayoutProperty(layerId, 'visibility');
            const contrast = map.current.getPaintProperty(layerId, 'raster-contrast');
            
            console.log('🎨 Layer Properties:', {
                opacity,
                visibility,
                contrast,
                type: (layer as any).type,
                source: (layer as any).source
            });
        }
        
        if (source && source.type === 'image') {
            const imageSource = source as any;
            console.log('🖼️ Image Source Properties:', {
                type: imageSource.type,
                coordinates: imageSource.coordinates,
                url: imageSource.url
            });
        }
        
        // Check if layer is in current style
        const style = map.current.getStyle();
        const layerInStyle = style.layers.find((l: any) => l.id === layerId);
        const sourceInStyle = style.sources[layerId];
        
        console.log('🎭 In current style:', {
            layer: !!layerInStyle,
            source: !!sourceInStyle
        });
        
        // Get map bounds and center
        const mapBounds = map.current.getBounds();
        const mapCenter = map.current.getCenter();
        
        console.log('🗺️ Map State:', {
            bounds: mapBounds,
            center: mapCenter,
            zoom: map.current.getZoom()
        });
        
        console.log('🔍 === DEBUG COMPLETE ===');
    };

    /**
     * Debug all current layers and sources
     */
    const debugAllLayers = (): void => {
        if (!map.current) return;
        
        console.log('🔍 === ALL LAYERS DEBUG ===');
        
        const style = map.current.getStyle();
        console.log('📋 Total layers:', style.layers.length);
        console.log('📋 Total sources:', Object.keys(style.sources).length);
        
        // List all layers
        style.layers.forEach((layer: any, index: number) => {
            console.log(`🎭 Layer ${index}:`, {
                id: layer.id,
                type: layer.type,
                source: layer.source,
                visible: layer.layout?.visibility !== 'none'
            });
        });
        
        // List all sources
        Object.keys(style.sources).forEach(sourceId => {
            const source = style.sources[sourceId];
            console.log(`📍 Source ${sourceId}:`, {
                type: source.type,
                ...(source.type === 'image' ? { coordinates: (source as any).coordinates } : {})
            });
        });
        
        console.log('🔍 === ALL LAYERS DEBUG COMPLETE ===');
    };

    // ========================================================================
    // MARKER MANAGEMENT FUNCTIONS
    // ========================================================================
    
    const removeAllMarkers = (): void => {
        const currentMarkers = document.querySelectorAll('.mapboxgl-marker');
        currentMarkers.forEach(marker => marker.remove());
    };

    const createMarkerElement = (iconUrl: string, className: string, score?: number): HTMLDivElement => {
        const el = document.createElement('div');
        el.className = className;
        el.style.backgroundImage = `url(${iconUrl})`;
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = 'cover';
        el.style.cursor = 'pointer';
        el.style.position = 'relative';

        if (score !== undefined && score < 5) {
            const warningIcon = document.createElement('div');
            warningIcon.className = 'warning-icon';
            warningIcon.style.backgroundImage = 'url(/warning.png)';
            warningIcon.style.width = '15px';
            warningIcon.style.height = '15px';
            warningIcon.style.backgroundSize = 'cover';
            warningIcon.style.position = 'absolute';
            warningIcon.style.top = '-10px';
            warningIcon.style.left = '10px';
            warningIcon.style.borderRadius = '50%';
            warningIcon.style.border = '2px solid white';
            warningIcon.style.backgroundColor = 'white';
            el.appendChild(warningIcon);
        }

        return el;
    };

    const addGroundStationMarkers = (): void => {
        if (!map.current) return;

        groundStations.forEach((station) => {
            const el = createMarkerElement('/antenna.png', 'ground-station-marker', station.score);
            
            el.addEventListener('click', () => {
                console.log('Ground Station clicked:', station);
                new mapboxgl.Popup()
                    .setLngLat([station.long, station.lat])
                    .setHTML(`
                        <div style="padding: 10px;">
                            <h3>Ground Station</h3>
                            <p><strong>ID:</strong> ${station.id}</p>
                            <p><strong>Score:</strong> ${station.score}</p>
                            <p><strong>Coordinates:</strong> ${station.lat.toFixed(4)}, ${station.long.toFixed(4)}</p>
                        </div>
                    `)
                    .addTo(map.current!);
            });

            new Marker(el)
                .setLngLat([station.long, station.lat])
                .addTo(map.current!);
        });
    };

    const addTreeMarkers = (): void => {
        if (!map.current) return;

        trees.forEach((tree) => {
            const el = createMarkerElement('/tree.png', 'tree-marker', tree.score);
            
            el.addEventListener('click', () => {
                console.log('Tree clicked:', tree);
                new mapboxgl.Popup()
                    .setLngLat([tree.long, tree.lat])
                    .setHTML(`
                        <div style="padding: 10px;">
                            <h3>Tree</h3>
                            <p><strong>ID:</strong> ${tree.id}</p>
                            <p><strong>Score:</strong> ${tree.score}</p>
                            <p><strong>Coordinates:</strong> ${tree.lat.toFixed(4)}, ${tree.long.toFixed(4)}</p>
                        </div>
                    `)
                    .addTo(map.current!);
            });

            new Marker(el)
                .setLngLat([tree.long, tree.lat])
                .addTo(map.current!);
        });
    };

    // ========================================================================
    // MAP STYLE MANAGEMENT - FIXED VERSION
    // ========================================================================
    
    useEffect(() => {
        if (!map.current || !mapStyleLoaded) return;
        
        console.log('🎨 Style change requested, current toggle state:', toggleMap);

        const newStyle = toggleMap ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/satellite-v9";
        const currentStyle = map.current.getStyle().name;
        
        // Only change style if it's actually different
        if ((toggleMap && currentStyle !== 'Mapbox Dark') || (!toggleMap && currentStyle !== 'Mapbox Satellite')) {
            console.log('🔄 Actually changing map style to:', newStyle);
            
            // Store current NDVI layers data before style change
            const currentNDVILayers = [...ndviLayers];
            
            map.current.setStyle(newStyle);
            
            map.current.once('style.load', () => {
                console.log('✅ Style loaded, re-adding layers...');
                setMapStyleLoaded(true);
                
                // Re-add NDVI layers after style change
                currentNDVILayers.forEach((layer) => {
                    if (map.current && !map.current.getSource(layer.id)) {
                        console.log('🔄 Re-adding layer after style change:', layer.id);
                        
                        try {
                            map.current.addSource(layer.id, {
                                type: 'image',
                                url: layer.imageUrl,
                                coordinates: layer.bounds
                            });
                            
                            map.current.addLayer({
                                id: layer.id,
                                type: 'raster',
                                source: layer.id,
                                paint: {
                                    'raster-fade-duration': 0,
                                    'raster-opacity': showNDVI ? 0.8 : 0
                                },
                                layout: {
                                    'visibility': 'visible'
                                }
                            });
                            
                            console.log('✅ Layer re-added successfully:', layer.id);
                        } catch (error) {
                            console.error('❌ Error re-adding layer:', layer.id, error);
                        }
                    }
                });

                // Re-add markers in satellite mode
                if (!toggleMap) {
                    setTimeout(() => {
                        removeAllMarkers();
                        addGroundStationMarkers();
                        addTreeMarkers();
                    }, 100);
                }
            });
        }
    }, [toggleMap]); // Remove ndviLayers and showNDVI from dependencies to prevent infinite loops

    // ========================================================================
    // CLEANUP
    // ========================================================================
    
    useEffect(() => {
        return () => {
            ndviLayers.forEach(layer => {
                URL.revokeObjectURL(layer.imageUrl);
            });
        };
    }, []);

    // ========================================================================
    // CONTEXT PROVIDER
    // ========================================================================
    
    const contextValue = {
        map: map.current!,
        toggleMap,
        setToggleMap,
        // NDVI functions
        addNDVILayer,
        removeNDVILayer,
        toggleNDVIVisibility,
        clearAllNDVILayers,
        updateNDVILayerOpacity,
        debugNDVILayer,
        debugAllLayers,
        addTestLayer,
        ndviLayers,
        showNDVI,
        // Data
        groundStations,
        trees
    };

    return (
        <MapContext2.Provider value={contextValue}>
{children}
</MapContext2.Provider>
);
}