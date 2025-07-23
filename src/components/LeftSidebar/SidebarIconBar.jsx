import React from 'react';
import { FiLayers, FiList, FiDatabase } from 'react-icons/fi';

const SidebarIconBar = ({ activeLayer, toggleLayer }) => (
  <div className={`flex flex-col items-center py-4 bg-white text-gray-700 shadow-lg transition-all duration-300 ease-in-out w-12 justify-between relative`}>
    <div className="flex flex-col items-center">
      <button
        onClick={() => toggleLayer('layers')}
        className={`p-2 rounded-lg mb-4 transition-colors duration-200 cursor-pointer text-base ${activeLayer === 'layers' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Layers"
      >
        <FiLayers size={22} />
      </button>
      <button
        onClick={() => toggleLayer('list')}
        className={`p-2 rounded-lg mb-4 transition-colors duration-200 cursor-pointer text-base ${activeLayer === 'list' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Data List"
      >
        <FiList size={22} />
      </button>
    </div>
    <button
      onClick={() => toggleLayer('dataExplorer')}
      className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer text-base ${activeLayer === 'dataExplorer' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
      title="Data Explorer"
    >
      <FiDatabase size={22} />
    </button>
  </div>
);

export default SidebarIconBar;
