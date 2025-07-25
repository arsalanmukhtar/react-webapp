import React, { useState, useEffect } from 'react';
import { FiUser, FiMap } from 'react-icons/fi';
import AccountSettingsForm from '../AccountSettingsForm/AccountSettingsForm'; // Path relative to UserSettings folder
import MapSettingsForm from '../MapSettingsForm/MapSettingsForm';     // Path relative to UserSettings folder

const UserSettings = ({ user, token, updateUserProfile, updateMapSettings, setNotification }) => {
    // Internal state for User Settings tabs: 'account' or 'map'
    const [activeTab, setActiveTab] = useState('account');

    return (
        <div className="flex flex-col h-full"> {/* Added flex-col and h-full */}
            {/* Tabs for Account Settings and Map Settings (moved here from UserPanelSettings) */}
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

            {/* Render active sub-tab content */}
            {activeTab === 'account' && (
                <AccountSettingsForm
                    user={user}
                    token={token}
                    updateUserProfile={updateUserProfile}
                    setNotification={setNotification} // Pass the setNotification function
                />
            )}

            {activeTab === 'map' && (
                <MapSettingsForm
                    user={user}
                    token={token}
                    updateMapSettings={updateMapSettings}
                    setNotification={setNotification} // Pass the setNotification function
                />
            )}
        </div>
    );
};

export default UserSettings;