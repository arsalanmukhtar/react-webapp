import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the AuthContext
export const AuthContext = createContext(null);

// AuthProvider component to wrap your application
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(sessionStorage.getItem('accessToken'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!token);
    const [user, setUser] = useState(null); // State for user data
    const [loading, setLoading] = useState(true); // New loading state

    // Effect to update isAuthenticated and persist token in sessionStorage
    useEffect(() => {
        setIsAuthenticated(!!token);
        if (token) {
            sessionStorage.setItem('accessToken', token);
            // If token exists, always attempt to fetch user data to ensure it's fresh
            fetchUserData(token);
        } else {
            sessionStorage.removeItem('accessToken');
            setUser(null); // Clear user data on logout
            setLoading(false); // No token, so not loading user data
        }
    }, [token]);

    // Fetch user data on initial load if token exists
    useEffect(() => {
        if (token && !user) { // Only fetch if token exists and user data is not yet loaded
            fetchUserData(token);
        } else if (!token) {
            setLoading(false); // If no token, no user data to load
        }
    }, []); // Run once on mount

    // Function to fetch user data
    const fetchUserData = async (currentToken) => {
        setLoading(true); // Set loading to true when fetching
        try {
            const res = await fetch('/api/data/users/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                console.error('Failed to fetch user data in AuthContext:', await res.json());
                setToken(null); // Invalidate token if user data fetch fails
            }
        } catch (error) {
            console.error('Network error fetching user data in AuthContext:', error);
            setToken(null); // Invalidate token on network error
        } finally {
            setLoading(false); // Set loading to false after fetch attempt
        }
    };

    // Function to handle user login
    const login = (newToken) => {
        setToken(newToken);
        // User data will be fetched by the useEffect after token is set
    };

    // Function to handle user logout
    const logout = () => {
        setToken(null);
        setUser(null); // Clear user data on logout
    };

    // Functions to update specific parts of user data from settings
    const updateUserProfile = (updatedUserData) => {
        setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
    };

    const updateMapSettings = (updatedMapData) => {
        setUser(prevUser => ({ ...prevUser, ...updatedMapData }));
    };

    // If still loading, you might want to render a loading spinner or null
    if (loading) {
        return <div>Loading authentication...</div>; // Or a more sophisticated loading component
    }

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, user, login, logout, updateUserProfile, updateMapSettings }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};