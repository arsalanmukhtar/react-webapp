import React, { useState } from 'react';
import { FiLayers, FiList, FiDatabase, FiInfo, FiMapPin, FiLayers as FiFeature } from 'react-icons/fi';
import './LeftSidebar.css';
import DataExplorerModal from './DataExplorerModal/DataExplorerModal';
import { DataExplorerOptions } from './DataExplorerData';
import LayerItem from './LayerItem';

const LeftSidebar = () => {
    const [activeLayer, setActiveLayer] = useState(null);
    const [isDataExplorerModalOpen, setIsDataExplorerModalOpen] = useState(false);
    const [dataExplorerModalType, setDataExplorerModalType] = useState(null);

    const [activeMapLayers, setActiveMapLayers] = useState([]);
    const [selectedLayerForInfo, setSelectedLayerForInfo] = useState(null); // State for info panel

    const toggleLayer = (layerName) => {
        setActiveLayer(prevActiveLayer => (prevActiveLayer === layerName ? null : layerName));
        setIsDataExplorerModalOpen(false);
        setSelectedLayerForInfo(null); // Clear selected layer info when panel closes or switches
    };

    const openDataExplorerModal = (type) => {
        setDataExplorerModalType(type);
        setIsDataExplorerModalOpen(true);
        setActiveLayer('dataExplorer');
    };

    const addLayerToMap = (layerData) => {
        setActiveMapLayers(prevLayers => {
            // Log original layer name when added
            if (layerData.type === 'catalog' && layerData.original_name) {
                console.log(`Adding catalog layer: ${layerData.original_name}`);
            } else if (layerData.type === 'geojson' && layerData.name) {
                console.log(`Adding GeoJSON layer: ${layerData.name}`);
            }

            // Check if layer with same name already exists to prevent duplicates
            if (prevLayers.some(layer => layer.name === layerData.name)) {
                return prevLayers; // Don't add if already exists
            }
            return [...prevLayers, { ...layerData, isVisible: true, isSelectedForInfo: false }]; // Add new layer, default to visible
        });
    };

    const toggleLayerVisibility = (layerName) => {
        setActiveMapLayers(prevLayers =>
            prevLayers.map(layer =>
                layer.name === layerName ? { ...layer, isVisible: !layer.isVisible } : layer
            )
        );
        console.log(`Toggling visibility for layer: ${layerName}`);
    };

    // Function to handle selection of a layer for info display
    const handleSelectLayerForInfo = (layer) => {
        // If the clicked layer is already selected, deselect it (toggle off)
        if (selectedLayerForInfo && selectedLayerForInfo.name === layer.name) {
            setSelectedLayerForInfo(null);
            setActiveMapLayers(prevLayers =>
                prevLayers.map(l => ({ ...l, isSelectedForInfo: false }))
            );
        } else {
            // Otherwise, select the new layer
            setSelectedLayerForInfo(layer);
            setActiveMapLayers(prevLayers =>
                prevLayers.map(l => ({
                    ...l,
                    isSelectedForInfo: l.name === layer.name ? true : false
                }))
            );
        }
    };


    const isExpanded = activeLayer !== null;

    return (
        <div className="fixed top-[50px] left-0 flex z-40 h-[calc(100vh-50px)]">
            {/* Icon Bar - Reduced width when collapsed, maintains w-20 for icons */}
            <div className={`flex flex-col items-center py-4 bg-white text-gray-700 shadow-lg transition-all duration-300 ease-in-out w-12 justify-between relative`}>
                <div className="flex flex-col items-center">
                    <button
                        onClick={() => toggleLayer('layers')}
                        className={`p-2 rounded-lg mb-4 transition-colors duration-200 cursor-pointer text-base
                                    ${activeLayer === 'layers' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Layers"
                    >
                        <FiLayers size={22} />
                    </button>

                    <button
                        onClick={() => toggleLayer('list')}
                        className={`p-2 rounded-lg mb-4 transition-colors duration-200 cursor-pointer text-base
                                    ${activeLayer === 'list' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Data List"
                    >
                        <FiList size={22} />
                    </button>
                </div>

                <button
                    onClick={() => toggleLayer('dataExplorer')}
                    className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer text-base
                                ${activeLayer === 'dataExplorer' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    title="Data Explorer"
                >
                    <FiDatabase size={22} />
                </button>
            </div>

            {/* Content Panel - Increased width */}
            <div className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out overflow-hidden
                            ${isExpanded ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}>
                {activeLayer === 'layers' && (
                    <div className="p-4 h-full flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Layers</h3>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {activeMapLayers.length === 0 ? (
                                <p className="text-gray-600">No layers added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {activeMapLayers.map(layer => (
                                        <LayerItem
                                            key={layer.name}
                                            layer={layer}
                                            onToggleVisibility={toggleLayerVisibility}
                                            onSelectLayerForInfo={handleSelectLayerForInfo}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Layer Info Panel at the bottom */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">Layer Info</h4>
                            {selectedLayerForInfo ? (
                                <div className="space-y-1 text-xs">
                                    <p className="font-medium text-green-500">{selectedLayerForInfo.name}</p> {/* Applied text-green-500 */}
                                    <ul className="space-y-1">
                                        <li className="flex items-center">
                                            <FiInfo className="mr-2 text-gray-500" size={12} /> Source: {selectedLayerForInfo.type === 'catalog' ? 'Catalog Layer' : 'GeoJSON Upload'}
                                        </li>
                                        <li className="flex items-center">
                                            <FiMapPin className="mr-2 text-gray-500" size={12} /> Geometry: {selectedLayerForInfo.geometry_type || 'N/A'}
                                        </li>
                                        <li className="flex items-center">
                                            <FiInfo className="mr-2 text-gray-500" size={12} /> SRID: {selectedLayerForInfo.srid || 'N/A'}
                                        </li>
                                        <li className="flex items-center">
                                            <FiFeature className="mr-2 text-gray-500" size={12} /> Features: {selectedLayerForInfo.feature_count !== undefined ? selectedLayerForInfo.feature_count : 'N/A'}
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm">Select a layer to view its details.</p>
                            )}
                        </div>
                    </div>
                )}
                {activeLayer === 'list' && (
                    <div className="p-4 h-full overflow-y-auto text-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data List</h3>
                        <p className="text-gray-600">Content for data list view will be displayed here.</p>
                        <ul className="list-disc list-inside space-y-1 mt-4">
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
                {activeLayer === 'dataExplorer' && (
                    <div className="p-4 h-full flex flex-col justify-between text-sm">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Explorer</h3>
                            <p className="text-gray-600">Select an option to explore data.</p>
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
                )}
            </div>

            <DataExplorerModal
                isOpen={isDataExplorerModalOpen}
                onClose={() => setIsDataExplorerModalOpen(false)}
                initialTab={dataExplorerModalType}
                addLayerToMap={addLayerToMap}
            />
        </div>
    );
};

export default LeftSidebar;