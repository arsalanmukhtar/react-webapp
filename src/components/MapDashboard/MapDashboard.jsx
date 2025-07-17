import React, { useEffect, useRef } from 'react';
import Map from 'react-map-gl'; // Keep react-map-gl
import { FiPlus, FiMinus } from 'react-icons/fi';
import { TiLocationArrowOutline  } from 'react-icons/ti';
import './MapDashboard.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAuth } from '../../contexts/AuthContext'; // Corrected import path

const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Add token verification
if (!MapboxAccessToken) {
    console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

const MapDashboard = () => {
    const mapRef = useRef(); // Still useful for imperative methods like zoomIn/Out/rotateTo
    const { user } = useAuth(); // Get user data from AuthContext

    // Default values if user settings are not available
    // These will be used if user is null, or if specific map properties are null/undefined
    const defaultMapCenterLon = -122.4;
    const defaultMapCenterLat = 37.8;
    const defaultMapZoom = 14;
    const defaultMapTheme = "mapbox://styles/mapbox/streets-v12";

    // Dynamically get map settings from user, or use defaults
    const currentLongitude = user?.map_center_lon || defaultMapCenterLon;
    const currentLatitude = user?.map_center_lat || defaultMapCenterLat;
    const currentZoom = user?.map_zoom || defaultMapZoom;
    const currentMapStyle = user?.map_theme || defaultMapTheme;

    // Handlers for custom controls (these still use mapRef for imperative actions)
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
            mapRef.current.rotateTo(0, { duration: 500 });
        }
    };

    // The useEffect for fetching user token is no longer needed here
    // as AuthContext handles token fetching and user data population.
    // This component now simply consumes the 'user' data from AuthContext.
    useEffect(() => {
        // This useEffect is now only for initial setup or any side effects
        // that depend on the component mounting, not for map updates
        // which are handled by props of the <Map> component.
        // The previous fetchUser logic is now handled by AuthContext.
    }, []);


    return (
        <div className='map-container'>
            <Map
                ref={mapRef}
                // Dynamically set initialViewState and mapStyle based on user data
                initialViewState={{
                    longitude: currentLongitude,
                    latitude: currentLatitude,
                    zoom: currentZoom
                }}
                mapStyle={currentMapStyle}
                mapboxAccessToken={MapboxAccessToken}
                attributionControl={false}
                hash={true}
            >
                <div className="custom-map-controls">
                    <button className="map-btn" onClick={handleZoomIn} title="Zoom In">
                        <FiPlus size={22} />
                    </button>
                    <button className="map-btn" onClick={handleZoomOut} title="Zoom Out">
                        <FiMinus size={22} />
                    </button>
                    <button className="map-btn" onClick={handleResetNorth} title="Reset North">
                        <TiLocationArrowOutline  size={22} />
                    </button>
                </div>
            </Map>
        </div>
    );
};

export default MapDashboard;