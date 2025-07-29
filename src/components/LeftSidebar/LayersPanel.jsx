import React from 'react';
import LayerItem from './LayerItem';
import { FiInfo, FiMapPin, FiLayers as FiFeature } from 'react-icons/fi';

const LayersPanel = ({
  activeMapLayers,
  selectedLayerId,
  selectedLayerForInfo,
  toggleLayerVisibility,
  handleSelectLayerForInfo,
  handleDeleteLayer
}) => {

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Layers</h3>
      <div className="flex-1 overflow-y-auto pr-2">
        {activeMapLayers.length === 0 ? (
          <p className="text-gray-600">No layers added yet.</p>
        ) : (
          <div className="space-y-2">
            {activeMapLayers.map(layer => (
              <div key={layer.id}>
                <LayerItem
                  layer={layer}
                  isSelected={selectedLayerId === layer.id}
                  onToggleVisibility={toggleLayerVisibility}
                  onSelectLayerForInfo={handleSelectLayerForInfo}
                  onDeleteLayer={handleDeleteLayer}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Layer Info Panel at the bottom */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Layer Info</h4>
        {selectedLayerForInfo ? (
          <div className="space-y-1 text-xs">
            <p className="font-medium text-green-500">{selectedLayerForInfo.name}</p>
            <ul className="space-y-1">
              {/* <li className="flex items-center">
                <FiInfo className="mr-2 text-gray-500" size={12} /> Source: {selectedLayerForInfo.type === 'catalog' ? 'Catalog Layer' : 'GeoJSON Upload'}
              </li> */}
              <li className="flex items-center">
                <FiMapPin className="mr-2 text-gray-500" size={12} /> Geometry: {selectedLayerForInfo.geometry_type || 'N/A'}
              </li>
              <li className="flex items-center">
                <FiInfo className="mr-2 text-gray-500" size={12} /> SRID: {selectedLayerForInfo.srid || 'N/A'}
              </li>
              <li className="flex items-center">
                <FiFeature className="mr-2 text-gray-500" size={12} /> Features: {selectedLayerForInfo.feature_count !== undefined ? selectedLayerForInfo.feature_count : 'N/A'}
              </li>
            </ul>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Select a layer to view its details.</p>
        )}
      </div>

    </div>
  );
};

export default LayersPanel;
