import { useState, useCallback, useEffect } from 'react';
import MapLoadManager from './MapLoadManager';
import LayerProcessor from './LayerProcessor';
import LayerSynchronizer from './LayerSynchronizer';
import { useAuth } from '../../contexts/AuthContext';

const MapSourceAndLayer = ({ mapRef, activeMapLayers, onLayersProcessed, mapStyle, processLayerWithFilter }) => {
  const { user } = useAuth();
  const [isMapReady, setIsMapReady] = useState(false);

  const handleMapReady = useCallback((ready) => {
    setIsMapReady(ready);
  }, []);

  const layerProcessor = LayerProcessor({ mapRef, processLayerWithFilter });

  // Clear tracked layers when map style changes
  useEffect(() => {
    layerProcessor.clearAllLayers();
  }, [mapStyle, layerProcessor]);

  const handleProcessLayers = useCallback(async (layers, userContext, mapLoaded) => {
    await layerProcessor.processLayers(layers, userContext, mapLoaded);
    
    // Notify parent component that layers have been processed
    if (onLayersProcessed) {
      // If no layers to process, notify immediately
      const delay = (!layers || layers.length === 0) ? 100 : 500;
      setTimeout(() => {
        onLayersProcessed();
      }, delay);
    }
  }, [layerProcessor, onLayersProcessed]);

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
