import React from 'react';
import GeometryIcon from './GeometryIcon';

const toInitCap = str =>
  str
    ? str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    : '';

// Helper function to get Mapbox type from geometry type as fallback
const getMapboxType = (layer) => {
  // If mapbox_type is available, use it
  if (layer.mapbox_type) {
    return layer.mapbox_type;
  }
  
  // Otherwise, derive from geometry_type
  if (!layer.geometry_type) return 'circle';
  const geoType = layer.geometry_type.toLowerCase();
  if (geoType === 'point' || geoType === 'multipoint') return 'circle';
  if (geoType === 'linestring' || geoType === 'multilinestring') return 'line';
  if (geoType === 'polygon' || geoType === 'multipolygon') return 'fill';
  return 'circle'; // default
};

const LegendPanel = ({ activeMapLayers }) => (
  <div className="p-4 h-full overflow-y-auto text-sm">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Legend</h3>
    {activeMapLayers.length === 0 ? (
      <p className="text-gray-600">No layers added yet to the map.</p>
    ) : (
      <div className="space-y-4">
        {activeMapLayers.map(layer => {
          const mapboxType = getMapboxType(layer);
          return (
            <div key={layer.name}>
              <div className="text-gray-800 text-sm font-medium mb-1">{toInitCap(layer.name)}</div>
              <div className="flex items-center">
                <GeometryIcon type={mapboxType} color={layer.color} size={18} />
                <span className="ml-2 text-gray-600 text-xs">{toInitCap(mapboxType) || 'Unknown'}</span>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default LegendPanel;
