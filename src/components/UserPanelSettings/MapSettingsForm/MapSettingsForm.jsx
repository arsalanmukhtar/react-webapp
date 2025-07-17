import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMap } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import AccountSettingsForm from '../AccountSettingsForm/AccountSettingsForm'; // Updated import path
import MapSettingsForm from '../MapSettingsForm/MapSettingsForm';     // Updated import path

const UserPanelSettings = () => {
    const { user, token, updateUserProfile, updateMapSettings } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('account');
    // Initial state for notification: not visible, positioned off-screen above
    const [notification, setNotification] = useState({ message: '', type: '', visible: false, translateY: '-full' });

    // Effect to auto-hide notification after 3 seconds with animation
    useEffect(() => {
        let timer;
        if (notification.visible) {
            // Set a timeout to start sliding out after 2.5 seconds (allowing 0.5s for initial slide-in)
            timer = setTimeout(() => {
                setNotification(prev => ({ ...prev, translateY: '-full' })); // Start slide-out animation
            }, 2500); // Start sliding out after 2.5 seconds

            // Set another timeout to completely hide the notification after 3 seconds (2.5s + 0.5s animation duration)
            const hideTimer = setTimeout(() => {
                setNotification(prev => ({ ...prev, visible: false, message: '' })); // Fully hide and clear message
            }, 3000); // Total 3 seconds until fully hidden

            return () => {
                clearTimeout(timer);
                clearTimeout(hideTimer);
            };
        }
    }, [notification.visible, notification.message]); // Depend on message to re-trigger if message changes while visible

    // Function to show notification with slide-in animation
    const showNotification = (message, type) => {
        setNotification({ message, type, visible: true, translateY: '0' }); // Slide in
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
                <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 relative">
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
                        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3 rounded-md shadow-lg text-sm transition-transform duration-500 ease-out
                                ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
                                notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
                                    'bg-blue-100 text-blue-800 border border-blue-300'}
                                transform ${notification.translateY === '0' ? 'translate-y-0' : '-translate-y-full'}
                                `}>
                            <p className="text-center">{notification.message}</p>
                        </div>
                    )}

                    {/* Render active tab content */}
                    {activeTab === 'account' && (
                        <AccountSettingsForm
                            user={user}
                            token={token}
                            updateUserProfile={updateUserProfile}
                            setNotification={showNotification} // Pass the new showNotification function
                        />
                    )}

                    {activeTab === 'map' && (
                        <MapSettingsForm
                            user={user}
                            token={token}
                            updateMapSettings={updateMapSettings}
                            setNotification={showNotification} // Pass the new showNotification function
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPanelSettings;
