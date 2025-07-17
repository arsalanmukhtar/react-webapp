import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // Redirect to the homepage (/) if not authenticated
    // The homepage is a public route, so this will work correctly.
    return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;