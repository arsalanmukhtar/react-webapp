import React from 'react';

/**
 * CoordinateInputs - Handles latitude, longitude, and zoom input fields
 */
const CoordinateInputs = ({ 
  mapCenterLat, 
  mapCenterLon, 
  mapZoom, 
  onLatChange, 
  onLonChange, 
  onZoomChange 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
      {/* Map Center Lat */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Map Center Latitude
        </label>
        <input
          type="number"
          step="any"
          className="text-sm font-light text-gray-500 mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
          value={mapCenterLat}
          onChange={(e) => onLatChange(parseFloat(e.target.value))}
        />
      </div>

      {/* Map Center Lon */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Map Center Longitude
        </label>
        <input
          type="number"
          step="any"
          className="text-sm font-light text-gray-500 mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
          value={mapCenterLon}
          onChange={(e) => onLonChange(parseFloat(e.target.value))}
        />
      </div>

      {/* Map Zoom */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Map Zoom Level
        </label>
        <input
          type="number"
          step="0.1"
          className="text-sm font-light text-gray-500 mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:border-green-500"
          value={mapZoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};

export default CoordinateInputs;
