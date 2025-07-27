import React from 'react';
import { DataExplorerOptions } from './DataExplorerData';

const DataExplorerPanel = ({ openDataExplorerModal, notification }) => (
  <div className="p-4 h-full flex flex-col justify-between text-sm">
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Explorer</h3>
      <p className="text-gray-600">Select an option to explore data.</p>
      
      {/* Notification display above the buttons */}
      {notification && notification.visible && (
        <div className={`mt-4 px-3 py-2 rounded-md text-sm ${
          notification.type === 'success' ? 'bg-green-100 border border-green-500 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border border-red-500 text-red-700' :
          'bg-blue-100 border border-blue-500 text-blue-700'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
    <div className="space-y-2 mt-auto pb-4">
      {DataExplorerOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => openDataExplorerModal(option.id)}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-500 rounded-md transition-colors duration-200 bg-gray-50 cursor-pointer"
          >
            <Icon className="mr-2" size={16} />
            {option.name}
          </button>
        );
      })}
    </div>
  </div>
);

export default DataExplorerPanel;
