import { BrowserRouter, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
import AppRoutes from './components/App/AppRoutes.jsx';
import MapInterface from './components/App/MapInterface.jsx';
import useUserLayers from './components/App/useUserLayers.js';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent = () => {
    const { isAuthenticated, user, token } = useAuth();
    const location = useLocation();
    const [activeSidebarLayer, setActiveSidebarLayer] = useState(null);
    
    const { activeMapLayers, setActiveMapLayers } = useUserLayers(user, token);
    const isMapDashboardActive = location.pathname === '/map-dashboard';

    return (
        <>
            <Navbar />

            <MapInterface
                isAuthenticated={isAuthenticated}
                user={user}
                isMapDashboardActive={isMapDashboardActive}
                activeMapLayers={activeMapLayers}
                setActiveMapLayers={setActiveMapLayers}
                activeSidebarLayer={activeSidebarLayer}
                setActiveSidebarLayer={setActiveSidebarLayer}
            />

            <AppRoutes isMapDashboardActive={isMapDashboardActive} />
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
