// SidebarFunctions.js
// Helper functions extracted from LeftSidebar.jsx

export const toggleLayer = (setActiveLayer, setSelectedLayerForInfo, setActiveMapLayers, setIsDataExplorerModalOpen) => (layerName) => {
    setActiveLayer(prevActiveLayer => {
        const newActiveLayer = prevActiveLayer === layerName ? null : layerName;
        if (newActiveLayer !== 'layers') {
            setSelectedLayerForInfo(null);
        }
        setIsDataExplorerModalOpen(false);
        return newActiveLayer;
    });
};

export const openDataExplorerModal = (setDataExplorerModalType, setIsDataExplorerModalOpen, setActiveLayer) => (type) => {
    setDataExplorerModalType(type);
    setIsDataExplorerModalOpen(true);
    setActiveLayer('dataExplorer');
};

export const addLayerToMap = (token, setActiveMapLayers, setActiveLayer, setNotification) => async (layerData) => {
    if (!token) return;
    
    // Helper function to determine Mapbox layer type from geometry type
    const getMapboxLayerType = (geometryType) => {
        if (!geometryType) return 'circle';
        const geoType = geometryType.toLowerCase();
        if (geoType === 'point' || geoType === 'multipoint') return 'circle';
        if (geoType === 'linestring' || geoType === 'multilinestring') return 'line';
        if (geoType === 'polygon' || geoType === 'multipolygon') return 'fill';
        return 'circle'; // default
    };

    // Helper function to generate paint properties based on layer type
    const generatePaintProperties = (layerType, color) => {
        switch (layerType) {
            case 'circle':
                return {
                    'circle-radius': 6,
                    'circle-color': color
                };
            case 'line':
                return {
                    'line-color': color,
                    'line-width': 2
                };
            case 'fill':
                return {
                    'fill-color': color,
                    'fill-opacity': 0.3
                };
            default:
                return {
                    'circle-radius': 6,
                    'circle-color': color
                };
        }
    };

    const originalName = layerData.original_name || layerData.name;
    const color = layerData.color || '#007cbf';
    const mapboxLayerType = getMapboxLayerType(layerData.geometry_type);

    // Generate source definition
    const sourceDefinition = {
        type: 'vector',
        tiles: [
            `http://localhost:8000/api/tiling/mvt/${originalName}/{z}/{x}/{y}.pbf`
        ],
        minzoom: 0,
        maxzoom: 22
    };

    // Generate layer definition
    const layerDefinition = {
        id: `${originalName}-layer`,
        type: mapboxLayerType,
        source: `${originalName}-source`,
        'source-layer': 'features',
        paint: generatePaintProperties(mapboxLayerType, color)
    };

    const payload = {
        name: layerData.name,
        original_name: originalName,
        layer_type: layerData.layer_type || layerData.type || 'catalog', // Keep existing layer_type logic
        geometry_type: layerData.geometry_type || null,
        is_visible: layerData.is_visible !== undefined ? layerData.is_visible : true,
        color: color,
        srid: layerData.srid || null,
        feature_count: layerData.feature_count !== undefined ? layerData.feature_count : null,
        mapbox_type: mapboxLayerType,
        mapbox_source: sourceDefinition,
        mapbox_layer: layerDefinition
    };
    try {
        // First check if layer exists
        const checkRes = await fetch('/api/data/users/me/map_layers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (checkRes.ok) {
            const existingLayers = await checkRes.json();
            const duplicateLayer = existingLayers.find(layer => layer.original_name === payload.original_name);
            
            if (duplicateLayer) {
                setNotification?.({
                    message: `Layer already exists`,
                    type: 'error',
                    visible: true
                });
                setActiveLayer('dataExplorer'); // Switch to dataExplorer to show the notification
                return;
            }
        }

        const res = await fetch('/api/data/users/me/map_layers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            const newLayer = await res.json();
            setActiveMapLayers(prevLayers => [...prevLayers, { ...newLayer, isVisible: newLayer.is_visible }]);
            setActiveLayer('layers'); // Switch to layers panel to show the newly added layer
            setNotification?.({
                message: "Layer added successfully",
                type: 'success',
                visible: true
            });
        } else {
            const errorData = await res.json();
            setActiveLayer('dataExplorer'); // Switch to dataExplorer to show the notification
            setNotification?.({
                message: errorData.detail || 'Failed to add layer',
                type: 'error',
                visible: true
            });
        }
    } catch (err) {
        console.error('Error adding layer:', err);
        setActiveLayer('dataExplorer'); // Switch to dataExplorer to show the notification
        setNotification?.({
            message: 'An unexpected error occurred while adding the layer',
            type: 'error',
            visible: true
        });
    }
};

export const toggleLayerVisibility = (activeMapLayers, token, setActiveMapLayers) => async (layerName) => {
    const layer = activeMapLayers.find(l => l.name === layerName);
    if (!layer || !token) return;
    
    console.log(`👆 LayerItem interaction: Toggling visibility for ${layer.original_name || layer.name}`);
    
    try {
        const res = await fetch(`/api/data/users/me/map_layers/${layer.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_visible: !layer.isVisible })
        });
        if (res.ok) {
            setActiveMapLayers(prevLayers => prevLayers.map(l => l.id === layer.id ? { ...l, isVisible: !l.isVisible } : l));
            console.log(`👁️ Layer visibility updated: ${layer.original_name || layer.name} -> ${!layer.isVisible ? 'visible' : 'hidden'}`);
        }
    } catch (err) {
        console.error('Failed to toggle layer visibility:', err);
    }
};

export const handleSelectLayerForInfo = (selectedLayerForInfo, setSelectedLayerForInfo, setSelectedLayerId) => (layer) => {
    console.log(`👆 LayerItem interaction: Selecting layer for info - ${layer.original_name || layer.name}`);
    
    if (selectedLayerForInfo && selectedLayerForInfo.id === layer.id) {
        setSelectedLayerForInfo(null);
        setSelectedLayerId(null);
        console.log(`ℹ️ Layer info deselected: ${layer.original_name || layer.name}`);
    } else {
        setSelectedLayerForInfo(layer);
        setSelectedLayerId(layer.id);
        console.log(`ℹ️ Layer info selected: ${layer.original_name || layer.name}`);
    }
};

export const handleDeleteLayer = (token, setActiveMapLayers, selectedLayerForInfo, setSelectedLayerForInfo) => async (layerId) => {
    if (!token) return;
    
    // First, get the current activeMapLayers to find the layer being deleted
    let layerToDelete = null;
    setActiveMapLayers(prevLayers => {
        layerToDelete = prevLayers.find(l => l.id === layerId);
        return prevLayers; // Don't modify yet, just find the layer
    });
    
    // Wait a moment to ensure we have the layer data
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Create a complete snapshot of the layer information
    const layerSnapshot = {
        id: layerToDelete?.id,
        name: layerToDelete?.name,
        original_name: layerToDelete?.original_name,
        mapbox_type: layerToDelete?.mapbox_type,
        complete_data: layerToDelete
    };
    
    const displayName = layerSnapshot.original_name || layerSnapshot.name;
    
    console.log(`👆 LayerItem interaction: Deleting layer - ${displayName} (ID: ${layerSnapshot.id})`);
    console.log(`🗑️ Layer snapshot before deletion:`, layerSnapshot);
    console.log(`🗑️ About to remove: ${displayName}-layer and ${displayName}-source`);
    
    try {
        const res = await fetch(`/api/data/users/me/map_layers/${layerId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setActiveMapLayers(prevLayers => prevLayers.filter(l => l.id !== layerId));
            if (selectedLayerForInfo && selectedLayerForInfo.id === layerId) {
                setSelectedLayerForInfo(null);
            }
            console.log(`🗑️ Layer deleted from database: ${displayName}-layer and ${displayName}-source (ID: ${layerSnapshot.id}, Name: ${layerSnapshot.name})`);
        }
    } catch (err) {
        console.error('Failed to delete layer:', err);
    }
};
