import { useEffect, useRef, useMemo } from 'react';

/**
 * LayerSynchronizer - Handles synchronization between activeMapLayers and map
 */
const LayerSynchronizer = ({ activeMapLayers, isMapLoaded, user, onProcessLayers }) => {
  const debounceTimeoutRef = useRef(null);
  const previousUserIdRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Create a stable key from layer IDs for dependency tracking
  const layersKey = useMemo(() => {
    return activeMapLayers ? 
      activeMapLayers.map(layer => `${layer.id}-${layer.original_name || layer.name}`).join(',') : 
      '';
  }, [activeMapLayers]);

  useEffect(() => {
    if (!user) {
      previousUserIdRef.current = null;
      return;
    }

    // Check if this is a new user login
    const isNewUserLogin = previousUserIdRef.current !== user.id;
    
    // Clear any existing timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    const processLayersWhenReady = () => {
      onProcessLayers(activeMapLayers, user, true);
    };

    if (isNewUserLogin) {
      // For new user login, wait for map to be ready
      if (isMapLoaded) {
        // Map is already ready, process immediately with minimal delay
        debounceTimeoutRef.current = setTimeout(processLayersWhenReady, 50); // Reduced from 200ms
      } else {
        // Map not ready yet, set up retry mechanism with more aggressive checking
        const checkMapReady = () => {
          if (isMapLoaded) {
            processLayersWhenReady();
          } else {
            retryTimeoutRef.current = setTimeout(checkMapReady, 50); // Reduced from 100ms
          }
        };
        retryTimeoutRef.current = setTimeout(checkMapReady, 50); // Reduced from 100ms
      }
    } else {
      // For layer changes, process immediately (map should already be ready)
      debounceTimeoutRef.current = setTimeout(processLayersWhenReady, 25); // Reduced from 50ms
    }

    // Update the user reference
    previousUserIdRef.current = user.id;

    // Cleanup timeouts on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };

  }, [layersKey, user, onProcessLayers, isMapLoaded]);

  return null; // This component doesn't render anything
};

export default LayerSynchronizer;
