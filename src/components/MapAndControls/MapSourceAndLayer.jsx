import { useState, useCallback } from 'react';
import MapLoadManager from './MapLoadManager';
import LayerProcessor from './LayerProcessor';
import LayerSynchronizer from './LayerSynchronizer';
import { useAuth } from '../../contexts/AuthContext';

const MapSourceAndLayer = ({ mapRef, activeMapLayers }) => {
  const { user } = useAuth();
  const [isMapReady, setIsMapReady] = useState(false);
  
  console.log('🔍 MapSourceAndLayer: Received props:', {
    hasMapRef: !!mapRef?.current,
    hasUser: !!user,
    isMapReady: isMapReady,
    activeMapLayersCount: activeMapLayers?.length || 0,
    activeMapLayers: activeMapLayers,
    activeMapLayersStringified: JSON.stringify(activeMapLayers)
  });

  const handleMapReady = useCallback((ready) => {
    setIsMapReady(ready);
  }, []);

  const layerProcessor = LayerProcessor({ mapRef });

  const handleProcessLayers = useCallback((layers, userContext, mapLoaded) => {
    layerProcessor.processLayers(layers, userContext, mapLoaded);
  }, [layerProcessor]);

  // Clear layers when user logs out
  if (!user) {
    layerProcessor.clearAllLayers();
  }

  return (
    <>
      <MapLoadManager 
        mapRef={mapRef} 
        user={user}
        onMapReady={handleMapReady}
      />
      <LayerSynchronizer 
        activeMapLayers={activeMapLayers}
        isMapLoaded={isMapReady}
        user={user}
        onProcessLayers={handleProcessLayers}
      />
    </>
  );
};

export default MapSourceAndLayer;
