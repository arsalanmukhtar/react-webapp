import React, { useState, useEffect } from 'react';
import CatalogExplorerContent from './CatalogExplorerContent';
// import DatasetUploadContent from './DatasetUploadContent';
import { useAuth } from '../../../contexts/AuthContext';

// Function to pretty print table names (e.g., convert snake_case to Title Case)
const prettyPrintName = (name) => {
    if (!name) return '';
    return name
        .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
        .split(' ') // Split by spaces
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
        .join(' '); // Join back with spaces
};

// Helper to capitalize the first letter of a string
const capitalizeFirstLetter = (string) => {
    if (!string) return 'Unknown';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};


const DataExplorerModal = ({ isOpen, onClose, initialTab, addLayerToMap, catalogTables, catalogLoading, catalogError }) => {
    const { token } = useAuth();
    const [selectedTables, setSelectedTables] = useState([]);
    const [activeTab, setActiveTab] = useState(initialTab || 'catalog');

    // Effect to update activeTab when initialTab prop changes
    useEffect(() => {
        if (initialTab && initialTab !== activeTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedTables([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;


    let modalTitle = "Dataset Control Panel";
    let modalContent;
    let showActionButtons = true;
    let isAddDataButtonEnabled = false;

    // Function to toggle selection of a table (correctly updates array state)
    const handleToggleSelectTable = (tableToToggle) => {
        setSelectedTables(prevSelectedTables => {
            if (prevSelectedTables.some(table => table.name === tableToToggle.name)) {
                return prevSelectedTables.filter(table => table.name !== tableToToggle.name);
            } else {
                return [...prevSelectedTables, tableToToggle];
            }
        });
    };

    const handleAddData = () => {
        if (activeTab === 'catalog' && selectedTables.length > 0) {
            selectedTables.forEach(table => {
                addLayerToMap({
                    name: prettyPrintName(table.name),
                    original_name: table.name,
                    layer_type: 'catalog',
                    geometry_type: capitalizeFirstLetter(table.geometry_type),
                    srid: table.srid ? String(table.srid) : 'N/A',
                    feature_count: table.feature_count !== undefined ? table.feature_count : 'N/A',
                    color: '#000000',
                    is_visible: true,
                    is_selected_for_info: false,
                });
            });
            onClose();
        } else if (activeTab === 'external') {
            console.log("Adding external dataset (not yet implemented)");
            onClose();
        }
    };

    switch (activeTab) {
        case 'catalog':
            isAddDataButtonEnabled = selectedTables.length > 0;
            modalContent = (
                <CatalogExplorerContent
                    tables={catalogTables}
                    loading={catalogLoading}
                    error={catalogError}
                    selectedTables={selectedTables}
                    onToggleSelectTable={handleToggleSelectTable}
                />
            );
            break;
        case 'external':
            isAddDataButtonEnabled = false;
            modalContent = <p className="text-gray-600 text-sm">Link to external datasets.</p>;
            break;
        default:
            modalContent = <p className="text-gray-600 text-sm">Select a tab to explore data.</p>;
            break;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-gray-900 opacity-75"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-lg shadow-xl p-6 z-50 max-w-4xl w-full h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{modalTitle}</h2>
                </div>

                {/* Tabs for Data Explorer options */}
                <div className="flex border-b border-gray-200 mb-4 -mx-6 px-6 pt-2">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200
                                    ${activeTab === 'catalog' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-gray-700'}`}
                    >
                        Catalog Explorer
                    </button>
                    <button
                        onClick={() => setActiveTab('external')}
                        className={`ml-4 px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200
                                    ${activeTab === 'external' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-gray-700'}`}
                    >
                        Dataset External
                    </button>
                </div>

                {/* Modal Body Content */}
                <div className="flex-1 overflow-hidden">
                    {modalContent}
                </div>

                {showActionButtons && (
                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddData}
                            disabled={!isAddDataButtonEnabled}
                            className={`px-4 py-2 rounded-md border border-green-400 transition-colors duration-200
                                        ${isAddDataButtonEnabled ? 'bg-green-500 text-white hover:bg-green-600 hover:border-green-800 cursor-pointer' : 'bg-green-300 text-gray-500 cursor-not-allowed'}`}
                        >
                            Add Data
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataExplorerModal;
