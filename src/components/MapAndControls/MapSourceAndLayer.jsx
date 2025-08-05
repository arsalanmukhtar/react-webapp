import { useState, useCallback, useEffect } from 'react';
import MapLoadManager from './MapLoadManager';
import useLayerProcessor from './LayerProcessor';
import LayerSynchronizer from './LayerSynchronizer';
import { useAuth } from '../../contexts/AuthContext';

const MapSourceAndLayer = ({ mapRef, activeMapLayers, onLayersProcessed, mapStyle, processLayerWithFilter }) => {
  const { user } = useAuth();
  const [isMapReady, setIsMapReady] = useState(false);

  const handleMapReady = useCallback((ready) => {
    setIsMapReady(ready);
  }, []);

  // Use the custom hook to get layer processor functions
  const layerProcessor = useLayerProcessor({ mapRef, processLayerWithFilter });

  // Clear tracked layers when map style changes
  useEffect(() => {
    layerProcessor.clearAllLayers();
  }, [mapStyle]); // Removed layerProcessor from dependency array

    const handleProcessLayers = useCallback(async (layers, userContext, mapLoaded) => {
    // Be less strict about map readiness - allow processing if map exists
    if (!isMapReady && mapRef.current) {
      // Try processing anyway if map exists, even if not fully "ready"
      const map = mapRef.current.getMap();
      if (!map || !map.isStyleLoaded()) {
        return; // Only skip if map truly doesn't exist or style not loaded
      }
    }
    
    await layerProcessor.processLayers(layers, userContext, mapLoaded);
    
    // Notify parent component that layers have been processed
    if (onLayersProcessed) {
      // Optimized timing - faster response for better UX
      const delay = (!layers || layers.length === 0) ? 50 : 150; // Reduced delays
      setTimeout(() => {
        onLayersProcessed();
      }, delay);
    }
  }, [layerProcessor, onLayersProcessed, isMapReady, mapRef]);

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
