import './Navbar.css'
import { NavbarData } from "./NavbarData.js"
import Dropdown from './Dropdown/Dropdown.jsx'

const Navbar = () => {
    return (
        <div className="navbar sticky top-0 z-50 bg-white shadow-sm">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">

                {/* Logo */}
                <div className="navbar-logo flex items-center space-x-2">
                    <img src="earth.svg" alt="Earth" className="w-8 h-8" />
                    <span className="text-lg font-semibold text-gray-800">GeoPortal</span>
                </div>

                {/* Navbar Items */}
                <ul className="navbar-items-list flex gap-4 items-center bg-transparent">
                    {NavbarData.navbarLinks.map((item) => (
                        <li
                            key={item.id}
                            className={`navbar-item relative group ${item.children ? "hover:bg-gray-100 rounded transition" : ""
                                }`}
                        >
                            {item.children ? (
                                <Dropdown item={item} />
                            ) : (
                                <a
                                    href={item.href}
                                    className="navbar-link px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
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
