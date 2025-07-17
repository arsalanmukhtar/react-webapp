import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl'; // Import Map from react-map-gl
import './App.css';
import MapDashboard from './components/MapDashboard/MapDashboard.jsx';
import Navbar from './components/Navbar/Navbar.jsx';

import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

import Homepage from './components/Homepage/Homepage.jsx';
import UserPanelSettings from './components/UserPanelSettings/UserPanelSettings.jsx';

import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import useAuth
import PrivateRoute from './contexts/PrivateRoute'; // Ensure PrivateRoute is imported

const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Add token verification
if (!MapboxAccessToken) {
  console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const mapRef = useRef(null); // Ref to hold the MapboxGL map instance

  // Default map settings (can be overridden by user data)
  const defaultMapCenterLon = -122.4;
  const defaultMapCenterLat = 37.8;
  const defaultMapZoom = 14;
  const defaultMapTheme = "mapbox://styles/mapbox/streets-v12";

  // Initialize viewState with user's saved settings or defaults
  const [viewState, setViewState] = useState({
    longitude: user?.map_center_lon || defaultMapCenterLon,
    latitude: user?.map_center_lat || defaultMapCenterLat,
    zoom: user?.map_zoom || defaultMapZoom,
    bearing: 0, // Keep bearing and pitch consistent unless user settings include them
    pitch: 0,
  });
  const [mapStyle, setMapStyle] = useState(user?.map_theme || defaultMapTheme);

  // Update viewState and mapStyle when user data changes (e.g., after login or settings update)
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

  // Determine if the map should be visible or hidden (covered by other components)
  // The map is visible only on the map-dashboard route. For other routes, it's hidden.
  const isMapDashboardActive = location.pathname === '/map-dashboard';
  const isMapVisible = isAuthenticated; // Map should only be rendered if authenticated

  return (
    <>
      <Navbar />
      {isMapVisible && (
        // The map-background-container will fill the screen below the navbar.
        // It will be hidden if not on the map dashboard to allow other components to take full screen.
        <div className={`map-background-container ${isMapDashboardActive ? '' : 'hidden'}`}>
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle={mapStyle}
            mapboxAccessToken={MapboxAccessToken}
            attributionControl={false}
            hash={true}
            style={{ width: '100%', height: '100%' }} // <-- This is required!
          />
        </div>
      )}

      <Routes>
        {/* Public Homepage Route - set as default */}
        <Route path="/" element={<Homepage />} />

        {/* Protected Routes */}
        <Route
          path="/map-dashboard"
          element={
            <PrivateRoute>
              {/* MapDashboard now receives mapRef and setViewState */}
              <MapDashboard mapRef={mapRef} viewState={viewState} setViewState={setViewState} />
            </PrivateRoute>
          }
        />
        <Route
          path="/user-panel"
          element={
            <PrivateRoute>
              {/* UserPanelSettings will now render on top of the hidden map */}
              <UserPanelSettings />
            </PrivateRoute>
          }
        />

        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
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