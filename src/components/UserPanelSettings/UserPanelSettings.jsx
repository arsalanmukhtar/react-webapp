import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMap, FiSave, FiXCircle } from 'react-icons/fi'; // Added FiXCircle for remove button
import { useAuth } from '../../contexts/AuthContext'; // Access auth context
import InsetMap from './InsetMap/InsetMap'; // Import the new InsetMap component
import './UserPanelSettings.css'; // Import the new CSS file for UserPanelSettings

// Define Mapbox styles for dropdown
const MapboxStyles = [
    { name: "Streets", url: "mapbox://styles/mapbox/streets-v11" },
    { name: "Outdoors", url: "mapbox://styles/mapbox/outdoors-v11" },
    { name: "Light", url: "mapbox://styles/mapbox/light-v10" },
    { name: "Dark", url: "mapbox://styles/mapbox/dark-v10" },
    { name: "Satellite", url: "mapbox://styles/mapbox/satellite-v9" },
    { name: "Satellite Streets", url: "mapbox://styles/mapbox/satellite-streets-v11" },
];


const UserPanelSettings = () => {
    const { user, token, updateUserProfile, updateMapSettings } = useAuth(); // Get user, token, and update functions
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('account'); // 'account' or 'map'

    // Map Settings States - Moved up to ensure definition before useEffect that uses them
    const [mapCenterLat, setMapCenterLat] = useState(user?.map_center_lat || 0.0);
    const [mapCenterLon, setMapCenterLon] = useState(user?.map_center_lon || 0.0);
    const [mapZoom, setMapZoom] = useState(user?.map_zoom || 2.0);
    const [mapTheme, setMapTheme] = useState(user?.map_theme || MapboxStyles[0].url);

    // Account Settings States
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePic, setProfilePic] = useState(user?.profile_pic || ''); // Holds base64/SVG string or empty string
    // profilePicFile is no longer directly used for sending to backend, only for reading the file
    const [profilePicFile, setProfilePicFile] = useState(null);

    // Unified Message State for notifications
    const [notification, setNotification] = useState({ message: '', type: '', visible: false });


    useEffect(() => {
        // Update form fields if user data in context changes (e.g., after initial fetch or update)
        if (user) {
            setFullName(user.full_name || '');
            setProfilePic(user.profile_pic || ''); // Ensure profilePic state reflects current user data
            setMapCenterLat(user.map_center_lat || 0.0);
            setMapCenterLon(user.map_center_lon || 0.0);
            setMapZoom(user.map_zoom || 2.0);
            setMapTheme(user.map_theme || MapboxStyles[0].url);
        }
    }, [user]);

    // Effect to auto-hide notification after 5 seconds
    useEffect(() => {
        if (notification.visible) {
            const timer = setTimeout(() => {
                setNotification(prev => ({ ...prev, visible: false }));
            }, 3000); // 5 seconds total duration
            return () => clearTimeout(timer);
        }
    }, [notification.visible, notification.message]); // Depend on message too, in case message changes while visible


    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicFile(file); // Store the file object
            const reader = new FileReader();

            reader.onloadend = () => {
                setProfilePic(reader.result); // Set profilePic state to the base64/SVG string
            };

            // Check file type to decide how to read it
            if (file.type === 'image/svg+xml') {
                reader.readAsText(file); // Read SVG as text
            } else if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file); // Read other images as data URL (base64)
            } else {
                setNotification({ message: 'Unsupported file type. Please upload an SVG, PNG, or JPEG image.', type: 'error', visible: true });
                setProfilePicFile(null);
                setProfilePic(''); // Clear profilePic state if unsupported
            }
        } else {
            setProfilePicFile(null);
            // Do not clear profilePic here, it should only be cleared by handleRemoveProfilePic
            // or when a new file is successfully loaded.
        }
    };

    const handleSubmitAccountSettings = async (e) => {
        if (e) e.preventDefault(); // Only prevent default if event object is present
        setNotification({ message: '', type: '', visible: false }); // Clear previous notification

        if (newPassword && newPassword !== confirmPassword) {
            setNotification({ message: 'New passwords do not match.', type: 'error', visible: true });
            return;
        }
        if (newPassword && newPassword.length < 8) {
            setNotification({ message: 'New password must be at least 8 characters long.', type: 'error', visible: true });
            return;
        }

        const updates = {};
        if (fullName !== user?.full_name) { // Only send if changed
            updates.full_name = fullName;
        }
        if (newPassword) { // Only send if a new password is set
            updates.password = newPassword;
        }
        // Always send profilePic if it has changed from the user's current value
        // This handles both setting a new picture and clearing an existing one.
        // If profilePic is '', it will be sent as null to the backend.
        if (profilePic !== user?.profile_pic) {
            updates.profile_pic = profilePic;
        }

        if (Object.keys(updates).length === 0) {
            setNotification({ message: 'No changes to save.', type: 'info', visible: true });
            return;
        }

        try {
            const res = await fetch('/api/data/users/me/settings/account', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const data = await res.json();
                updateUserProfile(data); // Update user in context
                setNotification({ message: 'Account settings updated successfully!', type: 'success', visible: true });
                setNewPassword(''); // Clear password fields on success
                setConfirmPassword('');
                setProfilePicFile(null); // Clear file input state after successful upload/update
            } else {
                const errorData = await res.json();
                setNotification({ message: errorData.detail || 'Failed to update account settings.', type: 'error', visible: true });
            }
        } catch (err) {
            console.error('Network or unexpected error:', err);
            setNotification({ message: 'An unexpected error occurred while saving account settings.', type: 'error', visible: true });
        }
    };

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
        // Check against current user data from context to only send changed values
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
                updateMapSettings(data); // Update map settings in context
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

    const handleRemoveProfilePic = () => {
        setProfilePicFile(null); // Clear the file input state
        setProfilePic(''); // Set profilePic to an empty string to indicate removal
        // Trigger save to update database, sending null for profile_pic
        handleSubmitAccountSettings();
    };


    return (
        <div className="absolute top-[50px] left-0 right-0 bottom-0 flex bg-gray-50 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-[400px] bg-white border-r border-gray-200 shadow-md p-2 flex flex-col justify-between">
                <div>
                    <div className="text-md font-semibold text-blue-500 mb-4 mt-2">
                        {user?.full_name || user?.username}'s GeoPortal
                    </div>
                    <div className="border-t border-gray-300 my-2"></div>
                    {/* Navigation links for settings */}
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`flex items-center w-full px-3 py-1.5 rounded-md text-left text-sm font-medium transition-colors duration-200
                                ${activeTab === 'account' ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-green-50 hover:text-green-500'}`}
                        >
                            <FiUser className="mr-2" /> Account Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`flex items-center w-full px-3 py-1.5 rounded-md text-left text-sm font-medium transition-colors duration-200
                                ${activeTab === 'map' ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-green-50 hover:text-green-500'}`}
                        >
                            <FiMap className="mr-2" /> Map Settings
                        </button>
                    </nav>
                </div>
                <Link
                    to="/map-dashboard"
                    className="flex items-center text-green-500 hover:underline mt-4 mb-2"
                >
                    <FiArrowLeft className="mr-2" /> Back to Map
                </Link>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 relative"> {/* Added relative for message positioning */}
                    {/* Tabs for Account Settings and Map Settings */}
                    <div className="flex border-b border-gray-200 mb-4">
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`px-4 py-2 text-lg font-semibold border-b-2 ${activeTab === 'account' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-gray-700'}`}
                        >
                            Account Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`ml-4 px-4 py-2 text-lg font-semibold border-b-2 ${activeTab === 'map' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-gray-700'}`}
                        >
                            Map Settings
                        </button>
                    </div>

                    {/* Consolidated Message Display at the top center of the main container */}
                    {notification.visible && (
                        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3 rounded-md shadow-lg text-sm transition-all duration-500 ease-out
                                ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
                                notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
                                    'bg-blue-100 text-blue-800 border border-blue-300'}
                                `}>
                            <p className="text-center">{notification.message}</p>
                        </div>
                    )}


                    {/* Account Settings Tab Content */}
                    {activeTab === 'account' && (
                        <form onSubmit={handleSubmitAccountSettings} className="space-y-6">
                            {/* Full Name and Username in one row */}
                            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                                {/* Full Name */}
                                <div className="flex-1">
                                    <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700">Full Name</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>

                                {/* Username (Not Editable) */}
                                <div className="flex-1">
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        id="username"
                                        className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500 bg-gray-100 cursor-not-allowed"
                                        value={user?.username || ''} // Display from user context
                                        disabled
                                    />
                                </div>
                            </div>

                            {/* Email Address (Not Editable) */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500 bg-gray-100 cursor-not-allowed"
                                    value={user?.email || ''} // Display from user context
                                    disabled
                                />
                            </div>

                            {/* Password and Confirm Password in one row */}
                            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                                {/* Password */}
                                <div className="flex-1">
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>

                                {/* Confirm Password */}
                                <div className="flex-1">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Profile Picture */}
                            <div>
                                <label htmlFor="profilePicUpload" className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                                <input
                                    type="file"
                                    id="profilePicUpload"
                                    accept="image/svg+xml,image/png,image/jpeg"
                                    onChange={handleProfilePicChange}
                                    className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-green-50 file:text-green-700
                                    hover:file:bg-green-100 hover:file:cursor-pointer"
                                />
                                {profilePic && ( // Only show preview if profilePic has a value
                                    <div className="mt-4 flex items-center space-x-3">
                                        <span className="text-sm text-gray-600">Current file:</span>
                                        {profilePic.startsWith('<svg') ? (
                                            <div dangerouslySetInnerHTML={{ __html: profilePic }} className="h-16 w-16 rounded-full object-cover border border-gray-200 flex items-center justify-center" />
                                        ) : (
                                            <img src={profilePic} alt="Profile Preview" className="h-16 w-16 rounded-full object-cover border border-gray-200" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleRemoveProfilePic}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                        >
                                            <FiXCircle className="-ml-0.5 mr-2 h-4 w-4" />
                                            Remove Picture
                                        </button>
                                    </div>
                                )}
                                {!profilePic && user?.profile_pic && ( // If profilePic is cleared locally but user still has one in DB
                                    <p className="mt-2 text-sm text-gray-500">No new picture selected. Currently using saved picture.</p>
                                )}
                                {!profilePic && !user?.profile_pic && ( // If no profile pic set at all
                                    <p className="mt-2 text-sm text-gray-500">No profile picture set. Using default icon.</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-green-500 text-white py-2 px-4 rounded-md border border-green-400
                                hover:bg-green-400 hover:border-green-800 focus:outline-none focus:border-green-500
                                active:border-green-800 hover:cursor-pointer flex items-center justify-center"
                            >
                                <FiSave className="mr-2" /> Save Account Settings
                            </button>
                        </form>
                    )}

                    {/* Map Settings Tab Content */}
                    {activeTab === 'map' && (
                        <div className="space-y-6">
                            <form onSubmit={handleSubmitMapSettings} className="space-y-6">
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

                                {/* Removed individual mapMessage and mapError here */}

                                <button
                                    type="submit"
                                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md border border-green-400
                    hover:bg-green-400 hover:border-green-800 focus:outline-none focus:border-green-500
                    active:border-green-800 hover:cursor-pointer flex items-center justify-center"
                                >
                                    <FiSave className="mr-2" /> Save Map Settings
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPanelSettings;