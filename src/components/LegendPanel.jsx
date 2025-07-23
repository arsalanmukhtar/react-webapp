import React from 'react';
import GeometryIcon from './LeftSidebar';

const LegendPanel = ({ activeMapLayers }) => (
  <div className="p-4 h-full overflow-y-auto text-sm">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Legend</h3>
    {activeMapLayers.length === 0 ? (
      <p className="text-gray-600">No layers added yet to the map.</p>
    ) : (
      <div className="space-y-4">
        {activeMapLayers.map(layer => (
          <div key={layer.name}>
            <div className="text-gray-800 text-sm font-medium mb-1">{layer.name}</div>
            <div className="flex items-center">
              <GeometryIcon type={layer.geometry_type} color={layer.color} size={18} />
              <span className="ml-2 text-gray-600 text-xs">{layer.geometry_type || 'Unknown'}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default LegendPanel;
