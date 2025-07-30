import { useRef } from 'react';

/**
 * LayerRenderer - Handles adding/removing map layers
 */
const LayerRenderer = ({ mapRef }) => {
  const addedLayers = useRef(new Set());

  const addLayer = (layerConfig) => {
    if (!mapRef.current) return false;

    const map = mapRef.current.getMap();
    if (!map || !map.isStyleLoaded()) return false;

    try {
      if (!map.getLayer(layerConfig.id)) {
        console.log(`🎨 Adding layer: ${layerConfig.id}`);
        map.addLayer(layerConfig);
        addedLayers.current.add(layerConfig.id);
        return true;
      }
    } catch (error) {
      console.error(`❌ Error adding layer ${layerConfig.id}:`, error);
    }
    return false;
  };

  const removeLayer = (layerId) => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map || !map.isStyleLoaded()) return;

    try {
      if (map.getLayer(layerId)) {
        console.log(`🗑️ Removing layer: ${layerId}`);
        map.removeLayer(layerId);
        addedLayers.current.delete(layerId);
      }
    } catch (error) {
      console.error(`❌ Error removing layer ${layerId}:`, error);
    }
  };

  const hasLayer = (layerId) => {
    if (!mapRef.current) return false;
    const map = mapRef.current.getMap();
    return map && map.getLayer(layerId);
  };

  const updateLayerVisibility = (layerId, visible) => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map || !map.isStyleLoaded()) return;

    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        console.log(`👁️ Layer ${layerId} visibility: ${visible ? 'visible' : 'hidden'}`);
      }
    } catch (error) {
      console.error(`❌ Error updating visibility for layer ${layerId}:`, error);
    }
  };

  const clearAllLayers = () => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map || !map.isStyleLoaded()) return;

    addedLayers.current.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      } catch (error) {
        console.error(`❌ Error removing layer ${layerId}:`, error);
      }
    });
    addedLayers.current.clear();
  };

  return {
    addLayer,
    removeLayer,
    hasLayer,
    updateLayerVisibility,
    clearAllLayers,
    addedLayers: addedLayers.current
  };
};

export default LayerRenderer;
