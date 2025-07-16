import React from 'react'
import { FiChevronDown } from 'react-icons/fi'

// Dropdown component receives:
// - item: the menu item object (with name, children, etc.)
// - isOpen: boolean, whether this dropdown is open
// - onToggle: function to toggle open/close state
const Dropdown = ({ item, isOpen, onToggle }) => {
    return (
        // Container for dropdown, relative for absolute positioning of menu
        <div className="relative">
            <button
                className="flex items-center gap-1 px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                onClick={onToggle} // Calls parent handler to open/close this dropdown
            >
                {/* Display the dropdown label */}
                {item.name}
                {/* Chevron icon, rotates when open */}
                <FiChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown menu, only shown if open and item has children */}
            {isOpen && item.children && (
                <div className="absolute left-0 mt-1 min-w-[10rem] bg-white border border-gray-200 shadow-lg z-50">
                    {/* List of child menu items */}
                    <ul className="py-1 px-1 space-y-1">
                        {item.children.map((child) => (
                            <li key={child.id}>
                                {/* Child link, styled with hover effects */}
                                <a
                                    href={child.href}
                                    className="block px-2 py-2 text-sm font-normal text-gray-700 hover:bg-slate-50 hover:text-green-500 transition-colors duration-200"
                                >
                                    {child.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default Dropdown