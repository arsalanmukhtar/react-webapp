import React, { useState, useEffect } from 'react';
import MapPreviewSection from './MapPreviewSection';
import CoordinateInputs from './CoordinateInputs';
import ThemeSelector from './ThemeSelector';
import NotificationDisplay from './NotificationDisplay';
import SaveButton from './SaveButton';
import { MapboxStyles, validateCoordinates, detectChanges } from './MapSettingsUtils';

const MapSettingsForm = ({ user, token, updateMapSettings, setNotification }) => {
    const [mapCenterLat, setMapCenterLat] = useState(user?.map_center_lat || 0.0);
    const [mapCenterLon, setMapCenterLon] = useState(user?.map_center_lon || 0.0);
    const [mapZoom, setMapZoom] = useState(user?.map_zoom || 2.0);
    const [mapTheme, setMapTheme] = useState(user?.map_theme || MapboxStyles[0].url);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Local notification state
    const [localNotification, setLocalNotification] = useState({ 
        message: '', 
        type: '', 
        visible: false 
    });

    // Update form fields if user data from context changes
    useEffect(() => {
        if (user) {
            setMapCenterLat(user.map_center_lat || 0.0);
            setMapCenterLon(user.map_center_lon || 0.0);
            setMapZoom(user.map_zoom || 2.0);
            setMapTheme(user.map_theme || MapboxStyles[0].url);
        }
    }, [user]);

    // Effect to auto-hide local notification after 3 seconds
    useEffect(() => {
        let timer;
        if (localNotification.visible) {
            timer = setTimeout(() => {
                setLocalNotification(prev => ({ ...prev, visible: false, message: '' }));
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [localNotification.visible]);

    const handleMapChange = (newCenter, newZoom) => {
        setMapCenterLat(newCenter.lat);
        setMapCenterLon(newCenter.lng);
        setMapZoom(newZoom);
    };

    const handleSubmitMapSettings = async (e) => {
        e.preventDefault();
        setLocalNotification({ message: '', type: '', visible: false });

        // Validate coordinates
        const validation = validateCoordinates(mapCenterLat, mapCenterLon, mapZoom);
        if (!validation.isValid) {
            setLocalNotification({ 
                message: validation.message, 
                type: 'error', 
                visible: true 
            });
            return;
        }

        // Detect changes
        const updates = detectChanges(
            { lat: mapCenterLat, lon: mapCenterLon, zoom: mapZoom, theme: mapTheme },
            user
        );

        if (Object.keys(updates).length === 0) {
            setLocalNotification({ 
                message: 'No changes to save.', 
                type: 'info', 
                visible: true 
            });
            return;
        }

        try {
            const res = await fetch('/api/data/users/me/settings/map', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const data = await res.json();
                updateMapSettings(data);
                setLocalNotification({ 
                    message: 'Map settings updated successfully!', 
                    type: 'success', 
                    visible: true 
                });
            } else {
                const errorData = await res.json();
                setLocalNotification({ 
                    message: errorData.detail || 'Failed to update map settings.', 
                    type: 'error', 
                    visible: true 
                });
            }
        } catch (err) {
            console.error('Network or unexpected error:', err);
            setLocalNotification({ 
                message: 'An unexpected error occurred. Please try again.', 
                type: 'error', 
                visible: true 
            });
        }
    };

    return (
        <form onSubmit={handleSubmitMapSettings} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-6 pb-4">
                <MapPreviewSection
                    mapCenterLat={mapCenterLat}
                    mapCenterLon={mapCenterLon}
                    mapZoom={mapZoom}
                    onMapChange={handleMapChange}
                />

                <CoordinateInputs
                    mapCenterLat={mapCenterLat}
                    mapCenterLon={mapCenterLon}
                    mapZoom={mapZoom}
                    onLatChange={setMapCenterLat}
                    onLonChange={setMapCenterLon}
                    onZoomChange={setMapZoom}
                />

                <ThemeSelector
                    mapTheme={mapTheme}
                    isDropdownOpen={isDropdownOpen}
                    onToggleDropdown={setIsDropdownOpen}
                    onThemeSelect={setMapTheme}
                />
            </div>

            <NotificationDisplay notification={localNotification} />
            <SaveButton onSubmit={handleSubmitMapSettings} />
        </form>
    );
};

export default MapSettingsForm;
