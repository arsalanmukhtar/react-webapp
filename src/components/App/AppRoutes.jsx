import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Homepage from '../Homepage/Homepage.jsx';
import MapDashboard from '../MapDashboard/MapDashboard.jsx';
import UserPanelSettings from '../UserPanelSettings/UserPanelSettings.jsx';
import Login from '../Auth/Login';
import Signup from '../Auth/Signup';
import ForgotPassword from '../Auth/ForgotPassword';
import ResetPassword from '../Auth/ResetPassword';
import PrivateRoute from '../../contexts/PrivateRoute';

/**
 * AppRoutes - Handles all application routing
 */
const AppRoutes = ({ isMapDashboardActive }) => {
  return (
    <div className={`absolute inset-x-0 top-[50px] bottom-0 z-[1] overflow-hidden
                     ${isMapDashboardActive ? 'bg-transparent' : 'bg-white'}`}
         style={{ pointerEvents: isMapDashboardActive ? 'none' : 'auto' }}>
      <Routes>
        <Route path="/" element={<Homepage />} />

        <Route
          path="/map-dashboard"
          element={
            <PrivateRoute>
              <MapDashboard />
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
  );
};

export default AppRoutes;
