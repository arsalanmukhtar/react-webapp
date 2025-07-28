import { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MapSourceAndLayer = ({ mapRef, activeMapLayers }) => {
  const { user } = useAuth();
  const isMapLoadedRef = useRef(false);
  const trackedLayersRef = useRef(new Map()); // Track layers by original_name

  // Mount once when user logs in - setup map load listener
  useEffect(() => {
    if (!mapRef.current || !user) return;

    const map = mapRef.current.getMap(); // Get the underlying Mapbox GL JS map instance

    const handleMapLoad = () => {
      isMapLoadedRef.current = true;
    };

    // Check if map is already loaded
    if (map.isStyleLoaded()) {
      handleMapLoad();
    } else {
      map.on('load', handleMapLoad);
    }

    // Cleanup on unmount (user logout)
    return () => {
      if (map && !map._removed) {
        map.off('load', handleMapLoad);
      }
      isMapLoadedRef.current = false;
      trackedLayersRef.current.clear();
    };
  }, [mapRef, user]);

  // Handle layer changes when LayersPanel items change
  useEffect(() => {
    if (!mapRef.current || !isMapLoadedRef.current || !user) return;

    const map = mapRef.current.getMap(); // Get the underlying Mapbox GL JS map instance
    const currentTrackedLayers = trackedLayersRef.current;

    // Check if this is initial load (no layers tracked yet but activeMapLayers exist)
    const isInitialLoad = currentTrackedLayers.size === 0 && activeMapLayers.length > 0;

    // Create a set of currently active layer original_names
    const activeLayerNames = new Set(
      activeMapLayers
        .filter(layer => layer.is_visible !== false && layer.isVisible !== false)
        .map(layer => layer.original_name || layer.name)
    );

    // Find layers to add (in activeMapLayers but not in trackedLayers)
    const layersToAdd = activeMapLayers.filter(layer => {
      const originalName = layer.original_name || layer.name;
      return (layer.is_visible !== false && layer.isVisible !== false) && 
             !currentTrackedLayers.has(originalName);
    });

    // Log initial load vs new additions
    if (isInitialLoad && layersToAdd.length > 0) {
      console.log(`🚀 Login detected - Loading ${layersToAdd.length} existing layers from database:`);
    } else if (layersToAdd.length > 0) {
      console.log(`📦 New layers being added from catalog: ${layersToAdd.length}`);
    }

    // Find layers to remove (in trackedLayers but not in activeMapLayers or not visible)
    const layersToRemove = [];
    currentTrackedLayers.forEach((trackedLayer, originalName) => {
      if (!activeLayerNames.has(originalName)) {
        layersToRemove.push({ originalName, ...trackedLayer });
      }
    });

    // Add new layers
    layersToAdd.forEach(layer => {
      addLayerToMap(map, layer, currentTrackedLayers);
    });

    // Remove old layers
    layersToRemove.forEach(layer => {
      removeLayerFromMap(map, layer.originalName, currentTrackedLayers);
    });

    // Handle visibility changes for existing layers
    activeMapLayers.forEach(layer => {
      const originalName = layer.original_name || layer.name;
      if (currentTrackedLayers.has(originalName)) {
        updateLayerVisibility(map, layer, currentTrackedLayers);
      }
    });

  }, [activeMapLayers, mapRef, user]);

  // Function to add a layer to the map
  const addLayerToMap = (map, layer, trackedLayers) => {
    const originalName = layer.original_name || layer.name;
    const sourceId = `${originalName}-source`;
    const layerId = `${originalName}-layer`;

    try {
      // Prepare layer data for tracking
      const layerData = {
        original_name: originalName,
        mapbox_type: layer.mapbox_type || getMapboxTypeFromGeometry(layer.geometry_type),
        mapbox_source: layer.mapbox_source || generateDefaultSource(originalName),
        mapbox_layer: layer.mapbox_layer || generateDefaultLayer(originalName, layer)
      };

      // Add source if it doesn't exist
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, layerData.mapbox_source);
      }

      // Add layer if it doesn't exist
      if (!map.getLayer(layerId)) {
        map.addLayer(layerData.mapbox_layer);
      }

      // Handle polygon layers (fill + stroke)
      if (layerData.mapbox_type === 'fill') {
        const fillLayerId = `${originalName}-fill`;
        const strokeLayerId = `${originalName}-stroke`;
        
        if (!map.getLayer(fillLayerId)) {
          const fillLayer = { ...layerData.mapbox_layer, id: fillLayerId, type: 'fill' };
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
          map.addLayer(strokeLayer);
        }
      }

      // Track the layer
      trackedLayers.set(originalName, layerData);

      // Enhanced logging for layer addition - show mapbox_source and mapbox_layer details
      console.log(`➕ Layer added: ${originalName}-layer, ${originalName}-source`);
      console.log(`📊 Layer Details:`, {
        original_name: layerData.original_name,
        mapbox_type: layerData.mapbox_type
      });
      console.log(`🗂️ Mapbox Source:`, layerData.mapbox_source);
      console.log(`🎨 Mapbox Layer:`, layerData.mapbox_layer);

    } catch (error) {
      console.error(`Failed to add layer ${originalName}:`, error);
    }
  };

  // Function to remove a layer from the map
  const removeLayerFromMap = (map, originalName, trackedLayers) => {
    try {
      const trackedLayer = trackedLayers.get(originalName);
      const sourceId = `${originalName}-source`;
      const layerId = `${originalName}-layer`;
      const fillLayerId = `${originalName}-fill`;
      const strokeLayerId = `${originalName}-stroke`;

      // Remove layers
      [layerId, fillLayerId, strokeLayerId].forEach(id => {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      });

      // Remove source
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      // Remove from tracking
      trackedLayers.delete(originalName);

      // Simple log for layer removal - only what you requested
      console.log(`🗑️ Layer removed: ${originalName}-layer, ${originalName}-source`, {
        original_name: originalName,
        mapbox_type: trackedLayer?.mapbox_type,
        mapbox_source: trackedLayer?.mapbox_source,
        mapbox_layer: trackedLayer?.mapbox_layer
      });

    } catch (error) {
      console.error(`Failed to remove layer ${originalName}:`, error);
    }
  };

  // Function to update layer visibility
  const updateLayerVisibility = (map, layer, trackedLayers) => {
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

  // This component doesn't render anything - it's just for managing map layers
  return null;
};

export default MapSourceAndLayer;
