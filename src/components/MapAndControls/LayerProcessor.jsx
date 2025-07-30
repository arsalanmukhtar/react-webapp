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
    const color = layer.color || '#007cbf';

    let paint = {};
    switch (mapboxType) {
      case 'circle':
        paint = {
          'circle-radius': 6,
          'circle-color': color
        };
        break;
      case 'line':
        paint = {
          'line-color': color,
          'line-width': 2
        };
        break;
      case 'fill':
        paint = {
          'fill-color': color,
          'fill-opacity': 0.6
        };
        break;
      default:
        paint = {
          'circle-radius': 6,
          'circle-color': color
        };
    }

    return {
      id: `${originalName}-layer`,
      type: mapboxType,
      source: `${originalName}-source`,
      'source-layer': originalName,
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
      console.log(`🔄 Attempting to add layer: ${originalName}`, {
        layer: layer,
        existing_source: !!map.getSource(sourceId),
        existing_layer: !!map.getLayer(layerId),
        mapReadyState: {
          isStyleLoaded: map.isStyleLoaded(),
          loaded: map.loaded()
        }
      });

      // Prepare layer data for tracking
      const layerData = {
        original_name: originalName,
        mapbox_type: layer.mapbox_type || getMapboxTypeFromGeometry(layer.geometry_type),
        mapbox_source: layer.mapbox_source || generateDefaultSource(originalName),
        mapbox_layer: layer.mapbox_layer || generateDefaultLayer(originalName, layer)
      };

      console.log(`🎨 Generated layer configuration for ${originalName}:`, {
        mapbox_type: layerData.mapbox_type,
        source_url: layerData.mapbox_source.tiles?.[0],
        paint: layerData.mapbox_layer.paint
      });

      // Add source if it doesn't exist
      if (!map.getSource(sourceId)) {
        console.log(`📡 Adding source: ${sourceId}`, layerData.mapbox_source);
        map.addSource(sourceId, layerData.mapbox_source);
      } else {
        console.log(`📡 Source ${sourceId} already exists, skipping`);
      }

      // Add layer if it doesn't exist
      if (!map.getLayer(layerId)) {
        console.log(`🎨 Adding layer: ${layerId}`, layerData.mapbox_layer);
        map.addLayer(layerData.mapbox_layer);
      } else {
        console.log(`🎨 Layer ${layerId} already exists, skipping`);
      }

      // Handle polygon layers (fill + stroke)
      if (layerData.mapbox_type === 'fill') {
        const fillLayerId = `${originalName}-fill`;
        const strokeLayerId = `${originalName}-stroke`;
        
        if (!map.getLayer(fillLayerId)) {
          const fillLayer = { ...layerData.mapbox_layer, id: fillLayerId, type: 'fill' };
          console.log(`🎨 Adding fill layer: ${fillLayerId}`);
          map.addLayer(fillLayer);
        }
        
        if (!map.getLayer(strokeLayerId)) {
          const strokeLayer = { 
            ...layerData.mapbox_layer, 
            id: strokeLayerId, 
            type: 'line',
            paint: {
              'line-color': layer.color || '#007cbf',
              'line-width': 2,
              'line-opacity': 0.8
            }
          };
          console.log(`🎨 Adding stroke layer: ${strokeLayerId}`);
          map.addLayer(strokeLayer);
        }
      }

      // Track the layer
      trackedLayersRef.current.set(originalName, layerData);

      console.log(`✅ Successfully added layer: ${originalName}`);

      // Force map to re-render
      map.triggerRepaint();

    } catch (error) {
      console.error(`❌ Failed to add layer ${originalName}:`, error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        layer: layer
      });
    }
  };

  // Function to remove a layer from the map
  const removeLayerFromMap = (map, originalName) => {
    try {
      console.log(`🔄 Attempting to remove layer: ${originalName}`);
      
      const trackedLayer = trackedLayersRef.current.get(originalName);
      const sourceId = `${originalName}-source`;
      const layerId = `${originalName}-layer`;
      const fillLayerId = `${originalName}-fill`;
      const strokeLayerId = `${originalName}-stroke`;

      console.log(`🗑️ Removing layer components for ${originalName}:`, {
        hasTrackedLayer: !!trackedLayer,
        layersToRemove: [layerId, fillLayerId, strokeLayerId],
        sourceToRemove: sourceId
      });

      // Remove layers
      [layerId, fillLayerId, strokeLayerId].forEach(id => {
        if (map.getLayer(id)) {
          console.log(`  🎨 Removing layer: ${id}`);
          map.removeLayer(id);
        } else {
          console.log(`  ⚠️ Layer ${id} not found on map`);
        }
      });

      // Remove source
      if (map.getSource(sourceId)) {
        console.log(`  📡 Removing source: ${sourceId}`);
        map.removeSource(sourceId);
      } else {
        console.log(`  ⚠️ Source ${sourceId} not found on map`);
      }

      // Remove from tracking
      trackedLayersRef.current.delete(originalName);

      console.log(`✅ Successfully removed layer: ${originalName}`);

    } catch (error) {
      console.error(`❌ Failed to remove layer ${originalName}:`, error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  };

  // Function to update layer visibility
  const updateLayerVisibility = (map, layer) => {
    const originalName = layer.original_name || layer.name;
    const isVisible = layer.is_visible !== false && layer.isVisible !== false;
    const visibility = isVisible ? 'visible' : 'none';
    
    const layerId = `${originalName}-layer`;
    const fillLayerId = `${originalName}-fill`;
    const strokeLayerId = `${originalName}-stroke`;

    try {
      [layerId, fillLayerId, strokeLayerId].forEach(id => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', visibility);
        }
      });
    } catch (error) {
      console.error(`Failed to update visibility for layer ${originalName}:`, error);
    }
  };

  const processLayers = (activeMapLayers, user, isMapLoaded) => {
    if (!mapRef.current || !user || !isMapLoaded) {
      console.log('⚠️ processLayers: Prerequisites not met');
      return;
    }

    const map = mapRef.current.getMap();
    const activeLayers = activeMapLayers || [];

    console.log('🎯 Processing layers:', {
      activeLayersCount: activeLayers.length,
      trackedLayersCount: trackedLayersRef.current.size,
      activeLayers: activeLayers
    });

    // Create set of currently active visible layer names
    const activeLayerNames = new Set(
      activeLayers
        .filter(layer => layer.is_visible !== false && layer.isVisible !== false)
        .map(layer => layer.original_name || layer.name)
    );

    // Find layers to add
    const layersToAdd = activeLayers.filter(layer => {
      const originalName = layer.original_name || layer.name;
      const shouldBeVisible = layer.is_visible !== false && layer.isVisible !== false;
      const isNotTracked = !trackedLayersRef.current.has(originalName);
      return shouldBeVisible && isNotTracked;
    });

    // Find layers to remove
    const layersToRemove = [];
    trackedLayersRef.current.forEach((trackedLayer, originalName) => {
      if (!activeLayerNames.has(originalName)) {
        layersToRemove.push(originalName);
      }
    });

    console.log('📊 Layer operations:', {
      toAdd: layersToAdd.length,
      toRemove: layersToRemove.length,
      currentMapLayers: map.getStyle().layers?.map(l => l.id) || [],
      currentMapSources: Object.keys(map.getStyle().sources || {})
    });

    // Add new layers
    layersToAdd.forEach(layer => {
      const originalName = layer.original_name || layer.name;
      console.log(`➕ Adding layer: ${originalName}`);
      addLayerToMap(map, layer);
    });

    // Remove old layers
    layersToRemove.forEach(originalName => {
      console.log(`🗑️ Removing layer: ${originalName}`);
      removeLayerFromMap(map, originalName);
    });

    // Update visibility for existing layers
    activeLayers.forEach(layer => {
      const originalName = layer.original_name || layer.name;
      if (trackedLayersRef.current.has(originalName)) {
        updateLayerVisibility(map, layer);
      }
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
