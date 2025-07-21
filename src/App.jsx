import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import './App.css';
import MapDashboard from './components/MapDashboard/MapDashboard.jsx';
import Navbar from './components/Navbar/Navbar.jsx';

import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

import Homepage from './components/Homepage/Homepage.jsx';
import UserPanelSettings from './components/UserPanelSettings/UserPanelSettings.jsx';
import LeftSidebar from './components/LeftSidebar/LeftSidebar.jsx';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './contexts/PrivateRoute';

import { FiPlus, FiMinus } from 'react-icons/fi';
import { TiLocationArrowOutline } from 'react-icons/ti';


const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (!MapboxAccessToken) {
    console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

const AppContent = () => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const mapRef = useRef(null);

    const [activeSidebarLayer, setActiveSidebarLayer] = useState(null);

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

    const shouldRenderMap = isAuthenticated;

    const isMapDashboardActive = location.pathname === '/map-dashboard';

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
            <Navbar />

            {shouldRenderMap && (
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
            )}

            {isAuthenticated && isMapDashboardActive && (
                <LeftSidebar
                    activeLayer={activeSidebarLayer}
                    setActiveLayer={setActiveSidebarLayer}
                />
            )}

            {isAuthenticated && isMapDashboardActive && (
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

            <div className={`absolute inset-x-0 top-[50px] bottom-0 z-[1] overflow-hidden
                           ${isMapDashboardActive ? 'bg-transparent' : 'bg-white'}`}
                 style={{ pointerEvents: isMapDashboardActive ? 'none' : 'auto' }}>
                <Routes>
                    <Route path="/" element={<Homepage />} />

                    <Route
                        path="/map-dashboard"
                        element={
                            <PrivateRoute>
                                <MapDashboard mapRef={mapRef} viewState={viewState} setViewState={setViewState} />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/user-panel"
                        element={
                            <PrivateRoute>
                                <UserPanelSettings />
                            </PrivateRoute>
                        }
                    />

                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                </Routes>
            </div>
        </>
    );
};

const App = () => (
    <BrowserRouter>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </BrowserRouter>
);

export default App;
