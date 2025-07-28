import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './LeftSidebar.css';
import DataExplorerModal from './DataExplorerModal/DataExplorerModal';

import SidebarIconBar from './SidebarIconBar';
import LayersPanel from './LayersPanel';
import LegendPanel from './LegendPanel';
import DataExplorerPanel from './DataExplorerPanel';
// Add notification state management
import {
  toggleLayer as toggleLayerFn,
  openDataExplorerModal as openDataExplorerModalFn,
  addLayerToMap as addLayerToMapFn,
  toggleLayerVisibility as toggleLayerVisibilityFn,
  handleSelectLayerForInfo as handleSelectLayerForInfoFn,
  handleDeleteLayer as handleDeleteLayerFn
} from './LeftSidebarFunctions';


import GeometryIcon from './GeometryIcon';

const LeftSidebar = ({ activeMapLayers, setActiveMapLayers }) => {

    const [activeLayer, setActiveLayer] = useState(null);
    const [isDataExplorerModalOpen, setIsDataExplorerModalOpen] = useState(false);
    const [dataExplorerModalType, setDataExplorerModalType] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '', visible: false });

    const { user, token } = useAuth();
    const [selectedLayerForInfo, setSelectedLayerForInfo] = useState(null); // State for info panel
    const [selectedLayerId, setSelectedLayerId] = useState(null); // State for highlighted layer

    // Catalog tables state
    const [catalogTables, setCatalogTables] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState(null);

    // Fetch catalog tables only once on mount
    // Auto-hide notifications after 3 seconds
    useEffect(() => {
        let timer;
        if (notification.visible) {
            timer = setTimeout(() => {
                setNotification(prev => ({ ...prev, visible: false, message: '' }));
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [notification.visible]);

    useEffect(() => {
        const fetchTables = async () => {
            setCatalogLoading(true);
            setCatalogError(null);
            try {
                const tablesRes = await fetch('/api/data/layers/tables', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!tablesRes.ok) {
                    const errorData = await tablesRes.json();
                    setCatalogError(errorData.detail || 'Failed to fetch tables.');
                    setCatalogLoading(false);
                    return;
                }
                const initialTables = await tablesRes.json();
                setCatalogTables(initialTables);
            } catch (err) {
                console.error('Network or unexpected error:', err);
                setCatalogError('An unexpected error occurred while fetching tables.');
            } finally {
                setCatalogLoading(false);
            }
        };
        fetchTables();
    }, []);

    // Bind imported helper functions to local state/props
    const toggleLayer = toggleLayerFn(setActiveLayer, setSelectedLayerForInfo, setActiveMapLayers, setIsDataExplorerModalOpen);
    const openDataExplorerModal = openDataExplorerModalFn(setDataExplorerModalType, setIsDataExplorerModalOpen, setActiveLayer);
    const addLayerToMap = addLayerToMapFn(token, setActiveMapLayers, setActiveLayer, setNotification);
    const toggleLayerVisibility = toggleLayerVisibilityFn(activeMapLayers, token, setActiveMapLayers);
    const handleSelectLayerForInfo = handleSelectLayerForInfoFn(selectedLayerForInfo, setSelectedLayerForInfo, setSelectedLayerId);
    const handleDeleteLayer = handleDeleteLayerFn(token, setActiveMapLayers, selectedLayerForInfo, setSelectedLayerForInfo);


    const isExpanded = activeLayer !== null;

    return (
        <div className="fixed top-[50px] left-0 flex z-40 h-[calc(100vh-50px)]">
            <SidebarIconBar activeLayer={activeLayer} toggleLayer={toggleLayer} />
            <div className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}> 
                {activeLayer === 'layers' && (
                    <LayersPanel
                        activeMapLayers={activeMapLayers}
                        selectedLayerId={selectedLayerId}
                        selectedLayerForInfo={selectedLayerForInfo}
                        toggleLayerVisibility={toggleLayerVisibility}
                        handleSelectLayerForInfo={handleSelectLayerForInfo}
                        handleDeleteLayer={handleDeleteLayer}
                    />
                )}
                {activeLayer === 'list' && (
                    <LegendPanel activeMapLayers={activeMapLayers} />
                )}
                {activeLayer === 'dataExplorer' && (
                    <DataExplorerPanel 
                        openDataExplorerModal={openDataExplorerModal} 
                        notification={notification}
                    />
                )}
            </div>
            <DataExplorerModal
                isOpen={isDataExplorerModalOpen}
                onClose={() => setIsDataExplorerModalOpen(false)}
                initialTab={dataExplorerModalType}
                addLayerToMap={addLayerToMap}
                catalogTables={catalogTables}
                catalogLoading={catalogLoading}
                catalogError={catalogError}
            />
        </div>
    );
};

export default LeftSidebar;
