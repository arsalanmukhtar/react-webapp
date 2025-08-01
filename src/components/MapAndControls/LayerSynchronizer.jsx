import { useEffect, useRef } from 'react';

/**
 * LayerSynchronizer - Handles synchronization between activeMapLayers and map
 */
const LayerSynchronizer = ({ activeMapLayers, isMapLoaded, user, onProcessLayers }) => {
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const previousLayersRef = useRef([]);

  // Deep comparison function to detect real changes
  const layersChanged = (prevLayers, currentLayers) => {
    if (!prevLayers && !currentLayers) return false;
    if (!prevLayers || !currentLayers) return true;
    if (prevLayers.length !== currentLayers.length) return true;
    
    // Check each layer for changes in key properties
    for (let i = 0; i < currentLayers.length; i++) {
      const prev = prevLayers[i];
      const curr = currentLayers[i];
      
      if (!prev || !curr) return true;
      if (prev.id !== curr.id) return true;
      if (prev.isVisible !== curr.isVisible) return true;
      if (prev.is_visible !== curr.is_visible) return true;
      if ((prev.original_name || prev.name) !== (curr.original_name || curr.name)) return true;
    }
    
    return false;
  };

  useEffect(() => {
    if (!user) {
      previousLayersRef.current = [];
      return;
    }

    // Check if layers actually changed
    if (layersChanged(previousLayersRef.current, activeMapLayers)) {
      // Process layers immediately when they change
      onProcessLayers(activeMapLayers, user, true);
      
      // Update the reference
      previousLayersRef.current = activeMapLayers ? [...activeMapLayers] : [];
    }

  }, [activeMapLayers, user, onProcessLayers]);

  return null; // This component doesn't render anything
};

export default LayerSynchronizer;
