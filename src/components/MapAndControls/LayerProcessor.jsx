import { useRef } from 'react';

/**
 * LayerProcessor - Handles the complex layer processing logic
 */
const LayerProcessor = ({ mapRef }) => {
  const trackedLayersRef = useRef(new Map());

  // Helper function to derive Mapbox type from geometry type
  const getMapboxTypeFromGeometry = (geometryType) => {
    if (!geometryType) return 'circle';
    const geoType = geometryType.toLowerCase();
    if (geoType === 'point' || geoType === 'multipoint') return 'circle';
    if (geoType === 'linestring' || geoType === 'multilinestring') return 'line';
    if (geoType === 'polygon' || geoType === 'multipolygon') return 'fill';
    return 'circle';
  };

  // Helper function to generate default source
  const generateDefaultSource = (originalName) => {
    return {
      type: 'vector',
      tiles: [`http://localhost:8000/api/tiling/mvt/${originalName}/{z}/{x}/{y}.pbf`],
      minzoom: 0,
      maxzoom: 22
    };
  };

  // Helper function to generate default layer
  const generateDefaultLayer = (originalName, layer) => {
    const mapboxType = layer.mapbox_type || getMapboxTypeFromGeometry(layer.geometry_type);
    const color = layer.color || '#000000';

    let paint = {};
    switch (mapboxType) {
      case 'circle':
        paint = {
          'circle-radius': 2,
          'circle-color': color
        };
        break;
      case 'line':
        paint = {
          'line-color': color,
          'line-width': 0.75
        };
        break;
      case 'fill':
        paint = {
          'fill-color': color,
          'fill-opacity': 0.3
        };
        break;
      default:
        paint = {
          'circle-radius': 2,
          'circle-color': color
        };
    }

    return {
      id: `${originalName}-layer`,
      type: mapboxType,
      source: `${originalName}-source`,
      'source-layer': 'features', // Use 'features' as the source-layer name
      layout: {
        visibility: 'visible'
      },
      paint: paint
    };
  };

  // Function to add a layer to the map
  const addLayerToMap = (map, layer) => {
    const originalName = layer.original_name || layer.name;
    const sourceId = `${originalName}-source`;
    const layerId = `${originalName}-layer`;

    try {
      // Use the database attributes: mapbox_source and mapbox_layer
      // Priority: 1) Database stored values, 2) Generated defaults only if no DB values
      const mapboxSource = layer.mapbox_source ? 
        (typeof layer.mapbox_source === 'string' ? JSON.parse(layer.mapbox_source) : layer.mapbox_source) : 
        generateDefaultSource(originalName);
      
      const mapboxLayer = layer.mapbox_layer ? 
        (typeof layer.mapbox_layer === 'string' ? JSON.parse(layer.mapbox_layer) : layer.mapbox_layer) : 
        generateDefaultLayer(originalName, layer);

      // Add source if it doesn't exist
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, mapboxSource);
      }

      // Add layer if it doesn't exist
      if (!map.getLayer(layerId)) {
        map.addLayer(mapboxLayer);
        
        // Prioritize frontend isVisible state over database is_visible state
        const shouldBeVisible = layer.isVisible !== undefined ? layer.isVisible === true : layer.is_visible === true;
        const initialVisibility = shouldBeVisible ? 'visible' : 'none';
        
        map.setLayoutProperty(layerId, 'visibility', initialVisibility);
      }

      // Track the layer
      trackedLayersRef.current.set(originalName, {
        original_name: originalName,
        mapbox_source: mapboxSource,
        mapbox_layer: mapboxLayer,
        is_visible: layer.is_visible,
        isVisible: layer.isVisible
      });

      // Force map to re-render
      map.triggerRepaint();

    } catch (error) {
      console.error(`❌ Failed to add layer ${originalName}:`, error);
    }
  };

  // Function to remove a layer from the map
  const removeLayerFromMap = (map, originalName) => {
    try {
      const layerId = `${originalName}-layer`;
      const sourceId = `${originalName}-source`;

      // Check if the layer exists before removing it
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }

      // Check if the source exists before removing it
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      // Remove from tracking
      trackedLayersRef.current.delete(originalName);

    } catch (error) {
      console.error(`❌ Failed to remove layer ${originalName}:`, error);
    }
  };

  // Function to update layer visibility
  const updateLayerVisibility = (map, layer) => {
    const originalName = layer.original_name || layer.name;
    const layerId = `${originalName}-layer`;
    
    // Prioritize frontend isVisible state over database is_visible state
    // If isVisible is explicitly set (not undefined), use it; otherwise fall back to is_visible
    const shouldBeVisible = layer.isVisible !== undefined ? layer.isVisible === true : layer.is_visible === true;
    
    // Convert to Mapbox visibility string
    const visibility = shouldBeVisible ? 'visible' : 'none';

    try {
      // Check if layer exists before setting visibility
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    } catch (error) {
      console.error(`❌ Failed to update visibility for layer ${originalName}:`, error);
    }
  };

  const processLayers = (activeMapLayers, user, isMapLoaded) => {
    if (!mapRef.current || !user) {
      return;
    }

    const map = mapRef.current.getMap();
    
    // Check if map style is fully loaded before processing layers
    if (!map.isStyleLoaded()) {
      // Wait for style to load and then retry
      setTimeout(() => {
        processLayers(activeMapLayers, user, isMapLoaded);
      }, 500);
      return;
    }

    const activeLayers = activeMapLayers || [];

    // Step 1: Add all layers to map (if not already added)
    activeLayers.forEach(layer => {
      const originalName = layer.original_name || layer.name;
      
      // Add layer if it doesn't exist
      if (!trackedLayersRef.current.has(originalName)) {
        addLayerToMap(map, layer);
      }
    });

    // Step 2: Get all layer IDs that should be visible
    const visibleLayerIds = activeLayers
      .filter(layer => {
        // Prioritize frontend isVisible state over database is_visible state
        // If isVisible is explicitly set (not undefined), use it; otherwise fall back to is_visible
        const shouldBeVisible = layer.isVisible !== undefined ? layer.isVisible === true : layer.is_visible === true;
        return shouldBeVisible;
      })
      .map(layer => `${layer.original_name || layer.name}-layer`);

    // Step 3: Get all existing layer IDs from tracked layers
    const allTrackedLayerIds = Array.from(trackedLayersRef.current.keys())
      .map(originalName => `${originalName}-layer`);

    // Step 4: Update visibility for all layers
    allTrackedLayerIds.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        if (visibleLayerIds.includes(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        } else {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      }
    });

    // Step 5: Remove layers that are no longer in activeMapLayers
    const currentLayerNames = new Set(activeLayers.map(layer => layer.original_name || layer.name));
    const layersToRemove = [];
    
    trackedLayersRef.current.forEach((trackedLayer, originalName) => {
      if (!currentLayerNames.has(originalName)) {
        layersToRemove.push(originalName);
      }
    });

    layersToRemove.forEach(originalName => {
      removeLayerFromMap(map, originalName);
    });
  };

  const clearAllLayers = () => {
    trackedLayersRef.current.clear();
  };

  return {
    processLayers,
    clearAllLayers,
    trackedLayers: trackedLayersRef.current
  };
};

export default LayerProcessor;
