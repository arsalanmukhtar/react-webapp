import React from 'react';
import { FiLayers, FiMapPin } from 'react-icons/fi';

const TableCard = ({ table, isSelected, onToggleSelect }) => {
    const imageUrl = "https://cdn.pixabay.com/photo/2023/02/03/05/06/swirls-7764159_1280.jpg";
    const defaultDescription = "This is a sample description for the dataset. More details will be available soon.";

    const prettyPrintName = (name) => {
        if (!name) return '';
        return name
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <div
            className={`flex border rounded-lg shadow-sm overflow-hidden p-4 space-x-4 cursor-pointer transition-all duration-200
                        ${isSelected ? 'bg-green-100 border-green-500' : 'bg-gray-50 border-gray-200 hover:border-green-300'}`}
            onClick={() => onToggleSelect(table)}
        >
            {/* Left Section: Image */}
            <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                <img
                    src={imageUrl}
                    alt="Dataset Thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/96x96/e2e8f0/64748b?text=Image"; }}
                />
            </div>

            {/* Middle Section: Details */}
            <div className="flex-1 flex flex-col justify-between">
                <h4 className="text-lg font-semibold text-gray-800">{prettyPrintName(table.name)}</h4>
                <p className="text-sm text-gray-600 mt-1">{defaultDescription}</p>
                <div className="flex flex-row text-xs text-gray-500 mt-2 space-x-4">
                    <div className="flex items-center">
                        <FiLayers className="mr-1" size={12} /> Feature
                    </div>
                    <div className="flex items-center">
                        <FiMapPin className="mr-1" size={12} /> {table.geometry_type || 'N/A'}
                    </div>
                </div>
            </div>

            {/* Right Section: Fields List */}
            <div className="w-40 flex-shrink-0 border-l border-gray-200 pl-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Fields</h5>
                <div className="h-20 overflow-y-auto text-xs text-gray-600 space-y-1 pr-2">
                    {table.columns.length > 0 ? (
                        table.columns.map(col => (
                            <div key={col.name}>{col.name}</div>
                        ))
                    ) : (
                        <div>No fields available.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TableCard;
