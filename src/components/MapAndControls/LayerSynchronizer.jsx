import { useEffect, useRef } from 'react';

/**
 * LayerSynchronizer - Handles synchronization between activeMapLayers and map
 */
const LayerSynchronizer = ({ activeMapLayers, isMapLoaded, user, onProcessLayers }) => {
  const prevActiveLayersRef = useRef(null);

  useEffect(() => {
    console.log('🔄 Layer sync effect triggered', {
      isMapLoaded: isMapLoaded,
      activeMapLayersCount: activeMapLayers?.length || 0,
      activeMapLayersIds: activeMapLayers?.map(l => l.original_name || l.name) || []
    });

    if (!user || !isMapLoaded) {
      return;
    }

    // Check if layers actually changed
    const currentLayersString = JSON.stringify(activeMapLayers?.map(l => ({ 
      name: l.original_name || l.name, 
      visible: l.is_visible !== false && l.isVisible !== false 
    })) || []);
    
    if (prevActiveLayersRef.current === currentLayersString) {
      console.log('📍 Layers unchanged, skipping processing');
      return;
    }

    console.log('📍 Layers changed, processing immediately');
    prevActiveLayersRef.current = currentLayersString;

    // Process layers immediately if map is already loaded
    onProcessLayers(activeMapLayers, user, isMapLoaded);

  }, [activeMapLayers, isMapLoaded, user, onProcessLayers]);

  return null; // This component doesn't render anything
};

export default LayerSynchronizer;
