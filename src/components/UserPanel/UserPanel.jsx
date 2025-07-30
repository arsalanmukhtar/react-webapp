import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';

const UserPanel = () => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const userPanelRef = useRef(null); // Create a ref for the user panel container

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate('/');
        // console.log('Logout button clicked. Token cleared. Navigating to homepage.');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    // Effect to handle clicks outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If the click is outside the userPanelRef, close the dropdown
            if (userPanelRef.current && !userPanelRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        // Add event listener when the component mounts
        document.addEventListener('mousedown', handleClickOutside);

        // Clean up the event listener when the component unmounts
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

    const DefaultProfileIcon = (
        <FiUser className="w-6 h-6 text-gray-500" />
    );

    return (
        <div className="relative" ref={userPanelRef}> {/* Attach the ref to the outermost div */}
            <button
                onClick={toggleDropdown}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out cursor-pointer"
            >
                {user?.profile_pic ? (
                    <img
                        src={user.profile_pic}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                    />
                ) : (
                    DefaultProfileIcon
                )}
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <p className="font-semibold">{user?.username || 'Guest'}</p>
                        <p className="text-gray-500 text-xs">{user?.email || 'N/A'}</p>
                    </div>
                    <ul className="py-1">
                        <li>
                            <Link
                                to="/user-panel"
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-500 transition-colors duration-200"
                            >
                                <FiSettings className="mr-2" /> Settings
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                            >
                                <FiLogOut className="mr-2" /> Logout
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserPanel;