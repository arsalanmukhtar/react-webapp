import React, { useState } from 'react';
import { FiLayers, FiList, FiDatabase, FiBookOpen, FiUploadCloud, FiLink } from 'react-icons/fi';
import './LeftSidebar.css';
import DataExplorerModal from './DataExplorerModal/DataExplorerModal';
import { DataExplorerOptions } from './DataExplorerData';

const LeftSidebar = () => {
    const [activeLayer, setActiveLayer] = useState(null);
    const [isDataExplorerModalOpen, setIsDataExplorerModalOpen] = useState(false);
    const [dataExplorerModalType, setDataExplorerModalType] = useState(null);

    const toggleLayer = (layerName) => {
        setActiveLayer(prevActiveLayer => (prevActiveLayer === layerName ? null : layerName));
        setIsDataExplorerModalOpen(false);
    };

    const openDataExplorerModal = (type) => {
        setDataExplorerModalType(type);
        setIsDataExplorerModalOpen(true);
        setActiveLayer('dataExplorer');
    };

    const isExpanded = activeLayer !== null;

    return (
        <div className="fixed top-[50px] left-0 flex z-40 h-[calc(100vh-50px)]">
            <div className={`flex flex-col items-center py-4 bg-white text-gray-700 shadow-lg transition-all duration-300 ease-in-out w-12 justify-between relative`}>
                <div className="flex flex-col items-center">
                    <button
                        onClick={() => toggleLayer('layers')}
                        className={`p-2 rounded-lg mb-4 transition-colors duration-200 cursor-pointer
                                    ${activeLayer === 'layers' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Layers"
                    >
                        <FiLayers size={20} />
                    </button>

                    <button
                        onClick={() => toggleLayer('list')}
                        className={`p-2 rounded-lg mb-4 transition-colors duration-200 cursor-pointer
                                    ${activeLayer === 'list' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Data List"
                    >
                        <FiList size={20} />
                    </button>
                </div>

                <button
                    onClick={() => toggleLayer('dataExplorer')}
                    className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer
                                ${activeLayer === 'dataExplorer' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    title="Data Explorer"
                >
                    <FiDatabase size={20} />
                </button>
            </div>

            <div className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out overflow-hidden
                            ${isExpanded ? 'w-56 opacity-100' : 'w-0 opacity-0'}`}>
                {activeLayer === 'layers' && (
                    <div className="p-4 h-full overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Layers</h3>
                        <p className="text-xs text-gray-600">Content for map layers will go here. This panel slides out.</p>
                        <div className="space-y-2 mt-4 text-xs">
                            <div className="p-2 rounded-md bg-gray-50">Layer 1</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 2</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 3</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 4</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 5</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 6</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 7</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 8</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 9</div>
                            <div className="p-2 rounded-md bg-gray-50">Layer 10</div>
                        </div>
                    </div>
                )}
                {activeLayer === 'list' && (
                    <div className="p-4 h-full overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data List</h3>
                        <p className="text-xs text-gray-600">Content for data list view will be displayed here.</p>
                        <ul className="list-disc list-inside space-y-1 mt-4 text-xs">
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
                    <div className="p-4 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Explorer</h3>
                            <p className="text-xs text-gray-600">Select an option to explore data.</p>
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
                type={dataExplorerModalType}
            />
        </div>
    );
};

export default LeftSidebar;
