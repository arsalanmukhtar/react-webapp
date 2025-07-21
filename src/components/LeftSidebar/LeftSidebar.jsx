import React, { useState } from 'react';
import { FiLayers, FiList } from 'react-icons/fi'; // Import icons
import './LeftSidebar.css'; // Import custom CSS for transitions

const LeftSidebar = () => {
    // State to manage which layer is active ('layers', 'list', or null for collapsed)
    const [activeLayer, setActiveLayer] = useState(null);

    // Function to toggle the active layer
    const toggleLayer = (layerName) => {
        // If the clicked layer is already active, collapse it (set to null)
        // Otherwise, set the clicked layer as active
        setActiveLayer(prevActiveLayer => (prevActiveLayer === layerName ? null : layerName));
    };

    // Determine if the sidebar is expanded (i.e., a layer is active)
    const isExpanded = activeLayer !== null;

    return (
        // Fixed position, below navbar, and height constrained to viewport
        <div className="fixed top-[50px] left-0 flex z-40 h-[calc(100vh-50px)]">
            {/* Icon Bar (always visible) */}
            {/* Set to w-12 (48px) and bg-white for light theme */}
            <div className={`flex flex-col items-center py-4 bg-white text-gray-700 shadow-lg transition-all duration-300 ease-in-out w-12`}>
                {/* Layers Icon Button */}
                <button
                    onClick={() => toggleLayer('layers')}
                    className={`p-2 rounded-lg mb-4 transition-colors duration-200
                                ${activeLayer === 'layers' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    title="Layers"
                >
                    <FiLayers size={20} /> {/* Reduced icon size */}
                </button>

                {/* List Icon Button */}
                <button
                    onClick={() => toggleLayer('list')}
                    className={`p-2 rounded-lg transition-colors duration-200
                                ${activeLayer === 'list' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    title="List View"
                >
                    <FiList size={20} /> {/* Reduced icon size */}
                </button>
            </div>

            {/* Content Panel (conditionally rendered and animated) */}
            {/* Set to w-56 (224px) when expanded, w-0 when collapsed */}
            <div className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out overflow-hidden
                            ${isExpanded ? 'w-56 opacity-100' : 'w-0 opacity-0'}`}>
                {activeLayer === 'layers' && (
                    <div className="p-4 h-full overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Layers</h3> {/* text-lg */}
                        <p className="text-xs text-gray-600">Content for map layers will go here. This panel slides out.</p> {/* text-xs */}
                        {/* Add your layer management UI here */}
                        <div className="space-y-2 mt-4 text-xs"> {/* text-xs for list items */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 1</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 2</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 3</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 4</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 5</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 6</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 7</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 8</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 9</div> {/* Removed border */}
                            <div className="p-2 rounded-md bg-gray-50">Layer 10</div> {/* Removed border */}
                        </div>
                    </div>
                )}
                {activeLayer === 'list' && (
                    <div className="p-4 h-full overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data List</h3> {/* text-lg */}
                        <p className="text-xs text-gray-600">Content for data list view will be displayed here.</p> {/* text-xs */}
                        {/* Add your data list UI here */}
                        <ul className="list-disc list-inside space-y-1 mt-4 text-xs"> {/* text-xs for list items */}
                            <li>Item A</li>
                            <li>Item B</li>
                            <li>Item C</li>
                            <li>Item D</li>
                            <li>Item E</li>
                            <li>Item F</li>
                            <li>Item G</li>
                            <li>Item H</li>
                            <li>Item I</li>
                            <li>Item J</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeftSidebar;