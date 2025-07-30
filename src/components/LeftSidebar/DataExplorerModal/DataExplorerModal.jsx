import React, { useState, useEffect } from 'react';
import TabNavigation from './TabNavigation';
import ActionButtons from './ActionButtons';
import ModalContentRenderer from './ModalContentRenderer';
import { prettyPrintName, capitalizeFirstLetter } from './DataUtils';
import { useAuth } from '../../../contexts/AuthContext';

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

    const modalTitle = "Dataset Control Panel";
    const showActionButtons = true;
    const isAddDataButtonEnabled = activeTab === 'catalog' ? selectedTables.length > 0 : false;

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
                    type: 'catalog',
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

                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Modal Body Content */}
                <div className="flex-1 overflow-hidden">
                    <ModalContentRenderer
                        activeTab={activeTab}
                        catalogTables={catalogTables}
                        catalogLoading={catalogLoading}
                        catalogError={catalogError}
                        selectedTables={selectedTables}
                        onToggleSelectTable={handleToggleSelectTable}
                    />
                </div>

                <ActionButtons
                    onClose={onClose}
                    onAddData={handleAddData}
                    isAddDataEnabled={isAddDataButtonEnabled}
                    showButtons={showActionButtons}
                />
            </div>
        </div>
    );
};

export default DataExplorerModal;
