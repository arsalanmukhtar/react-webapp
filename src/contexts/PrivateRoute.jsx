import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // Redirect to the login page (/login) if not authenticated
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;