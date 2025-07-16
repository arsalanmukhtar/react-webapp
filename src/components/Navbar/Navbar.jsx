import './Navbar.css'
import { NavbarData } from "./NavbarData.js"
import Dropdown from './Dropdown/Dropdown.jsx'
import { useState } from 'react'

const Navbar = () => {
    // State to track which dropdown is currently open (stores the id of the open dropdown)
    const [openDropdownId, setOpenDropdownId] = useState(null)

    // Handler to toggle dropdown open/close
    // If the clicked dropdown is already open, close it (set to null)
    // Otherwise, open the clicked dropdown (set its id)
    const handleDropdownToggle = (id) => {
        setOpenDropdownId(prev => (prev === id ? null : id))
    }

    return (
        <div className="navbar sticky top-0 z-50 bg-white shadow-sm" onMouseLeave={() => setOpenDropdownId(null)}>
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">

                {/* Logo section */}
                <div className="navbar-logo flex items-center space-x-2">
                    <img src="earth.svg" alt="Earth" className="w-8 h-8" />
                    <span className="text-lg font-semibold text-gray-800">GeoPortal</span>
                </div>

                {/* Navbar Items */}
                <ul className="navbar-items-list flex gap-4 items-center bg-transparent">
                    {NavbarData.navbarLinks.map((item) => (
                        <li
                            key={item.id}
                            className={`navbar-item relative group ${item.children ? "hover:bg-slate-200 transition" : ""}`}
                        >
                            {/* If item has children, render Dropdown component */}
                            {item.children ? (
                                <Dropdown
                                    item={item} // Pass the menu item object
                                    isOpen={openDropdownId === item.id} // Only open if this item's id matches openDropdownId
                                    onToggle={() => handleDropdownToggle(item.id)} // Toggle open/close for this dropdown
                                />
                            ) : (
                                // If no children, render a simple link
                                <a
                                    href={item.href}
                                    className="flex items-center gap-1 px-2 py-2 text-sm font-medium bg-slate-50 text-green-500 hover:text-slate-50 hover:bg-green-500 transition"
                                >
                                    {item.name}
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Navbar