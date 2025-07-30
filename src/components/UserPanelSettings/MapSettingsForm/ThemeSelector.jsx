import React, { useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { MapboxStyles } from './MapSettingsUtils';

/**
 * ThemeSelector - Handles the map theme dropdown selection
 */
const ThemeSelector = ({ 
  mapTheme, 
  isDropdownOpen, 
  onToggleDropdown, 
  onThemeSelect 
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggleDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onToggleDropdown]);

  const selectedThemeName = MapboxStyles.find(style => style.url === mapTheme)?.name || 'Select a theme';

  const handleThemeSelect = (url) => {
    onThemeSelect(url);
    onToggleDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor="mapTheme" className="block text-sm font-medium text-gray-700">
        Map Theme
      </label>
      <button
        type="button"
        id="mapTheme"
        className="w-full flex items-center justify-between px-3 py-2 border border-zinc-300 rounded-md shadow-sm
                   bg-white text-gray-700 text-sm font-normal cursor-pointer
                   focus:outline-none focus:border-green-500 hover:border-green-500 active:border-green-800 transition-colors duration-200"
        onClick={() => onToggleDropdown(!isDropdownOpen)}
      >
        {selectedThemeName}
        <FiChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <ul className="py-1 px-1 space-y-1">
            {MapboxStyles.map((style) => (
              <li key={style.url}>
                <button
                  type="button"
                  onClick={() => handleThemeSelect(style.url)}
                  className="block w-full text-left px-2 py-2 text-sm font-normal text-gray-700 hover:bg-green-50 hover:text-green-500 transition-colors duration-200 rounded-md"
                >
                  {style.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
