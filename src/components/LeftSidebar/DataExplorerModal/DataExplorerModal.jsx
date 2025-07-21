import React, { useState, useEffect } from 'react';
import CatalogExplorerContent from './CatalogExplorerContent';
import DatasetUploadContent from './DatasetUploadContent';
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

const DataExplorerModal = ({ isOpen, onClose, initialTab, addLayerToMap }) => {
    const { token } = useAuth();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTables, setSelectedTables] = useState([]);
    const [uploadedGeoJSONs, setUploadedGeoJSONs] = useState([]); // Now an array for GeoJSONs
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
        if (isOpen && activeTab === 'catalog') {
            const fetchTables = async () => {
                setLoading(true);
                setError(null);
                try {
                    const res = await fetch('/api/data/layers/tables', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setTables(data);
                    } else {
                        const errorData = await res.json();
                        setError(errorData.detail || 'Failed to fetch tables.');
                    }
                } catch (err) {
                    console.error('Network or unexpected error:', err);
                    setError('An unexpected error occurred while fetching tables.');
                } finally {
                    setLoading(false);
                }
            };
            fetchTables();
        } else {
            setTables([]);
            setSelectedTables([]);
            setUploadedGeoJSONs([]); // Reset to empty array
        }
    }, [isOpen, activeTab]);

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
                    type: 'catalog',
                    name: prettyPrintName(table.name), // Apply prettyPrintName here
                    original_name: table.name, // Keep original name for console log if needed
                    geometry_type: table.geometry_type,
                    // SRID and Feature count are not directly available for catalog layers from current backend
                    srid: 'N/A',
                    feature_count: 'N/A',
                    columns: table.columns, // Pass columns for potential info
                    description: "Data from Catalog Explorer", // Static description for now
                });
            });
            onClose();
        } else if (activeTab === 'upload') {
            if (uploadedGeoJSONs.length > 0) {
                uploadedGeoJSONs.forEach(geojsonLayer => {
                    addLayerToMap({
                        type: 'geojson',
                        name: geojsonLayer.name, // Use the name from DatasetUploadContent
                        geojson: geojsonLayer.geojson,
                        geometry_type: geojsonLayer.geometry_type,
                        srid: geojsonLayer.srid,
                        feature_count: geojsonLayer.feature_count,
                    });
                });
                onClose();
            }
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
                    tables={tables}
                    loading={loading}
                    error={error}
                    selectedTables={selectedTables}
                    onToggleSelectTable={handleToggleSelectTable}
                />
            );
            break;
        case 'upload':
            isAddDataButtonEnabled = uploadedGeoJSONs.length > 0;
            modalContent = (
                <DatasetUploadContent
                    onGeoJSONChange={setUploadedGeoJSONs}
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
                        onClick={() => setActiveTab('upload')}
                        className={`ml-4 px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200
                                    ${activeTab === 'upload' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-700 hover:text-gray-700'}`}
                    >
                        Dataset Upload
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
                            className={`px-4 py-2 rounded-md border border-green-400 transition-colors duration-200 cursor-pointer
                                        ${isAddDataButtonEnabled ? 'bg-green-500 text-white hover:bg-green-600 hover:border-green-800' : 'bg-green-300 text-gray-500 cursor-not-allowed'}`}
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
