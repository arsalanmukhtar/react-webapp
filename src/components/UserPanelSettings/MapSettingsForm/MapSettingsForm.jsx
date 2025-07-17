import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import InsetMap from '../InsetMap/InsetMap'; // Updated path relative to MapSettingsForm

// Define Mapbox styles for dropdown
const MapboxStyles = [
    { name: "Streets", url: "mapbox://styles/mapbox/streets-v11" },
    { name: "Outdoors", url: "mapbox://styles/mapbox/outdoors-v11" },
    { name: "Light", url: "mapbox://styles/mapbox/light-v10" },
    { name: "Dark", url: "mapbox://styles/mapbox/dark-v10" },
    { name: "Satellite", url: "mapbox://styles/mapbox/satellite-v9" },
    { name: "Satellite Streets", url: "mapbox://styles/mapbox/satellite-streets-v11" },
];

const MapSettingsForm = ({ user, token, updateMapSettings, setNotification }) => {
    const [mapCenterLat, setMapCenterLat] = useState(user?.map_center_lat || 0.0);
    const [mapCenterLon, setMapCenterLon] = useState(user?.map_center_lon || 0.0);
    const [mapZoom, setMapZoom] = useState(user?.map_zoom || 2.0);
    const [mapTheme, setMapTheme] = useState(user?.map_theme || MapboxStyles[0].url);

    // Update states when user data from context changes
    useEffect(() => {
        if (user) {
            setMapCenterLat(user.map_center_lat || 0.0);
            setMapCenterLon(user.map_center_lon || 0.0);
            setMapZoom(user.map_zoom || 2.0);
            setMapTheme(user.map_theme || MapboxStyles[0].url);
        }
    }, [user]);

    // Callback function to receive map changes from InsetMap
    const handleMapChange = (newCenter, newZoom) => {
        setMapCenterLat(newCenter.lat);
        setMapCenterLon(newCenter.lng);
        setMapZoom(newZoom);
    };

    const handleSubmitMapSettings = async (e) => {
        e.preventDefault();
        setNotification({ message: '', type: '', visible: false }); // Clear previous notification

        // Basic validation for lat/lon
        if (isNaN(mapCenterLat) || mapCenterLat < -90 || mapCenterLat > 90) {
            setNotification({ message: 'Latitude must be a number between -90 and 90.', type: 'error', visible: true });
            return;
        }
        if (isNaN(mapCenterLon) || mapCenterLon < -180 || mapCenterLon > 180) {
            setNotification({ message: 'Longitude must be a number between -180 and 180.', type: 'error', visible: true });
            return;
        }
        if (isNaN(mapZoom) || mapZoom < 0 || mapZoom > 22) {
            setNotification({ message: 'Zoom must be a number between 0 and 22.', type: 'error', visible: true });
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
            setNotification({ message: 'No changes to save.', type: 'info', visible: true });
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
                setNotification({ message: 'Map settings updated successfully!', type: 'success', visible: true });
            } else {
                const errorData = await res.json();
                setNotification({ message: errorData.detail || 'Failed to update map settings.', type: 'error', visible: true });
            }
        } catch (err) {
            console.error('Network or unexpected error:', err);
            setNotification({ message: 'An unexpected error occurred. Please try again.', type: 'error', visible: true });
        }
    };

    return (
        <form onSubmit={handleSubmitMapSettings} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-6 pb-4"> {/* Content area with scroll */}
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

                {/* Map Theme Dropdown */}
                <div>
                    <label htmlFor="mapTheme" className="block text-sm font-medium text-gray-700">Map Theme</label>
                    <select
                        id="mapTheme"
                        className="w-full px-4 py-2 border border-zinc-300 rounded-md map-theme-select
                      focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-800 hover:cursor-pointer"
                        value={mapTheme}
                        onChange={(e) => setMapTheme(e.target.value)}
                    >
                        {MapboxStyles.map((style) => (
                            <option key={style.url} value={style.url}>
                                {style.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div> {/* End of scrollable content div */}

            <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 px-4 rounded-md border border-green-400
                    hover:bg-green-400 hover:border-green-800 focus:outline-none focus:border-green-500
                    active:border-green-800 hover:cursor-pointer flex items-center justify-center"
            >
                <FiSave className="mr-2" /> Save Map Settings
            </button>
        </form>
    );
};

export default MapSettingsForm;
