import React, { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { TiLocationArrowOutline } from 'react-icons/ti';
import { useAuth } from '../../contexts/AuthContext';
import MapLayerLogger from './MapLayerLogger';
import MapSourceAndLayer from './MapSourceAndLayer';
import MapLoadingOverlay from './MapLoadingOverlay';

const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (!MapboxAccessToken) {
    console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

const MapAndControls = ({ user, isMapDashboardActive, activeMapLayers }) => {
    const { token } = useAuth(); // Get authentication token
    const mapRef = useRef(null);

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
    const [isLoadingLayers, setIsLoadingLayers] = useState(false);
    const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

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
            
            console.log('🗺️ Map Bounds Changed:', {
                southWest: { lng: sw.lng, lat: sw.lat },
                northEast: { lng: ne.lng, lat: ne.lat },
                bbox: bbox,
                zoom: newViewState.zoom,
                center: { lng: newViewState.longitude, lat: newViewState.latitude }
            });
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

    // Handle when layers are processed
    const handleLayersProcessed = () => {
        setIsLoadingLayers(false);
        setHasInitiallyLoaded(true);
    };

    // Show loading animation only on initial login with layers, not on subsequent layer changes
    useEffect(() => {
        if (user && activeMapLayers?.length > 0 && !hasInitiallyLoaded) {
            setIsLoadingLayers(true);
            
            const timer = setTimeout(() => {
                setIsLoadingLayers(false);
                setHasInitiallyLoaded(true);
            }, 7000); // Increased to 7 seconds to give more time for map style loading
            
            return () => clearTimeout(timer);
        } else {
            setIsLoadingLayers(false);
        }
    }, [user?.id, activeMapLayers?.length, hasInitiallyLoaded]);

    // Reset initial loading state when user changes (logs out/in)
    useEffect(() => {
        if (!user) {
            setHasInitiallyLoaded(false);
        }
    }, [user]);

    return (
        <>
            {/* Map Layer Logger Component - logs all layer database operations */}
            <MapLayerLogger activeMapLayers={activeMapLayers} user={user} />
            
            {/* Map Source and Layer Processing - handles actual map layer rendering */}
            <MapSourceAndLayer 
                mapRef={mapRef} 
                activeMapLayers={activeMapLayers} 
                onLayersProcessed={handleLayersProcessed}
                shouldProcessLayers={!isLoadingLayers}
            />
            
            <div className="map-background-container relative">
                {/* Loading overlay */}
                <MapLoadingOverlay isVisible={isLoadingLayers} />
                
                <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={handleViewStateChange}
                    onLoad={handleMapLoad}
                    onError={handleMapError}
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