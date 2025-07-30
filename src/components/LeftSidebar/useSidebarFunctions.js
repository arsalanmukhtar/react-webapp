import {
  toggleLayer as toggleLayerFn,
  openDataExplorerModal as openDataExplorerModalFn,
  addLayerToMap as addLayerToMapFn,
  toggleLayerVisibility as toggleLayerVisibilityFn,
  handleSelectLayerForInfo as handleSelectLayerForInfoFn,
  handleDeleteLayer as handleDeleteLayerFn
} from './LeftSidebarFunctions';

/**
 * SidebarFunctionsBinder - Binds imported functions to local state/props
 */
const useSidebarFunctions = ({
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
}) => {
  const toggleLayer = toggleLayerFn(
    setActiveLayer, 
    setSelectedLayerForInfo, 
    setActiveMapLayers, 
    setIsDataExplorerModalOpen
  );
  
  const openDataExplorerModal = openDataExplorerModalFn(
    setDataExplorerModalType, 
    setIsDataExplorerModalOpen, 
    setActiveLayer
  );
  
  const addLayerToMap = addLayerToMapFn(
    token, 
    setActiveMapLayers, 
    setActiveLayer, 
    setNotification
  );
  
  const toggleLayerVisibility = toggleLayerVisibilityFn(
    activeMapLayers, 
    token, 
    setActiveMapLayers
  );
  
  const handleSelectLayerForInfo = handleSelectLayerForInfoFn(
    selectedLayerForInfo, 
    setSelectedLayerForInfo, 
    setSelectedLayerId
  );
  
  const handleDeleteLayer = handleDeleteLayerFn(
    token, 
    setActiveMapLayers, 
    selectedLayerForInfo, 
    setSelectedLayerForInfo
  );

  return {
    toggleLayer,
    openDataExplorerModal,
    addLayerToMap,
    toggleLayerVisibility,
    handleSelectLayerForInfo,
    handleDeleteLayer
  };
};

export default useSidebarFunctions;
