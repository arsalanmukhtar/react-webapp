import React from 'react';

/**
 * TabNavigation - Handles the tab switching logic and UI for the modal
 */
const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-200 mb-4 -mx-6 px-6 pt-2">
      <button
        onClick={() => onTabChange('catalog')}
        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200
                    ${activeTab === 'catalog' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-gray-700'}`}
      >
        Catalog Explorer
      </button>
      <button
        onClick={() => onTabChange('external')}
        className={`ml-4 px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200
                    ${activeTab === 'external' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-gray-700'}`}
      >
        Dataset External
      </button>
    </div>
  );
};

export default TabNavigation;
