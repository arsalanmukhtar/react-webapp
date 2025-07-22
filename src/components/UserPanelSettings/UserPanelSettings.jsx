import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiSettings, FiX } from 'react-icons/fi'; // Added FiX for the close icon
import { useAuth } from '../../contexts/AuthContext';
import UserSettings from './UserSettings/UserSettings'; // New import for UserSettings component
// import ProjectSettings from './ProjectSettings/ProjectSettings'; // Placeholder for future component

const UserPanelSettings = () => {
    const { user, token, updateUserProfile, updateMapSettings } = useAuth();
    const navigate = useNavigate();

    // Top-level active tab: 'user' or 'project'
    const [activeParentTab, setActiveParentTab] = useState('user');

    // This setNotification function will be passed down to UserSettings
    // and then to AccountSettingsForm/MapSettingsForm.
    // The notification rendering logic is now handled locally within those forms.
    const setNotification = (message, type) => {
        // This function now acts as a simple pass-through or can be used for
        // top-level notifications if needed, but for this request, it's simplified.
        console.log(`Notification: ${type} - ${message}`);
    };

    return (
        <div className="absolute top-[50px] left-0 right-0 bottom-0 flex bg-gray-50 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-[400px] bg-white border-r border-gray-200 shadow-md p-2 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-4 mt-2"> {/* Added flex for alignment */}
                        <div className="text-md font-semibold text-blue-500">
                            {user?.full_name || user?.username}'s GeoPortal
                        </div>
                        <FiX
                            className="text-red-500 hover:text-red-700 cursor-pointer text-xl" // Styled cross icon
                            onClick={() => navigate('/map-dashboard')}
                            title="Close Settings" // Tooltip
                        />
                    </div>
                    <div className="border-t border-gray-300 my-2"></div>
                    {/* Navigation links for parent settings */}
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveParentTab('user')}
                            className={`flex items-center w-full px-3 py-1.5 rounded-md text-left text-sm font-medium transition-colors duration-200
                                ${activeParentTab === 'user' ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-green-50 hover:text-green-500'}`}
                        >
                            <FiUser className="mr-2" /> User Settings
                        </button>
                        <button
                            onClick={() => setActiveParentTab('project')}
                            className={`flex items-center w-full px-3 py-1.5 rounded-md text-left text-sm font-medium transition-colors duration-200
                                ${activeParentTab === 'project' ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-green-50 hover:text-green-500'}`}
                        >
                            <FiSettings className="mr-2" /> Project Settings
                        </button>
                    </nav>
                </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 relative flex flex-col h-full">
                    {/* Render active parent tab content */}
                    {activeParentTab === 'user' && (
                        <UserSettings
                            user={user}
                            token={token}
                            updateUserProfile={updateUserProfile}
                            updateMapSettings={updateMapSettings}
                            setNotification={setNotification} // Pass the setNotification function
                        />
                    )}

                    {activeParentTab === 'project' && (
                        <div className="text-center text-gray-500 py-10 flex-1 overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4">Project Settings</h2>
                            <p>Content for Project Settings will go here.</p>
                            <p className="mt-4 text-sm">This component is a placeholder for future development.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPanelSettings;