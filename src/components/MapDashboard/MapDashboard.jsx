import React, { useEffect } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { TiLocationArrowOutline } from 'react-icons/ti';
import './MapDashboard.css';
import 'mapbox-gl/dist/mapbox-gl.css';
// No longer needs to import useAuth or Map, as they are managed in App.jsx

const MapDashboard = ({ mapRef, viewState, setViewState }) => { // Receive mapRef and viewState/setViewState
    // No longer needs to fetch user data directly for map settings

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

    // No useEffect for initial map setup here, as Map is in App.jsx
    // The viewState update is handled by onMove in App.jsx

    return (
        <div className='map-container'>
            {/* The Map component is now rendered in App.jsx, this div acts as an overlay for controls */}
            <div className="custom-map-controls">
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
        </div>
    );
};

export default MapDashboard;