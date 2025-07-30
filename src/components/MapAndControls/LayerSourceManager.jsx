import { useRef } from 'react';

/**
 * LayerSourceManager - Handles adding/removing map sources
 */
const LayerSourceManager = ({ mapRef }) => {
  const addedSources = useRef(new Set());

  const addSource = (sourceId, sourceData) => {
    if (!mapRef.current) return false;

    const map = mapRef.current.getMap();
    if (!map || !map.isStyleLoaded()) return false;

    try {
      if (!map.getSource(sourceId)) {
        console.log(`➕ Adding source: ${sourceId}`);
        map.addSource(sourceId, sourceData);
        addedSources.current.add(sourceId);
        return true;
      }
    } catch (error) {
      console.error(`❌ Error adding source ${sourceId}:`, error);
    }
    return false;
  };

  const removeSource = (sourceId) => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map || !map.isStyleLoaded()) return;

    try {
      if (map.getSource(sourceId)) {
        console.log(`➖ Removing source: ${sourceId}`);
        map.removeSource(sourceId);
        addedSources.current.delete(sourceId);
      }
    } catch (error) {
      console.error(`❌ Error removing source ${sourceId}:`, error);
    }
  };

  const hasSource = (sourceId) => {
    if (!mapRef.current) return false;
    const map = mapRef.current.getMap();
    return map && map.getSource(sourceId);
  };

  const clearAllSources = () => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map || !map.isStyleLoaded()) return;

    addedSources.current.forEach(sourceId => {
      try {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        console.error(`❌ Error removing source ${sourceId}:`, error);
      }
    });
    addedSources.current.clear();
  };

  return {
    addSource,
    removeSource,
    hasSource,
    clearAllSources,
    addedSources: addedSources.current
  };
};

export default LayerSourceManager;
