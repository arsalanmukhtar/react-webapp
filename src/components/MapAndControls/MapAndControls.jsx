import React, { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { TiLocationArrowOutline } from 'react-icons/ti';

const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (!MapboxAccessToken) {
    console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

const MapAndControls = ({ user, isMapDashboardActive }) => {
    const mapRef = useRef(null);

    const defaultMapCenterLon = -122.4;
    const defaultMapCenterLat = 37.8;
    const defaultMapZoom = 14;
    const defaultMapTheme = "mapbox://styles/mapbox/streets-v12";

    const [viewState, setViewState] = useState({
        longitude: user?.map_center_lon || defaultMapCenterLon,
        latitude: user?.map_center_lat || defaultMapCenterLat,
        zoom: user?.map_zoom || defaultMapZoom,
        bearing: 0,
        pitch: 0,
    });
    const [mapStyle, setMapStyle] = useState(user?.map_theme || defaultMapTheme);

    useEffect(() => {
        if (user) {
            setViewState(prev => ({
                ...prev,
                longitude: user.map_center_lon || defaultMapCenterLon,
                latitude: user.map_center_lat || defaultMapCenterLat,
                zoom: user.map_zoom || defaultMapZoom,
            }));
            setMapStyle(user.map_theme || defaultMapTheme);
        }
    }, [user]);

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

    return (
        <>
            <div className="map-background-container">
                <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapStyle={mapStyle}
                    mapboxAccessToken={MapboxAccessToken}
                    attributionControl={false}
                    hash={true}
                    dragPan={true}
                    dragRotate={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

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
