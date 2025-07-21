import React from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const LayerItem = ({ layer, onToggleVisibility, onSelectLayerForInfo }) => {
    const handleToggleVisibility = (event) => {
        event.stopPropagation(); // Prevent triggering onSelectLayerForInfo when toggling visibility
        onToggleVisibility(layer.name);
    };

    const handleLayerClick = () => {
        onSelectLayerForInfo(layer); // Pass the entire layer object to parent
    };

    return (
        <div
            className={`flex items-center justify-between p-2 rounded-md border text-sm cursor-pointer
                        ${layer.isSelectedForInfo ? 'bg-green-100 border-green-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
            onClick={handleLayerClick}
        >
            <span className={`flex-1 truncate ${!layer.isVisible ? 'text-gray-400 line-through' : ''}`}>
                {layer.name}
            </span>
            <div className="flex items-center space-x-2">
                <button
                    onClick={handleToggleVisibility}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                    title={layer.isVisible ? "Hide Layer" : "Show Layer"}
                >
                    {layer.isVisible ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                </button>
            </div>
        </div>
    );
};

export default LayerItem;