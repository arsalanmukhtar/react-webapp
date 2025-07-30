import React from 'react';
import MapAndControls from '../MapAndControls/MapAndControls.jsx';
import LeftSidebar from '../LeftSidebar/LeftSidebar.jsx';

/**
 * MapInterface - Renders map-related components when authenticated
 */
const MapInterface = ({ 
  isAuthenticated, 
  user, 
  isMapDashboardActive, 
  activeMapLayers, 
  setActiveMapLayers,
  activeSidebarLayer,
  setActiveSidebarLayer 
}) => {
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Map and Controls - always rendered when authenticated */}
      <MapAndControls
        user={user}
        isMapDashboardActive={isMapDashboardActive}
        activeMapLayers={activeMapLayers}
      />

      {/* Left Sidebar - only on map dashboard */}
      {isMapDashboardActive && (
        <LeftSidebar
          activeLayer={activeSidebarLayer}
          setActiveLayer={setActiveSidebarLayer}
          activeMapLayers={activeMapLayers}
          setActiveMapLayers={setActiveMapLayers}
        />
      )}
    </>
  );
};

export default MapInterface;
