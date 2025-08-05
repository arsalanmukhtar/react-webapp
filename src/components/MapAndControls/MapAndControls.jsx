import React, { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { TiLocationArrowOutline } from 'react-icons/ti';
import { useAuth } from '../../contexts/AuthContext';
import MapLayerLogger from './MapLayerLogger';
import MapSourceAndLayer from './MapSourceAndLayer';
import LayerLoadingIndicator from './LayerLoadingIndicator';

const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (!MapboxAccessToken) {
    console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

const MapAndControls = ({ user, isMapDashboardActive, activeMapLayers }) => {
    const { token } = useAuth(); // Get authentication token
    const mapRef = useRef(null);
    const previousLayerCountRef = useRef(0);

    // Layer filter loading functionality
    const loadLayerFilter = async (layerName) => {
        if (!token) return null;
        
        try {
            const response = await fetch(`http://localhost:8000/api/tiling/layers/filter/${layerName}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const filterData = await response.json();
                
                if (filterData.filter_config) {
                    try {
                        return typeof filterData.filter_config === 'string' 
                            ? JSON.parse(filterData.filter_config) 
                            : filterData.filter_config;
                    } catch (e) {
                        console.warn(`Invalid filter config for layer ${layerName}:`, e);
                    }
                }
            }
        } catch (error) {
            console.warn(`Failed to load filter for ${layerName}:`, error);
        }
        return null;
    };

    // Convert structured filter config to Mapbox filter
    const createGenericFilter = (filterConfig) => {
        if (!filterConfig || !filterConfig.type) return null;

        switch (filterConfig.type) {
            case 'simple':
                return ["==", ["get", filterConfig.property], filterConfig.value];

            case 'in':
                return ["in", ["get", filterConfig.property], ["literal", filterConfig.values]];

            case 'range':
                return ["all",
                    [">=", ["get", filterConfig.property], filterConfig.min],
                    ["<=", ["get", filterConfig.property], filterConfig.max]
                ];

            case 'zoom-based':
                const caseExpression = ["case"];
                filterConfig.zoomLevels.forEach(level => {
                    if (level.maxZoom !== undefined) {
                        caseExpression.push(["<", ["zoom"], level.maxZoom]);
                        // Handle null filters (no filter at this zoom level)
                        if (level.filter === null) {
                            caseExpression.push(true); // Show all features
                        } else {
                            const subFilter = createGenericFilter(level.filter);
                            caseExpression.push(subFilter || true);
                        }
                    }
                });
                
                // Handle the default (highest zoom) level
                const defaultLevel = filterConfig.zoomLevels[filterConfig.zoomLevels.length - 1];
                if (defaultLevel.filter === null) {
                    caseExpression.push(true); // Show all features at highest zoom
                } else {
                    const defaultFilter = createGenericFilter(defaultLevel.filter);
                    caseExpression.push(defaultFilter || true);
                }
                
                return caseExpression;

            case 'multiple':
                return ["all", ...filterConfig.conditions.map(condition => createGenericFilter(condition))];

            case 'any':
                return ["any", ...filterConfig.conditions.map(condition => createGenericFilter(condition))];

            default:
                return null;
        }
    };

    // Process layer with filter
    const processLayerWithFilter = async (layerData) => {
        const filterConfig = await loadLayerFilter(layerData.original_name || layerData.name);
        
        if (!filterConfig) {
            return layerData;
        }
        
        const filter = createGenericFilter(filterConfig);
        
        // If filter generation failed or is invalid, return layer without filter
        if (!filter || !Array.isArray(filter)) {
            return layerData;
        }
        
        return {
            ...layerData,
            mapbox_filter: { filter }
        };
    };

    const defaultMapCenterLon = -122.4;
    const defaultMapCenterLat = 37.8;
    const defaultMapZoom = 14;
    const defaultMapTheme = "mapbox://styles/mapbox/streets-v12";

    // Get initial position from localStorage or user settings
    const getInitialViewState = () => {
        const savedViewState = localStorage.getItem('mapViewState');
        if (savedViewState) {
            try {
                const parsed = JSON.parse(savedViewState);
                return {
                    longitude: parsed.longitude || user?.map_center_lon || defaultMapCenterLon,
                    latitude: parsed.latitude || user?.map_center_lat || defaultMapCenterLat,
                    zoom: parsed.zoom || user?.map_zoom || defaultMapZoom,
                    bearing: parsed.bearing || 0,
                    pitch: parsed.pitch || 0,
                };
            } catch (e) {
                console.warn('Failed to parse saved map state:', e);
            }
        }
        
        return {
            longitude: user?.map_center_lon || defaultMapCenterLon,
            latitude: user?.map_center_lat || defaultMapCenterLat,
            zoom: user?.map_zoom || defaultMapZoom,
            bearing: 0,
            pitch: 0,
        };
    };

    const [viewState, setViewState] = useState(getInitialViewState);
    const [mapStyle, setMapStyle] = useState(user?.map_theme || defaultMapTheme);
    const [isLoadingLayers, setIsLoadingLayers] = useState(Boolean(user && activeMapLayers?.length > 0)); // Start with loading if user has layers
    const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

    // Ensure loading indicator shows immediately on mount if there are layers to load
    useEffect(() => {
        if (user && activeMapLayers?.length > 0 && !hasInitiallyLoaded) {
            setIsLoadingLayers(true);
        }
    }, []); // Empty dependency array - runs only on mount

    useEffect(() => {
        if (user) {
            // Get saved position from localStorage or use user defaults
            const savedViewState = localStorage.getItem('mapViewState');
            let newViewState = {
                longitude: user.map_center_lon || defaultMapCenterLon,
                latitude: user.map_center_lat || defaultMapCenterLat,
                zoom: user.map_zoom || defaultMapZoom,
                bearing: 0,
                pitch: 0,
            };

            if (savedViewState) {
                try {
                    const parsed = JSON.parse(savedViewState);
                    newViewState = {
                        longitude: parsed.longitude || newViewState.longitude,
                        latitude: parsed.latitude || newViewState.latitude,
                        zoom: parsed.zoom || newViewState.zoom,
                        bearing: parsed.bearing || 0,
                        pitch: parsed.pitch || 0,
                    };
                } catch (e) {
                    console.warn('Failed to parse saved map state on login:', e);
                }
            }

            setViewState(newViewState);
            setMapStyle(user.map_theme || defaultMapTheme);
        }
    }, [user]);

    // Save map position to localStorage when it changes
    const handleViewStateChange = (evt) => {
        const newViewState = evt.viewState;
        setViewState(newViewState);
        
        // Save to localStorage for persistence across refreshes
        localStorage.setItem('mapViewState', JSON.stringify({
            longitude: newViewState.longitude,
            latitude: newViewState.latitude,
            zoom: newViewState.zoom,
            bearing: newViewState.bearing,
            pitch: newViewState.pitch
        }));

        // Get map bounds whenever the view changes (zoom, pan, drag)
        if (mapRef.current) {
            const map = mapRef.current.getMap();
            
            const bounds = map.getBounds();
            const sw = bounds.getSouthWest(); // lng, lat
            const ne = bounds.getNorthEast(); // lng, lat
            
            // Create bounding box [minX, minY, maxX, maxY]
            const bbox = [sw.lng, sw.lat, ne.lng, ne.lat];
            
            // console.log('🗺️ Map Bounds Changed:', {
            //     southWest: { lng: sw.lng, lat: sw.lat },
            //     northEast: { lng: ne.lng, lat: ne.lat },
            //     bbox: bbox,
            //     zoom: newViewState.zoom,
            //     center: { lng: newViewState.longitude, lat: newViewState.latitude }
            // });
        }
    };

    const handleZoomIn = () => {
        if (mapRef.current) {
            mapRef.current.zoomIn();
        }
    };

    const handleZoomOut = () => {
        if (mapRef.current) {
            mapRef.current.zoomOut();
        }
    };

    const handleResetNorth = () => {
        if (mapRef.current) {
            mapRef.current.rotateTo(0, { duration: 1000 });
        }
    };

    // Handle map load events
    const handleMapLoad = () => {
        // Map loaded
    };

    const handleMapError = (event) => {
        console.error('❌ Map loading error:', event);
    };

    // Handle style changes - re-add layers when basemap style changes
    const handleStyleLoad = () => {
        // When style changes, all custom layers are removed by Mapbox
        // We need to trigger layer re-processing to add them back
        if (activeMapLayers && activeMapLayers.length > 0) {
            setIsLoadingLayers(true);
        }
        
        // Clear the layer tracking so they can be re-added
        // This will be handled by the LayerProcessor reset
        
        // Small delay to ensure style is fully loaded before hiding loading
        setTimeout(() => {
            if (activeMapLayers && activeMapLayers.length > 0) {
                setIsLoadingLayers(false);
            }
        }, 200); // Reduced from 1000ms to 200ms
    };

    // Handle when layers are processed
    const handleLayersProcessed = () => {
        setIsLoadingLayers(false);
        setHasInitiallyLoaded(true);
    };

    // Show loading animation for layer operations
    useEffect(() => {
        if (user && activeMapLayers?.length > 0 && !hasInitiallyLoaded) {
            setIsLoadingLayers(true);
        } else if (user && (!activeMapLayers || activeMapLayers.length === 0) && !hasInitiallyLoaded) {
            // No layers - mark as loaded immediately and hide loading
            setHasInitiallyLoaded(true);
            setIsLoadingLayers(false);
        }
    }, [user?.id, activeMapLayers?.length, hasInitiallyLoaded]);

    // Show loading immediately when user logs in (only if there are layers to load)
    useEffect(() => {
        if (user && !hasInitiallyLoaded && activeMapLayers?.length > 0) {
            setIsLoadingLayers(true);
        } else if (user && !hasInitiallyLoaded && (!activeMapLayers || activeMapLayers.length === 0)) {
            // No layers to load, mark as initialized immediately
            setHasInitiallyLoaded(true);
            setIsLoadingLayers(false);
        }
    }, [user, hasInitiallyLoaded, activeMapLayers?.length]);

        // Detect layer changes for loading indicator
    useEffect(() => {
        if (hasInitiallyLoaded && user) {
            const currentLayerCount = activeMapLayers?.length || 0;
            
            if (previousLayerCountRef.current !== currentLayerCount) {
                if (currentLayerCount > previousLayerCountRef.current) {
                    // Layer added
                    setIsLoadingLayers(true);
                    // Note: handleLayersProcessed will turn off loading when processing is complete
                } else if (currentLayerCount < previousLayerCountRef.current) {
                    // Layer removed - show loading briefly then turn off
                    setIsLoadingLayers(true);
                    
                    // If no layers left, turn off loading quickly
                    if (currentLayerCount === 0) {
                        setTimeout(() => {
                            setIsLoadingLayers(false);
                        }, 100); // Reduced from 500ms to 100ms
                    }
                    // Note: handleLayersProcessed will turn off loading when processing is complete for other cases
                }
                previousLayerCountRef.current = currentLayerCount;
            }
        }
    }, [activeMapLayers?.length, hasInitiallyLoaded, user]);

    // Reset initial loading state when user changes (logs out/in)
    useEffect(() => {
        if (!user) {
            setHasInitiallyLoaded(false);
            setIsLoadingLayers(false);
            previousLayerCountRef.current = 0;
        } else {
            // Initialize the ref when user logs in
            previousLayerCountRef.current = activeMapLayers?.length || 0;
        }
    }, [user, activeMapLayers?.length]);

    return (
        <>
            {/* Map Layer Logger Component - logs all layer database operations */}
            <MapLayerLogger activeMapLayers={activeMapLayers} user={user} />
            
            {/* Map Source and Layer Processing - handles actual map layer rendering */}
            <MapSourceAndLayer 
                mapRef={mapRef} 
                activeMapLayers={activeMapLayers} 
                onLayersProcessed={handleLayersProcessed}
                mapStyle={mapStyle}
                processLayerWithFilter={processLayerWithFilter}
            />
            
            <div className="map-background-container relative">
                {/* Layer loading indicator */}
                <LayerLoadingIndicator 
                    isVisible={isLoadingLayers} 
                />
                
                <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={handleViewStateChange}
                    onLoad={handleMapLoad}
                    onError={handleMapError}
                    onStyleLoad={handleStyleLoad}
                    mapStyle={mapStyle}
                    mapboxAccessToken={MapboxAccessToken}
                    attributionControl={false}
                    hash={true}
                    dragPan={true}
                    dragRotate={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Layer management removed - keeping only map position persistence */}

            {isMapDashboardActive && (
                <div className="custom-map-controls fixed bottom-8 right-10 z-20">
                    <button className="map-btn" onClick={handleZoomIn} title="Zoom In">
                        <FiPlus size={22} />
                    </button>
                    <button className="map-btn" onClick={handleZoomOut} title="Zoom Out">
                        <FiMinus size={22} />
                    </button>
                    <button className="map-btn" onClick={handleResetNorth} title="Reset North">
                        <TiLocationArrowOutline size={22} />
                    </button>
                </div>
            )}
        </>
    );
};

export default MapAndControls;