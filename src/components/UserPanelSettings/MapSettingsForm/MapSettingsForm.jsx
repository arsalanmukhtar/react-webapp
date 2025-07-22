import React, { useState, useEffect, useRef } from 'react';
import { FiSave, FiChevronDown } from 'react-icons/fi';
import InsetMap from '../InsetMap/InsetMap';

// Define Maplibre-compatible styles for dropdown
const MapboxStyles = [
    { name: "Mapbox Streets", url: "mapbox://styles/mapbox/streets-v11" },
    { name: "Mapbox Outdoors", url: "mapbox://styles/mapbox/outdoors-v11" },
    { name: "Mapbox Light", url: "mapbox://styles/mapbox/light-v10" },
    { name: "Mapbox Dark", url: "mapbox://styles/mapbox/dark-v10" },
    { name: "Mapbox Satellite", url: "mapbox://styles/mapbox/satellite-v9" },
    { name: "Mapbox Satellite Streets", url: "mapbox://styles/mapbox/satellite-streets-v11" },
];

const MapSettingsForm = ({ user, token, updateMapSettings, setNotification }) => {
    const [mapCenterLat, setMapCenterLat] = useState(user?.map_center_lat || 0.0);
    const [mapCenterLon, setMapCenterLon] = useState(user?.map_center_lon || 0.0);
    const [mapZoom, setMapZoom] = useState(user?.map_zoom || 2.0);
    const [mapTheme, setMapTheme] = useState(user?.map_theme || MapboxStyles[0].url); // Use updated styles
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Local notification state
    const [localNotification, setLocalNotification] = useState({ message: '', type: '', visible: false });

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMapChange = (newCenter, newZoom) => {
        setMapCenterLat(newCenter.lat);
        setMapCenterLon(newCenter.lng);
        setMapZoom(newZoom);
    };

    const handleThemeSelect = (url) => {
        setMapTheme(url);
        setIsDropdownOpen(false);
    };

    const handleSubmitMapSettings = async (e) => {
        e.preventDefault();
        setLocalNotification({ message: '', type: '', visible: false }); // Clear previous local notification

        if (isNaN(mapCenterLat) || mapCenterLat < -90 || mapCenterLat > 90) {
            setLocalNotification({ message: 'Latitude must be a number between -90 and 90.', type: 'error', visible: true });
            return;
        }
        if (isNaN(mapCenterLon) || mapCenterLon < -180 || mapCenterLon > 180) {
            setLocalNotification({ message: 'Longitude must be a number between -180 and 180.', type: 'error', visible: true });
            return;
        }
        if (isNaN(mapZoom) || mapZoom < 0 || mapZoom > 22) {
            setLocalNotification({ message: 'Zoom must be a number between 0 and 22.', type: 'error', visible: true });
            return;
        }

        const updates = {};
        if (mapCenterLat !== user?.map_center_lat) {
            updates.map_center_lat = mapCenterLat;
        }
        if (mapCenterLon !== user?.map_center_lon) {
            updates.map_center_lon = mapCenterLon;
        }
        if (mapZoom !== user?.map_zoom) {
            updates.map_zoom = mapZoom;
        }
        if (mapTheme !== user?.map_theme) {
            updates.map_theme = mapTheme;
        }

        if (Object.keys(updates).length === 0) {
            setLocalNotification({ message: 'No changes to save.', type: 'info', visible: true });
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
                setLocalNotification({ message: 'Map settings updated successfully!', type: 'success', visible: true });
            } else {
                const errorData = await res.json();
                setLocalNotification({ message: errorData.detail || 'Failed to update map settings.', type: 'error', visible: true });
            }
        } catch (err) {
            console.error('Network or unexpected error:', err);
            setLocalNotification({ message: 'An unexpected error occurred. Please try again.', type: 'error', visible: true });
        }
    };

    const selectedThemeName = MapboxStyles.find(style => style.url === mapTheme)?.name || 'Select a theme';

    return (
        <form onSubmit={handleSubmitMapSettings} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-6 pb-4">
                {/* Inset Map Component */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Map Preview</label>
                    <InsetMap
                        initialCenter={[mapCenterLon, mapCenterLat]}
                        initialZoom={mapZoom}
                        onMapChange={({ latitude, longitude, zoom }) => handleMapChange({ lat: latitude, lng: longitude }, zoom)}
                    />
                </div>

                {/* Map Center Lat, Lon, and Zoom in one row */}
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                    {/* Map Center Lat Label */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Map Center Latitude</label>
                        <input
                            type="number"
                            id="mapCenterLat"
                            step="any"
                            className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
                            value={mapCenterLat}
                            onChange={(e) => setMapCenterLat(parseFloat(e.target.value))}
                        />
                    </div>

                    {/* Map Center Lon Label */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Map Center Longitude</label>
                        <input
                            type="number"
                            id="mapCenterLon"
                            step="any"
                            className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
                            value={mapCenterLon}
                            onChange={(e) => setMapCenterLon(parseFloat(e.target.value))}
                        />
                    </div>

                    {/* Map Zoom Label */}
                    <div className="flex-1">
                        <label htmlFor="mapZoom" className="block text-sm font-medium text-gray-700 mb-1">Map Zoom Level</label>
                        <input
                            type="number"
                            id="mapZoom"
                            step="0.1"
                            className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
                            value={mapZoom}
                            onChange={(e) => setMapZoom(parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                {/* Custom Map Theme Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <label htmlFor="mapTheme" className="block text-sm font-medium text-gray-700">Map Theme</label>
                    <button
                        type="button"
                        id="mapTheme"
                        className="w-full flex items-center justify-between px-3 py-2 border border-zinc-300 rounded-md shadow-sm
                                   bg-white text-gray-700 text-sm font-normal cursor-pointer
                                   focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-800 transition-colors duration-200"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        {selectedThemeName}
                        <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <ul className="py-1 px-1 space-y-1">
                                {MapboxStyles.map((style) => (
                                    <li key={style.url}>
                                        <button
                                            type="button"
                                            onClick={() => handleThemeSelect(style.url)}
                                            className="block w-full text-left px-2 py-2 text-sm font-normal text-gray-700 hover:bg-green-50 hover:text-green-500 transition-colors duration-200 rounded-md"
                                        >
                                            {style.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            {/* Local Notification Display */}
            {localNotification.visible && (
                <div className={`text-center text-xs mt-2
                                ${localNotification.type === 'success' ? 'text-green-600' :
                                  localNotification.type === 'error' ? 'text-red-600' :
                                  'text-blue-600'}`}>
                    {localNotification.message}
                </div>
            )}
            <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 px-4 rounded-md border border-green-400 mt-4
                    hover:bg-green-400 hover:border-green-800 focus:outline-none focus:border-green-500
                    active:border-green-800 hover:cursor-pointer flex items-center justify-center"
            >
                <FiSave className="mr-2" /> Save Map Settings
            </button>
        </form>
    );
};

export default MapSettingsForm;
