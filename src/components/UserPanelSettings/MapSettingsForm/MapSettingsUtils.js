// Define Maplibre-compatible styles for dropdown
export const MapboxStyles = [
    { name: "Mapbox Streets", url: "mapbox://styles/mapbox/streets-v11" },
    { name: "Mapbox Outdoors", url: "mapbox://styles/mapbox/outdoors-v11" },
    { name: "Mapbox Light", url: "mapbox://styles/mapbox/light-v10" },
    { name: "Mapbox Dark", url: "mapbox://styles/mapbox/dark-v10" },
    { name: "Mapbox Satellite", url: "mapbox://styles/mapbox/satellite-v9" },
    { name: "Mapbox Satellite Streets", url: "mapbox://styles/mapbox/satellite-streets-v11" },
];

// Validation functions
export const validateCoordinates = (lat, lon, zoom) => {
    if (isNaN(lat) || lat < -90 || lat > 90) {
        return { isValid: false, message: 'Latitude must be a number between -90 and 90.' };
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
        return { isValid: false, message: 'Longitude must be a number between -180 and 180.' };
    }
    if (isNaN(zoom) || zoom < 0 || zoom > 22) {
        return { isValid: false, message: 'Zoom must be a number between 0 and 22.' };
    }
    return { isValid: true };
};

// Function to detect changes in map settings
export const detectChanges = (current, original) => {
    const updates = {};
    
    if (current.lat !== original.map_center_lat) {
        updates.map_center_lat = current.lat;
    }
    if (current.lon !== original.map_center_lon) {
        updates.map_center_lon = current.lon;
    }
    if (current.zoom !== original.map_zoom) {
        updates.map_zoom = current.zoom;
    }
    if (current.theme !== original.map_theme) {
        updates.map_theme = current.theme;
    }
    
    return updates;
};
