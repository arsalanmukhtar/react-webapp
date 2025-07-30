import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MapSourceAndLayer = ({ mapRef, activeMapLayers }) => {
  const { user } = useAuth();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const trackedLayersRef = useRef(new Map()); // Track layers by original_name
  const prevActiveLayersRef = useRef(null); // Track previous active layers for comparison

  console.log('🔍 MapSourceAndLayer: Received props:', {
    hasMapRef: !!mapRef?.current,
    hasUser: !!user,
    isMapLoaded: isMapLoaded,
    activeMapLayersCount: activeMapLayers?.length || 0,
    activeMapLayers: activeMapLayers,
    activeMapLayersStringified: JSON.stringify(activeMapLayers)
  });

  // Effect 1: Setup map load detection and handle user logout
  useEffect(() => {
    console.log('🔧 Map setup effect triggered', {
      hasMapRef: !!mapRef.current,
      hasUser: !!user,
      isMapLoaded: isMapLoaded
    });

    if (!mapRef.current) {
      console.log('⚠️ MapSourceAndLayer: No mapRef, exiting');
      return;
    }

    // Handle user logout - clear everything
    if (!user) {
      console.log('🚪 User logged out, cleaning up layers');
      setIsMapLoaded(false);
      trackedLayersRef.current.clear();
      return;
    }

    const map = mapRef.current.getMap();

    const handleMapReady = () => {
      console.log('🗺️ Map is ready for layers');
      setIsMapLoaded(true);
    };

    // Check if map is ready
    if (map.isStyleLoaded() && map.loaded()) {
      handleMapReady();
    } else {
      // Listen for map to be ready
      const onLoad = () => {
        if (map.isStyleLoaded() && map.loaded()) {
          handleMapReady();
        }
      };
      
      map.on('load', onLoad);
      map.on('styledata', onLoad);

      // Cleanup
      return () => {
        if (map && !map._removed) {
          map.off('load', onLoad);
          map.off('styledata', onLoad);
        }
      };
    }
  }, [mapRef, user]);

  // Effect 2: Process layers when map becomes ready (initial load)
  useEffect(() => {
    console.log('🎯 Initial layer processing effect triggered', {
      hasMapRef: !!mapRef.current,
      hasUser: !!user,
      isMapLoaded: isMapLoaded,
      activeMapLayersCount: activeMapLayers?.length || 0
    });

    if (!mapRef.current || !user || !isMapLoaded) {
      console.log('⚠️ MapSourceAndLayer: Not ready for layer processing', {
        hasMapRef: !!mapRef.current,
        hasUser: !!user,
        isMapLoaded
      });
      return;
    }

    // Process layers when map becomes ready
    console.log('🎯 Map just became ready, processing layers');
    processLayers();

  }, [isMapLoaded]);

  // Effect 3: Handle immediate layer changes when map is already loaded
  useEffect(() => {
    console.log('🚀 Immediate layer change effect triggered', {
      hasMapRef: !!mapRef.current,
      hasUser: !!user,
      isMapLoaded: isMapLoaded,
      activeMapLayersCount: activeMapLayers?.length || 0,
      activeMapLayersIds: activeMapLayers?.map(l => l.original_name || l.name) || []
    });

    if (!mapRef.current || !user || !isMapLoaded) {
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
    processLayers();

  }, [activeMapLayers, isMapLoaded, user]);

  const processLayers = () => {
    if (!mapRef.current || !user || !isMapLoaded) {
      console.log('⚠️ processLayers: Prerequisites not met');
      return;
    }

    const map = mapRef.current.getMap();
    const currentTrackedLayers = trackedLayersRef.current;
    const activeLayers = activeMapLayers || [];

    console.log('🎯 Processing layers:', {
      activeLayersCount: activeLayers.length,
      trackedLayersCount: currentTrackedLayers.size,
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
      const isNotTracked = !currentTrackedLayers.has(originalName);
      return shouldBeVisible && isNotTracked;
    });

    // Find layers to remove
    const layersToRemove = [];
    currentTrackedLayers.forEach((trackedLayer, originalName) => {
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
      addLayerToMap(map, layer, currentTrackedLayers);
    });

    // Remove old layers
    layersToRemove.forEach(originalName => {
      console.log(`🗑️ Removing layer: ${originalName}`);
      removeLayerFromMap(map, originalName, currentTrackedLayers);
    });

    // Update visibility for existing layers
    activeLayers.forEach(layer => {
      const originalName = layer.original_name || layer.name;
      if (currentTrackedLayers.has(originalName)) {
        updateLayerVisibility(map, layer, currentTrackedLayers);
      }
    });
  };

  // Function to add a layer to the map
  const addLayerToMap = (map, layer, trackedLayers) => {
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
      trackedLayers.set(originalName, layerData);

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
  const removeLayerFromMap = (map, originalName, trackedLayers) => {
    try {
      console.log(`🔄 Attempting to remove layer: ${originalName}`);
      
      const trackedLayer = trackedLayers.get(originalName);
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
      trackedLayers.delete(originalName);

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
