import React from 'react';
import LayersPanel from './LayersPanel';
import LegendPanel from './LegendPanel';
import DataExplorerPanel from './DataExplorerPanel';

/**
 * SidebarContentRenderer - Renders the appropriate panel based on active layer
 */
const SidebarContentRenderer = ({ 
  activeLayer,
  activeMapLayers,
  selectedLayerId,
  selectedLayerForInfo,
  toggleLayerVisibility,
  handleSelectLayerForInfo,
  handleDeleteLayer,
  openDataExplorerModal,
  notification
}) => {
  switch (activeLayer) {
    case 'layers':
      return (
        <LayersPanel
          activeMapLayers={activeMapLayers}
          selectedLayerId={selectedLayerId}
          selectedLayerForInfo={selectedLayerForInfo}
          toggleLayerVisibility={toggleLayerVisibility}
          handleSelectLayerForInfo={handleSelectLayerForInfo}
          handleDeleteLayer={handleDeleteLayer}
        />
      );
    case 'list':
      return <LegendPanel activeMapLayers={activeMapLayers} />;
    case 'dataExplorer':
      return (
        <DataExplorerPanel 
          openDataExplorerModal={openDataExplorerModal} 
          notification={notification}
        />
      );
    default:
      return null;
  }
};

export default SidebarContentRenderer;
