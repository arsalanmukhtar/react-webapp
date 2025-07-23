// SidebarFunctions.js
// Helper functions extracted from LeftSidebar.jsx

export const toggleLayer = (setActiveLayer, setSelectedLayerForInfo, setActiveMapLayers, setIsDataExplorerModalOpen) => (layerName) => {
    setActiveLayer(prevActiveLayer => {
        const newActiveLayer = prevActiveLayer === layerName ? null : layerName;
        if (newActiveLayer !== 'layers') {
            setSelectedLayerForInfo(null);
            setActiveMapLayers(prevLayers => prevLayers.map(l => ({ ...l, isSelectedForInfo: false })));
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

export const addLayerToMap = (token, setActiveMapLayers, setActiveLayer) => async (layerData) => {
    if (!token) return;
    const payload = {
        name: layerData.name,
        original_name: layerData.original_name || layerData.name,
        layer_type: layerData.layer_type || layerData.type || 'catalog',
        geometry_type: layerData.geometry_type || null,
        is_visible: layerData.is_visible !== undefined ? layerData.is_visible : true,
        color: layerData.color || '#000000',
        srid: layerData.srid || null,
        feature_count: layerData.feature_count !== undefined ? layerData.feature_count : null
    };
    try {
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
            setActiveLayer('layers');
        }
    } catch (err) {}
};

export const toggleLayerVisibility = (activeMapLayers, token, setActiveMapLayers) => async (layerName) => {
    const layer = activeMapLayers.find(l => l.name === layerName);
    if (!layer || !token) return;
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
        }
    } catch (err) {}
};

export const handleSelectLayerForInfo = (selectedLayerForInfo, setSelectedLayerForInfo, setSelectedLayerId) => (layer) => {
    if (selectedLayerForInfo && selectedLayerForInfo.id === layer.id) {
        setSelectedLayerForInfo(null);
        setSelectedLayerId(null);
    } else {
        setSelectedLayerForInfo(layer);
        setSelectedLayerId(layer.id);
    }
};

export const handleDeleteLayer = (token, setActiveMapLayers, selectedLayerForInfo, setSelectedLayerForInfo) => async (layerId) => {
    if (!token) return;
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
        }
    } catch (err) {}
};
