import './Navbar.css'

import { Link } from 'react-router-dom'
import { NavbarData } from "./NavbarData.js"
import Dropdown from './Dropdown/Dropdown.jsx'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook
import UserPanel from '../UserPanel/UserPanel.jsx'; // Import UserPanel

const Navbar = () => {
    // State to track which dropdown is currently open (stores the id of the open dropdown)
    const [openDropdownId, setOpenDropdownId] = useState(null)
    const { isAuthenticated } = useAuth(); // Get isAuthenticated

    // Handler to toggle dropdown open/close
    // If the clicked dropdown is already open, close it (set to null)
    // Otherwise, open the clicked dropdown (set its id)
    const handleDropdownToggle = (id) => {
        setOpenDropdownId(prev => (prev === id ? null : id))
    }

    return (
        <div className="navbar sticky top-0 z-50 bg-white shadow-sm" onMouseLeave={() => setOpenDropdownId(null)}>
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">

                {/* Logo section - now wrapped in Link */}
                <Link to="/" className="navbar-logo flex items-center space-x-2 cursor-pointer">
                    <img src="earth.svg" alt="Earth" className="w-8 h-8" />
                    <span className="text-lg font-semibold text-gray-800">GeoPortal</span>
                </Link>

                {/* Navbar Items */}
                <ul className="navbar-items-list flex gap-4 items-center bg-transparent">
                    {NavbarData.navbarLinks.map((item) => {
                        // Determine if the item is a login/signup link
                        const isAuthLink = item.href === '/login' || item.href === '/signup';

                        // If authenticated, hide login/signup links
                        if (isAuthenticated && isAuthLink) {
                            return null;
                        }
                        // If not authenticated, hide any non-login/signup links that might be intended for authenticated users
                        // (e.g., if there were other links that should only show when logged in, besides UserPanel)
                        if (!isAuthenticated && item.isLogout) { // This condition handles the old logout button if it were still present
                            return null;
                        }

                        // Render dropdowns or regular links
                        return (
                            <li
                                key={item.id}
                                className={`navbar-item relative group ${item.children ? "hover:bg-white-200 transition" : ""}`}
                            >
                                {item.children ? (
                                    <Dropdown
                                        item={item}
                                        isOpen={openDropdownId === item.id}
                                        onToggle={() => handleDropdownToggle(item.id)}
                                    />
                                ) : (
                                    <Link
                                        to={item.href}
                                        className="flex items-center gap-1 px-2 py-2 text-sm font-medium bg-white text-green-500 hover:text-white hover:bg-green-500 transition"
                                    >
                                        {item.name}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                    {/* Render UserPanel conditionally */}
                    {isAuthenticated && (
                        <li className="navbar-item">
                            <UserPanel />
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Navbar;
