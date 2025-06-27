'use client';

import React, { useState, useEffect } from 'react';
import { useMapContext } from './context/map-context2';
import { database } from '../../lib/firebase'; // Adjust the import path as needed
import { ref, get } from 'firebase/database';

interface NDVIControlPanelProps {
    userId: string;
}

const NDVIControlPanel: React.FC<NDVIControlPanelProps> = ({ userId }) => {
    const { 
        addNDVILayer, 
        removeNDVILayer, 
        toggleNDVIVisibility, 
        clearAllNDVILayers, 
        ndviLayers, 
        showNDVI 
    } = useMapContext();
    
    const [selectedPolygonId, setSelectedPolygonId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [availablePolygons, setAvailablePolygons] = useState<string[]>([]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [boundingBox, setBoundingBox] = useState<number[][]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Fetch available polygons from Firebase
    useEffect(() => {
        const fetchPolygons = async () => {
            if (!userId) return;
            
            setDataLoading(true);
            setError('');
            
            try {
                const polygonsRef = ref(database, `users/${userId}/polygons`);
                const polygonsSnapshot = await get(polygonsRef);
                
                if (polygonsSnapshot.exists()) {
                    const polygonsData = polygonsSnapshot.val();
                    const polygonsList = Object.keys(polygonsData);
                    setAvailablePolygons(polygonsList);
                    
                    // Set the first polygon as default if no polygon is selected
                    if (polygonsList.length > 0 && !selectedPolygonId) {
                        setSelectedPolygonId(polygonsList[0]);
                    }
                } else {
                    setError('No polygons found for this user');
                }
                
            } catch (err) {
                console.error('Error fetching polygons:', err);
                setError('Failed to fetch polygons from Firebase');
            } finally {
                setDataLoading(false);
            }
        };

        fetchPolygons();
    }, [userId]);

    // Fetch bounding box and dates when polygon is selected
    useEffect(() => {
        const fetchPolygonData = async () => {
            if (!userId || !selectedPolygonId) return;
            
            setError('');
            setSelectedDate(''); // Reset selected date when polygon changes
            
            try {
                // Fetch bounding box (assuming it's stored as a string)
                const bboxRef = ref(database, `users/${userId}/polygons/${selectedPolygonId}/bbox`);
                const bboxSnapshot = await get(bboxRef);
                
                if (bboxSnapshot.exists()) {
                    const bboxData = bboxSnapshot.val();
                    // Parse the bbox string to array if it's a string
                    let parsedBbox;
                    if (typeof bboxData === 'string') {
                        try {
                            // Clean the string by removing extra whitespace and potential trailing characters
                            const cleanedBboxData = bboxData.trim();
                            
                            // Try to find the JSON array part if there are extra characters
                            const jsonMatch = cleanedBboxData.match(/\[.*\]/);
                            const jsonToParse = jsonMatch ? jsonMatch[0] : cleanedBboxData;
                            
                            parsedBbox = JSON.parse(jsonToParse);
                            
                            // Validate that it's an array
                            if (!Array.isArray(parsedBbox)) {
                                throw new Error('Bbox is not an array');
                            }
                            
                            console.log('Parsed bbox:', parsedBbox);
                        } catch (e) {
                            console.error('Error parsing bbox:', e);
                            console.error('Original bbox data:', bboxData);
                            
                            // Try alternative parsing methods
                            try {
                                // Try to parse as comma-separated values
                                if (bboxData.includes(',')) {
                                    const values = bboxData.split(',').map(v => parseFloat(v.trim()));
                                    if (values.length >= 4 && values.every(v => !isNaN(v))) {
                                        // Assume format: [lng1, lat1, lng2, lat2] or similar
                                        parsedBbox = [
                                            [values[0], values[1]],
                                            [values[2], values[1]],
                                            [values[2], values[3]],
                                            [values[0], values[3]],
                                            [values[0], values[1]]
                                        ];
                                        console.log('Parsed bbox from CSV format:', parsedBbox);
                                    } else {
                                        throw new Error('Invalid CSV format');
                                    }
                                } else {
                                    throw new Error('Unknown bbox format');
                                }
                            } catch (altError) {
                                console.error('Alternative parsing failed:', altError);
                                setError(`Invalid bounding box format. Expected JSON array or CSV. Got: ${bboxData.substring(0, 50)}...`);
                                return;
                            }
                        }
                    } else {
                        parsedBbox = bboxData;
                    }
                    setBoundingBox(parsedBbox);
                } else {
                    setError('Bounding box not found for this polygon');
                    return;
                }

                // Fetch available dates with nested structure
                const datesRef = ref(database, `users/${userId}/polygons/${selectedPolygonId}/date`);
                const datesSnapshot = await get(datesRef);
                
                if (datesSnapshot.exists()) {
                    const datesData = datesSnapshot.val();
                    console.log('Raw dates data:', datesData);
                    const datesList: string[] = [];
                    
                    // Check if datesData is directly a string (single date)
                    if (typeof datesData === 'string') {
                        datesList.push(datesData);
                    } else if (typeof datesData === 'object' && datesData !== null) {
                        // Navigate through the nested structure (01, 02, etc.)
                        Object.keys(datesData).forEach(index => {
                            const dateEntry = datesData[index];
                            console.log(`Date entry for index ${index}:`, dateEntry);
                            
                            // Handle different possible structures
                            let dateValue = null;
                            
                            if (typeof dateEntry === 'string') {
                                // Direct string date
                                dateValue = dateEntry;
                            } else if (dateEntry && typeof dateEntry === 'object') {
                                // Object with date property
                                if (dateEntry.date) {
                                    dateValue = dateEntry.date;
                                } else if (dateEntry.Date) {
                                    dateValue = dateEntry.Date;
                                } else {
                                    // Check for any property that looks like a date
                                    const possibleDate = Object.values(dateEntry).find(val => 
                                        typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)
                                    );
                                    if (possibleDate) {
                                        dateValue = possibleDate as string;
                                    }
                                }
                            }
                            
                            if (dateValue && typeof dateValue === 'string' && !datesList.includes(dateValue)) {
                                // Validate date format (YYYY-MM-DD)
                                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                                    datesList.push(dateValue);
                                    console.log('Added date:', dateValue);
                                } else {
                                    console.warn('Invalid date format:', dateValue);
                                }
                            }
                        });
                    }
                    
                    console.log('Final dates list:', datesList);
                    
                    // Sort dates
                    datesList.sort();
                    setAvailableDates(datesList);
                    
                    // Set the first date as default if available
                    if (datesList.length > 0) {
                        setSelectedDate(datesList[0]);
                    } else {
                        setError('No valid dates found for this polygon');
                    }
                } else {
                    setError('No dates found for this polygon');
                }
                
            } catch (err) {
                console.error('Error fetching polygon data:', err);
                setError('Failed to fetch polygon data from Firebase');
            }
        };

        fetchPolygonData();
    }, [userId, selectedPolygonId]);

    const handleAddNDVILayer = async () => {
        if (!selectedDate || boundingBox.length === 0 || !selectedPolygonId) {
            alert('Please select a polygon, date, and ensure bounding box is loaded');
            return;
        }

        setIsLoading(true);
        try {
            await addNDVILayer(boundingBox, selectedDate);
        } catch (error) {
            console.error('Error adding NDVI layer:', error);
            alert('Failed to add NDVI layer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveLayer = (layerId: string) => {
        removeNDVILayer(layerId);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (dataLoading) {
        return (
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '50px',
                background: 'white',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                minWidth: '200px',
                zIndex: 1000
            }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>NDVI Controls</h3>
                <p>Loading data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '50px',
                background: 'white',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                minWidth: '200px',
                zIndex: 1000
            }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>NDVI Controls</h3>
                <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            right: '50px',
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            minWidth: '200px',
            zIndex: 1000
        }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>NDVI Controls</h3>
            
            {/* Polygon Selection Dropdown */}
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Select Polygon:
                </label>
                <select
                    value={selectedPolygonId}
                    onChange={(e) => setSelectedPolygonId(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">Select a polygon</option>
                    {availablePolygons.map((polygonId) => (
                        <option key={polygonId} value={polygonId}>
                            {polygonId}
                        </option>
                    ))}
                </select>
            </div>

            {/* Date Selection Dropdown */}
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Select Date:
                </label>
                <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={!selectedPolygonId || availableDates.length === 0}
                    style={{
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        opacity: (!selectedPolygonId || availableDates.length === 0) ? 0.6 : 1
                    }}
                >
                    <option value="">Select a date</option>
                    {availableDates.map((date) => (
                        <option key={date} value={date}>
                            {formatDate(date)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Polygon Info */}
            {selectedPolygonId && (
                <div style={{ marginBottom: '15px', fontSize: '12px', color: '#666' }}>
                    <p style={{ margin: '0' }}>Selected Polygon: {selectedPolygonId}</p>
                    <p style={{ margin: '0' }}>Available dates: {availableDates.length}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={handleAddNDVILayer}
                    disabled={isLoading || !selectedDate || !selectedPolygonId}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: (isLoading || !selectedDate || !selectedPolygonId) ? 'not-allowed' : 'pointer',
                        marginRight: '5px',
                        fontSize: '14px',
                        opacity: (isLoading || !selectedDate || !selectedPolygonId) ? 0.6 : 1,
                        marginBottom: '5px'
                    }}
                >
                    {isLoading ? 'Loading...' : 'Add NDVI Layer'}
                </button>

                <button
                    onClick={toggleNDVIVisibility}
                    style={{
                        backgroundColor: showNDVI ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px',
                        fontSize: '14px',
                        marginBottom: '5px'
                    }}
                >
                    {showNDVI ? 'Hide NDVI' : 'Show NDVI'}
                </button>

                <button
                    onClick={clearAllNDVILayers}
                    style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginBottom: '5px'
                    }}
                >
                    Clear All
                </button>
            </div>

            {/* Layer List */}
            {ndviLayers.length > 0 && (
                <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                        Active NDVI Layers ({ndviLayers.length})
                    </h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {ndviLayers.map((layer) => (
                            <div
                                key={layer.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '5px',
                                    border: '1px solid #eee',
                                    borderRadius: '4px',
                                    marginBottom: '5px',
                                    fontSize: '12px'
                                }}
                            >
                                <span>{formatDate(layer.date)}</span>
                                <button
                                    onClick={() => handleRemoveLayer(layer.id)}
                                    style={{
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div style={{ marginTop: '15px', fontSize: '12px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '13px' }}>NDVI Legend</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                            width: '15px', 
                            height: '15px', 
                            backgroundColor: '#00FF00', 
                            marginRight: '5px' 
                        }}></div>
                        <span>High Vegetation (0.6+)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                            width: '15px', 
                            height: '15px', 
                            backgroundColor: '#90EE90', 
                            marginRight: '5px' 
                        }}></div>
                        <span>Moderate Vegetation (0.3-0.6)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                            width: '15px', 
                            height: '15px', 
                            backgroundColor: '#FFFF00', 
                            marginRight: '5px' 
                        }}></div>
                        <span>Low Vegetation (0.1-0.3)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                            width: '15px', 
                            height: '15px', 
                            backgroundColor: '#A0A0A0', 
                            marginRight: '5px' 
                        }}></div>
                        <span>No Vegetation (&lt;0.1)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NDVIControlPanel;