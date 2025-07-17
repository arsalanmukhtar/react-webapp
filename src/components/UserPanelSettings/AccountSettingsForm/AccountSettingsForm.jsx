import React, { useState, useEffect } from 'react';
import { FiSave, FiXCircle, FiUser } from 'react-icons/fi';

const AccountSettingsForm = ({ user, token, updateUserProfile, setNotification }) => {
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePic, setProfilePic] = useState(user?.profile_pic || '');
    const [profilePicFile, setProfilePicFile] = useState(null);

    // Update form fields if user data from context changes
    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setProfilePic(user.profile_pic || '');
        }
    }, [user]);

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicFile(file);
            const reader = new FileReader();

            reader.onloadend = () => {
                setProfilePic(reader.result);
            };

            if (file.type === 'image/svg+xml') {
                reader.readAsText(file);
            } else if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                setNotification({ message: 'Unsupported file type. Please upload an SVG, PNG, or JPEG image.', type: 'error', visible: true });
                setProfilePicFile(null);
                setProfilePic('');
            }
        } else {
            setProfilePicFile(null);
        }
    };

    const handleRemoveProfilePic = () => {
        setProfilePicFile(null);
        setProfilePic(''); // Set to empty string to signal removal
        handleSubmitAccountSettings(); // Trigger save
    };

    const handleSubmitAccountSettings = async (e) => {
        if (e) e.preventDefault();
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
        if (fullName !== user?.full_name) {
            updates.full_name = fullName;
        }
        if (newPassword) {
            updates.password = newPassword;
        }
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
                updateUserProfile(data);
                setNotification({ message: 'Account settings updated successfully!', type: 'success', visible: true });
                setNewPassword('');
                setConfirmPassword('');
                setProfilePicFile(null);
            } else {
                const errorData = await res.json();
                setNotification({ message: errorData.detail || 'Failed to update account settings.', type: 'error', visible: true });
            }
        } catch (err) {
            console.error('Network or unexpected error:', err);
            setNotification({ message: 'An unexpected error occurred while saving account settings.', type: 'error', visible: true });
        }
    };

    return (
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
                        value={user?.username || ''}
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
                    value={user?.email || ''}
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
    );
};

export default AccountSettingsForm;