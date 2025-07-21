import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
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
import MapAndControls from './components/MapAndControls/MapAndControls.jsx'; // Import the new component

import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './contexts/PrivateRoute';


const AppContent = () => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    const [activeSidebarLayer, setActiveSidebarLayer] = useState(null);

    const isMapDashboardActive = location.pathname === '/map-dashboard';

    return (
        <>
            <Navbar />

            {/* Render MapAndControls only if authenticated */}
            {isAuthenticated && (
                <MapAndControls
                    user={user}
                    isMapDashboardActive={isMapDashboardActive}
                />
            )}

            {/* Left Sidebar - only rendered if authenticated AND on map dashboard */}
            {isAuthenticated && isMapDashboardActive && (
                <LeftSidebar
                    activeLayer={activeSidebarLayer}
                    setActiveLayer={setActiveSidebarLayer}
                />
            )}

            {/* Main Content Area (Routes): Absolute, overlays map. */}
            <div className={`absolute inset-x-0 top-[50px] bottom-0 z-[1] overflow-hidden
                           ${isMapDashboardActive ? 'bg-transparent' : 'bg-white'}`}
                 style={{ pointerEvents: isMapDashboardActive ? 'none' : 'auto' }}>
                <Routes>
                    <Route path="/" element={<Homepage />} />

                    <Route
                        path="/map-dashboard"
                        element={
                            <PrivateRoute>
                                <MapDashboard /> {/* MapDashboard no longer needs mapRef, viewState, setViewState */}
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