import React from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const Dropdown = ({ item, isOpen, onToggle }) => {
    return (
        <div className="relative">
            <button
                className="flex items-center gap-1 px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                onClick={onToggle}
            >
                {item.name}
                <FiChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && item.children && (
                <div className="absolute left-0 mt-1 min-w-[10rem] bg-white border border-gray-200 shadow-lg z-50">
                    <ul className="py-1 px-1 space-y-1">
                        {item.children.map((child) => (
                            <li key={child.id}>
                                {child.href.startsWith('/') ? (
                                    <Link
                                        to={child.href}
                                        className="block px-2 py-2 text-sm font-normal text-gray-700 hover:bg-green-50 hover:text-green-500 transition-colors duration-200"
                                        onClick={onToggle}
                                    >
                                        {child.name}
                                    </Link>
                                ) : (
                                    <a
                                        href={child.href}
                                        className="block px-2 py-2 text-sm font-normal text-gray-700 hover:bg-green-50 hover:text-green-500 transition-colors duration-200"
                                        onClick={onToggle}
                                    >
                                        {child.name}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default Dropdown