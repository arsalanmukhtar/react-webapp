import React, { useState } from 'react'; // Removed useEffect as it's no longer needed for navigation
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';

const UserPanel = () => {
    const { user, logout } = useAuth(); // Removed isAuthenticated from destructuring as it's not directly used for navigation here
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // This sets token to null in AuthContext
        setIsDropdownOpen(false); // Close dropdown
        // Navigation is now handled implicitly by PrivateRoute redirecting to '/'
        // or explicitly by a direct navigate if you want to ensure immediate redirection
        // for users already on public pages. For consistency, let's keep a direct navigate.
        navigate('/');
        console.log('Logout button clicked. Token cleared. Navigating to homepage.');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    const DefaultProfileIcon = (
        <FiUser className="w-6 h-6 text-gray-500" />
    );

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
            >
                {user && user.profile_pic ? (
                    user.profile_pic.startsWith('<svg') ? (
                        <div dangerouslySetInnerHTML={{ __html: user.profile_pic }} className="w-full h-full flex items-center justify-center" />
                    ) : (
                        <img src={user.profile_pic} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    )
                ) : (
                    DefaultProfileIcon
                )}
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
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
