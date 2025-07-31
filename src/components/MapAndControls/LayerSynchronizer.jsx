import { useEffect, useRef } from 'react';

/**
 * LayerSynchronizer - Handles synchronization between activeMapLayers and map
 */
const LayerSynchronizer = ({ activeMapLayers, isMapLoaded, user, onProcessLayers, shouldProcessLayers }) => {
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!user || !shouldProcessLayers) {
      return;
    }

    // Process layers when allowed
    onProcessLayers(activeMapLayers, user, true);

  }, [activeMapLayers, user, onProcessLayers, shouldProcessLayers]);

  return null; // This component doesn't render anything
};

export default LayerSynchronizer;
