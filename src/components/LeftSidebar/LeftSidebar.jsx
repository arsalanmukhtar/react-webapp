import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './LeftSidebar.css';
import DataExplorerModal from './DataExplorerModal/DataExplorerModal';
import SidebarIconBar from './SidebarIconBar';
import SidebarContentRenderer from './SidebarContentRenderer';
import useCatalogData from './useCatalogData';
import useNotificationManager from './useNotificationManager';
import useSidebarFunctions from './useSidebarFunctions';

const LeftSidebar = ({ activeMapLayers, setActiveMapLayers }) => {
    const [activeLayer, setActiveLayer] = useState(null);
    const [isDataExplorerModalOpen, setIsDataExplorerModalOpen] = useState(false);
    const [dataExplorerModalType, setDataExplorerModalType] = useState(null);
    const [selectedLayerForInfo, setSelectedLayerForInfo] = useState(null);
    const [selectedLayerId, setSelectedLayerId] = useState(null);

    const { user, token } = useAuth();
    const { notification, setNotification } = useNotificationManager();
    const { catalogTables, catalogLoading, catalogError } = useCatalogData();
    
    const sidebarFunctions = useSidebarFunctions({
        setActiveLayer,
        setSelectedLayerForInfo,
        setActiveMapLayers,
        setIsDataExplorerModalOpen,
        setDataExplorerModalType,
        token,
        setNotification,
        activeMapLayers,
        selectedLayerForInfo,
        setSelectedLayerId
    });

    const isExpanded = activeLayer !== null;

    return (
        <div className="fixed top-[50px] left-0 flex z-40 h-[calc(100vh-50px)]">
            <SidebarIconBar 
                activeLayer={activeLayer} 
                toggleLayer={sidebarFunctions.toggleLayer} 
            />
            
            <div className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}> 
                <SidebarContentRenderer
                    activeLayer={activeLayer}
                    activeMapLayers={activeMapLayers}
                    selectedLayerId={selectedLayerId}
                    selectedLayerForInfo={selectedLayerForInfo}
                    toggleLayerVisibility={sidebarFunctions.toggleLayerVisibility}
                    handleSelectLayerForInfo={sidebarFunctions.handleSelectLayerForInfo}
                    handleDeleteLayer={sidebarFunctions.handleDeleteLayer}
                    openDataExplorerModal={sidebarFunctions.openDataExplorerModal}
                    notification={notification}
                />
            </div>

            <DataExplorerModal
                isOpen={isDataExplorerModalOpen}
                onClose={() => setIsDataExplorerModalOpen(false)}
                initialTab={dataExplorerModalType}
                addLayerToMap={sidebarFunctions.addLayerToMap}
                catalogTables={catalogTables}
                catalogLoading={catalogLoading}
                catalogError={catalogError}
            />
        </div>
    );
};

export default LeftSidebar;
