import React from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FaTrashAlt } from "react-icons/fa";

const LayerItem = ({ layer, onToggleVisibility, onSelectLayerForInfo, onDeleteLayer, isSelected }) => {
    const handleToggleVisibility = (event) => {
        event.stopPropagation(); // Prevent triggering onSelectLayerForInfo when toggling visibility
        onToggleVisibility(layer.name);
    };

    const handleLayerClick = () => {
        onSelectLayerForInfo(layer); // Pass the entire layer object to parent
    };

    const handleDelete = (event) => {
        event.stopPropagation();
        if (onDeleteLayer) onDeleteLayer(layer.id);
    };

    return (
        <div
            className={`flex items-center justify-between p-2 rounded-md border text-sm cursor-pointer
                        ${isSelected ? 'bg-green-100 border-green-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
            onClick={handleLayerClick}
        >
            <span className={`flex-1 truncate ${!layer.isVisible ? 'text-gray-400 line-through' : ''}`}>
                {layer.name}
            </span>
            <div className="flex items-center space-x-2">
                <button
                    onClick={handleToggleVisibility}
                    className="text-blue-500 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                    title={layer.isVisible ? "Hide Layer" : "Show Layer"}
                >
                    {layer.isVisible ? <FiEye size={17} /> : <FiEyeOff className='text-gray-300' size={17} />}
                </button>
                <button
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-600 transition-colors duration-200 cursor-pointer border border-transparent"
                    title="Remove Layer"
                >
                    <FaTrashAlt size={16} />
                </button>
            </div>
        </div>
    );
};

export default LayerItem;