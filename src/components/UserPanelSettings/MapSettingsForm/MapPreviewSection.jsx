import React from 'react';
import InsetMap from '../InsetMap/InsetMap';

/**
 * MapPreviewSection - Handles the map preview with InsetMap component
 */
const MapPreviewSection = ({ 
  mapCenterLat, 
  mapCenterLon, 
  mapZoom, 
  onMapChange 
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Map Preview</label>
      <InsetMap
        initialCenter={[mapCenterLon, mapCenterLat]}
        initialZoom={mapZoom}
        onMapChange={({ latitude, longitude, zoom }) => 
          onMapChange({ lat: latitude, lng: longitude }, zoom)
        }
      />
    </div>
  );
};

export default MapPreviewSection;
