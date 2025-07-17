import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMap, FiSave } from 'react-icons/fi'; // Icons
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

    // Account Settings States
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null); // For file input
    const [profilePicPreview, setProfilePicPreview] = useState(user?.profile_pic || ''); // For displaying current/new pic

    // Map Settings States - These will now be updated by InsetMap
    const [mapCenterLat, setMapCenterLat] = useState(user?.map_center_lat || 0.0);
    const [mapCenterLon, setMapCenterLon] = useState(user?.map_center_lon || 0.0);
    const [mapZoom, setMapZoom] = useState(user?.map_zoom || 2.0);
    const [mapTheme, setMapTheme] = useState(user?.map_theme || MapboxStyles[0].url);

    // Message and Error States
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Update form fields if user data in context changes (e.g., after initial fetch or update)
        if (user) {
            setFullName(user.full_name || '');
            // Set profilePicPreview correctly based on type
            if (user.profile_pic) {
                // If it's an SVG string, it won't start with 'data:image/'
                if (user.profile_pic.startsWith('<svg')) {
                    setProfilePicPreview(user.profile_pic);
                } else if (user.profile_pic.startsWith('data:image/')) {
                    setProfilePicPreview(user.profile_pic);
                } else {
                    // Fallback for any other unexpected format, clear it
                    setProfilePicPreview('');
                }
            } else {
                setProfilePicPreview(''); // Clear if no profile pic
            }
            setMapCenterLat(user.map_center_lat || 0.0);
            setMapCenterLon(user.map_center_lon || 0.0);
            setMapZoom(user.map_zoom || 2.0);
            setMapTheme(user.map_theme || MapboxStyles[0].url);
        }
    }, [user]);

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicFile(file);
            const reader = new FileReader();

            // Check file type to decide how to read it
            if (file.type === 'image/svg+xml') {
                reader.onload = (e) => {
                    setProfilePicPreview(e.target.result); // SVG XML as text
                };
                reader.readAsText(file);
            } else if (file.type.startsWith('image/')) {
                reader.onload = (e) => {
                    setProfilePicPreview(e.target.result); // PNG/JPEG as Data URL (base64)
                };
                reader.readAsDataURL(file);
            } else {
                setError('Unsupported file type. Please upload an SVG, PNG, or JPEG image.');
                setProfilePicFile(null);
                setProfilePicPreview('');
            }
        }
    };

    const handleAccountSave = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword && newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (newPassword && newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }

        let profilePicDataToSend = undefined; // Default to undefined to not send if no change
        if (profilePicFile) {
            // If a new file is uploaded, convert it to the appropriate string format
            const reader = new FileReader();
            await new Promise((resolve, reject) => {
                reader.onload = () => {
                    profilePicDataToSend = reader.result;
                    resolve();
                };
                reader.onerror = reject;

                if (profilePicFile.type === 'image/svg+xml') {
                    reader.readAsText(profilePicFile);
                } else if (profilePicFile.type.startsWith('image/')) {
                    reader.readAsDataURL(profilePicFile);
                }
            });
        } else if (user?.profile_pic && !profilePicPreview) {
            // If user had a picture but cleared it (by setting preview to empty)
            profilePicDataToSend = ""; // Send empty string to clear it in DB
        } else if (profilePicPreview && !profilePicFile) {
            // If preview is set but no new file, it means user kept the existing one
            profilePicDataToSend = profilePicPreview; // Send the existing preview data
        }


        const updateData = {
            full_name: fullName !== user?.full_name ? fullName : undefined,
            password: newPassword || undefined,
            profile_pic: profilePicDataToSend,
        };

        // Filter out undefined values to only send changed fields, but keep profile_pic if explicitly set to ""
        const filteredUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([key, v]) => v !== undefined || (key === 'profile_pic' && v === ""))
        );


        if (Object.keys(filteredUpdateData).length === 0) {
            setMessage('No changes to save.');
            return;
        }

        try {
            const res = await fetch('/api/data/users/me/settings/account', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(filteredUpdateData)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                updateUserProfile(updatedUser); // Update user data in AuthContext
                setMessage('Account settings updated successfully!');
                setNewPassword('');
                setConfirmPassword('');
                setProfilePicFile(null); // Clear file input
            } else {
                const errorData = await res.json();
                setError(errorData.detail || 'Failed to update account settings.');
            }
        } catch (err) {
            console.error('Error updating account settings:', err);
            setError('An unexpected error occurred while saving account settings.');
        }
    };

    // Callback function to receive map changes from InsetMap
    const handleInsetMapChange = ({ latitude, longitude, zoom }) => {
        setMapCenterLat(latitude);
        setMapCenterLon(longitude);
        setMapZoom(zoom);
    };

    const handleMapSave = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // Basic validation for lat/lon
        if (isNaN(mapCenterLat) || mapCenterLat < -90 || mapCenterLat > 90) {
            setError('Latitude must be a number between -90 and 90.');
            return;
        }
        if (isNaN(mapCenterLon) || mapCenterLon < -180 || mapCenterLon > 180) {
            setError('Longitude must be a number between -180 and 180.');
            return;
        }
        if (isNaN(mapZoom) || mapZoom < 0 || mapZoom > 22) {
            setError('Zoom must be a number between 0 and 22.');
            return;
        }

        const updateData = {
            map_center_lat: mapCenterLat !== user?.map_center_lat ? mapCenterLat : undefined,
            map_center_lon: mapCenterLon !== user?.map_center_lon ? mapCenterLon : undefined,
            map_zoom: mapZoom !== user?.map_zoom ? mapZoom : undefined,
            map_theme: mapTheme !== user?.map_theme ? mapTheme : undefined,
        };

        const filteredUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(filteredUpdateData).length === 0) {
            setMessage('No changes to save.');
            return;
        }

        try {
            const res = await fetch('/api/data/users/me/settings/map', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(filteredUpdateData)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                updateMapSettings(updatedUser); // Update map data in AuthContext
                setMessage('Map settings updated successfully!');
            } else {
                const errorData = await res.json();
                setError(errorData.detail || 'Failed to update map settings.');
            }
        } catch (err) {
            console.error('Error updating map settings:', err);
            setError('An unexpected error occurred while saving map settings.');
        }
    };


    return (
        <div className="absolute top-[50px] left-0 right-0 bottom-0 flex bg-gray-50 overflow-hidden"> {/* Added absolute positioning, top, left, right, bottom, and overflow-hidden */}
            {/* Left Sidebar */}
            <div className="w-[400px] bg-white border-r border-gray-200 shadow-md p-2 flex flex-col justify-between"> {/* Reduced p-6 to p-2 */}
                <div>
                    <div className="text-xl font-semibold text-blue-500 mb-4 mt-2"> {/* Changed text-2xl to text-xl, text-zinc-800 to text-blue-500 */}
                        {user?.full_name || user?.username}'s GeoPortal {/* Display full_name, fallback to username */}
                    </div>
                    <div className="border-t border-gray-300 my-2"></div> {/* Reduced my-4 to my-2 */}
                    {/* Navigation links for settings */}
                    <nav className="space-y-1"> {/* Reduced space-y-2 to space-y-1 */}
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
                    className="flex items-center text-green-500 hover:underline mt-4 mb-2" // Reduced mt-8 to mt-4, added mb-2
                >
                    <FiArrowLeft className="mr-2" /> Back to Map
                </Link>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-4 overflow-y-auto"> {/* Reduced p-8 to p-4, added overflow-y-auto */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4"> {/* Reduced p-6 to p-4 */}
                    {/* Tabs for Account Settings and Map Settings */}
                    <div className="flex border-b border-gray-200 mb-4"> {/* Reduced mb-6 to mb-4 */}
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`px-4 py-2 text-lg font-semibold border-b-2 ${activeTab === 'account' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-green-500'}`}
                        >
                            Account Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`ml-4 px-4 py-2 text-lg font-semibold border-b-2 ${activeTab === 'map' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-green-500'}`}
                        >
                            Map Settings
                        </button>
                    </div>

                    {message && (
                        <p className="text-green-600 text-sm text-center mb-4">{message}</p>
                    )}
                    {error && (
                        <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                    )}

                    {/* Account Settings Tab Content */}
                    {activeTab === 'account' && (
                        <form onSubmit={handleAccountSave} className="space-y-3 w-full"> {/* Reduced space-y-5 to space-y-3 */}
                            {/* Profile Picture */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Profile Picture</label>
                                <div className="flex items-center space-x-4">
                                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                                        {profilePicPreview ? (
                                            // Conditional rendering for SVG vs. other image types
                                            profilePicPreview.startsWith('data:image/') ? (
                                                <img src={profilePicPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                // Assuming it's SVG XML if not a data URL
                                                <div dangerouslySetInnerHTML={{ __html: profilePicPreview }} className="w-full h-full flex items-center justify-center" />
                                            )
                                        ) : (
                                            <FiUser className="w-12 h-12 text-gray-500" />
                                        )}
                                    </div>
                                    {/* The actual file input is hidden and triggered by a custom button */}
                                    <label htmlFor="profile-pic-upload" className="cursor-pointer inline-block
                                        px-4 py-2 rounded-md border border-green-400 text-sm font-semibold
                                        bg-green-50 text-green-700 hover:bg-green-100 transition-colors duration-200">
                                        Choose File
                                    </label>
                                    <input
                                        id="profile-pic-upload"
                                        type="file"
                                        accept="image/svg+xml,image/png,image/jpeg"
                                        onChange={handleProfilePicChange}
                                        className="hidden"
                                    />
                                    {/* Display file name or "No file chosen" */}
                                    {(profilePicFile || profilePicPreview) ? (
                                        <span className="text-sm text-gray-600">
                                            {profilePicFile ? profilePicFile.name : "Current file"}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-600">No file chosen</span>
                                    )}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-md placeholder-zinc-400
                      focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
                                    placeholder="Your Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            {/* Email (Not Editable) */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                                    value={user?.email || ''}
                                    disabled
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-md placeholder-zinc-400
                      focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-md placeholder-zinc-400
                      focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
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
                        <form onSubmit={handleMapSave} className="space-y-3 w-full"> {/* Reduced space-y-5 to space-y-3 */}
                            {/* Inset Map Component */}
                            <div className="mb-3"> {/* Reduced mb-4 to mb-3 */}
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Select Map Location</label>
                                <InsetMap
                                    initialCenter={[mapCenterLon, mapCenterLat]}
                                    initialZoom={mapZoom}
                                    onMapChange={handleInsetMapChange}
                                />
                            </div>

                            {/* Map Center Lat Label */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Map Center Latitude</label>
                                <p className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-gray-100 text-gray-700">
                                    {mapCenterLat.toFixed(6)}
                                </p>
                            </div>

                            {/* Map Center Lon Label */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Map Center Longitude</label>
                                <p className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-gray-100 text-gray-700">
                                    {mapCenterLon.toFixed(6)}
                                </p>
                            </div>

                            {/* Map Zoom Label */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Map Zoom Level</label>
                                <p className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-gray-100 text-gray-700">
                                    {mapZoom.toFixed(2)}
                                </p>
                            </div>

                            {/* Map Theme */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Map Theme</label>
                                <select
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-md map-theme-select
                      focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-400"
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

                            <button
                                type="submit"
                                className="w-full bg-green-500 text-white py-2 px-4 rounded-md border border-green-400
                    hover:bg-green-400 hover:border-green-800 focus:outline-none focus:border-green-500
                    active:border-green-800 hover:cursor-pointer flex items-center justify-center"
                            >
                                <FiSave className="mr-2" /> Save Map Settings
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPanelSettings;
