import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const Dropdown = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(!isOpen)}
            onMouseLeave={() => setIsOpen(!isOpen)}
        >
            <button className="flex items-center gap-2 px-4 py-2 text-md font-medium text-gray-700 hover:text-gray-900 transition">
                {item.name}
                <FiChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && item.children && (
                <div className="absolute left-0 mt-4 min-w-[14rem] bg-white border border-gray-200 shadow-lg z-50">
                    <ul className="py-3 px-2 space-y-2">
                        {item.children.map((child) => (
                            <li key={child.id}>
                                <a
                                    href={child.href}
                                    className="block px-6 py-3 text-md font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                >
                                    {child.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Dropdown;