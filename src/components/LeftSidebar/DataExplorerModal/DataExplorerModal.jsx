import React, { useState, useEffect } from 'react';
import CatalogExplorerContent from './CatalogExplorerContent';
import { useAuth } from '../../../contexts/AuthContext';

const DataExplorerModal = ({ isOpen, onClose, type }) => {
    const { token } = useAuth();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTables, setSelectedTables] = useState([]); // Changed to array for multiple selection

    useEffect(() => {
        if (isOpen && type === 'catalog') {
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
            // Reset selected tables when modal type changes or modal closes
            setSelectedTables([]);
        }
    }, [isOpen, type]);

    if (!isOpen) return null;

    let modalTitle = "Data Explorer";
    let modalContent;
    let showActionButtons = false;

    // Function to toggle selection of a table
    const handleToggleSelectTable = (tableToToggle) => {
        setSelectedTables(prevSelectedTables => {
            if (prevSelectedTables.some(table => table.name === tableToToggle.name)) {
                // If already selected, remove it
                return prevSelectedTables.filter(table => table.name !== tableToToggle.name);
            } else {
                // If not selected, add it
                return [...prevSelectedTables, tableToToggle];
            }
        });
    };

    const handleAddData = () => {
        if (selectedTables.length > 0) {
            const selectedTableNames = selectedTables.map(table => table.name);
            console.log("Adding data for tables:", JSON.stringify(selectedTableNames, null, 2));
            onClose(); // Close modal after action
        }
    };

    switch (type) {
        case 'catalog':
            modalTitle = "Catalog Explorer";
            showActionButtons = true;
            modalContent = (
                <CatalogExplorerContent
                    tables={tables}
                    loading={loading}
                    error={error}
                    selectedTables={selectedTables} // Pass selected tables array
                    onToggleSelectTable={handleToggleSelectTable} // Pass toggle function
                />
            );
            break;
        case 'upload':
            modalTitle = "Dataset Upload";
            modalContent = <p className="text-gray-600 text-sm">Upload your own datasets here.</p>;
            break;
        case 'external':
            modalTitle = "External Dataset Link";
            modalContent = <p className="text-gray-600 text-sm">Link to external datasets.</p>;
            break;
        default:
            modalContent = <p className="text-gray-600 text-sm">This is the content of your Data Explorer modal. More features will be added here.</p>;
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
                {/* Modal Body Content */}
                <div className="flex-1 overflow-hidden">
                    {modalContent}
                </div>

                {/* Action Buttons at the bottom right */}
                {showActionButtons && (
                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200" // Updated hover style
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddData}
                            disabled={selectedTables.length === 0} // Disable if no tables are selected
                            className={`px-4 py-2 rounded-md border border-green-400 transition-colors duration-200
                                        ${selectedTables.length > 0 ? 'bg-green-500 text-white hover:bg-green-600 hover:border-green-800' : 'bg-green-300 text-gray-500 cursor-not-allowed'}`}
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
