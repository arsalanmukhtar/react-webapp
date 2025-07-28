import React, { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { TiLocationArrowOutline } from 'react-icons/ti';
import { useAuth } from '../../contexts/AuthContext';
import MapSourceAndLayer from './MapSourceAndLayer';

const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (!MapboxAccessToken) {
    console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

const MapAndControls = ({ user, isMapDashboardActive, activeMapLayers }) => {
    const { token } = useAuth(); // Get authentication token
    const mapRef = useRef(null);
    const [userLayers, setUserLayers] = useState([]);

    const defaultMapCenterLon = -122.4;
    const defaultMapCenterLat = 37.8;
    const defaultMapZoom = 14;
    const defaultMapTheme = "mapbox://styles/mapbox/streets-v12";

    const [viewState, setViewState] = useState({
        longitude: user?.map_center_lon || defaultMapCenterLon,
        latitude: user?.map_center_lat || defaultMapCenterLat,
        zoom: user?.map_zoom || defaultMapZoom,
        bearing: 0,
        pitch: 0,
    });
    const [mapStyle, setMapStyle] = useState(user?.map_theme || defaultMapTheme);

    useEffect(() => {
        if (user) {
            setViewState(prev => ({
                ...prev,
                longitude: user.map_center_lon || defaultMapCenterLon,
                latitude: user.map_center_lat || defaultMapCenterLat,
                zoom: user.map_zoom || defaultMapZoom,
            }));
            setMapStyle(user.map_theme || defaultMapTheme);
        }
    }, [user]);

    // Fetch user layers when user and token are available
    useEffect(() => {
        const fetchUserLayers = async () => {
            if (!user?.id || !token) {
                console.log('🔐 MapAndControls: No user ID or token available');
                return;
            }

            try {
                // console.log(`🔐 MapAndControls: Fetching layers for user ${user.id}`);
                const response = await fetch('/api/data/users/me/map_layers', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const layers = await response.json();
                    // console.log(`📋 MapAndControls: Fetched ${layers.length} layers:`, layers);
                    setUserLayers(layers);
                } else {
                    console.error('Failed to fetch user layers:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error fetching user layers:', error);
            }
        };

        fetchUserLayers();
    }, [user?.id, token]);

    // Add layers to map when map loads and layers are available
    useEffect(() => {
        if (!mapRef.current || userLayers.length === 0) return;

        const map = mapRef.current.getMap();

        const addLayersToMap = () => {
            // console.log(`🗺️ MapAndControls: Adding ${userLayers.length} layers to map`);

            userLayers.forEach((layer) => {
                const { original_name, mapbox_source, mapbox_layer, is_visible } = layer;
                const sourceId = `${original_name}-source`;
                const layerId = `${original_name}-layer`;

                // console.log(`🔍 Processing layer: ${original_name}`, {
                //     has_mapbox_source: !!mapbox_source,
                //     has_mapbox_layer: !!mapbox_layer,
                //     is_visible: is_visible,
                //     layer_full_data: layer
                // });

                try {
                    // Add source if it doesn't exist and mapbox_source is available
                    if (mapbox_source && !map.getSource(sourceId)) {
                        // console.log(`➕ Adding source: ${sourceId}`, mapbox_source);
                        map.addSource(sourceId, mapbox_source);

                        // Verify source was added
                        const addedSource = map.getSource(sourceId);
                        // console.log(`✓ Source verification: ${sourceId}`, !!addedSource);

                        // Check if it's a vector source and log tile URLs
                        if (mapbox_source.type === 'vector' && mapbox_source.tiles) {
                            // console.log(`🌐 Vector tiles URLs for ${sourceId}:`, mapbox_source.tiles);

                            // Test a sample tile URL at current zoom/center
                            const currentZoom = Math.floor(map.getZoom());
                            const center = map.getCenter();
                            const sampleTileUrl = mapbox_source.tiles[0]
                                .replace('{z}', currentZoom)
                                .replace('{x}', Math.floor((center.lng + 180) / 360 * Math.pow(2, currentZoom)))
                                .replace('{y}', Math.floor((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, currentZoom)));
                            // console.log(`🔗 Sample tile URL: ${sampleTileUrl}`);
                        }
                    }

                    // Add layer if it doesn't exist and mapbox_layer is available
                    if (mapbox_layer && !map.getLayer(layerId)) {
                        // console.log(`➕ Adding layer: ${layerId}`, mapbox_layer);
                        map.addLayer(mapbox_layer);

                        // Verify layer was added
                        const addedLayer = map.getLayer(layerId);
                        // console.log(`✓ Layer verification: ${layerId}`, !!addedLayer);

                        // Check layer visibility and properties
                        if (addedLayer) {
                            const visibility = map.getLayoutProperty(layerId, 'visibility');
                            // console.log(`👁️ Layer visibility: ${layerId} = ${visibility}`);
                            // console.log(`🎨 Layer paint properties:`, addedLayer.paint);
                            // console.log(`📋 Layer layout properties:`, addedLayer.layout);

                            // Force visibility if layer should be visible
                            if (is_visible !== false) {
                                map.setLayoutProperty(layerId, 'visibility', 'visible');
                                // console.log(`🔄 Forced visibility to 'visible' for: ${layerId}`);
                            }
                        }
                    }

                    // console.log(`✅ Successfully processed: ${original_name}-source and ${original_name}-layer`);
                } catch (error) {
                    console.error(`❌ Failed to add layer ${original_name}:`, error);
                }
            });

            // Final verification - list all sources and layers on the map
            // console.log(`🔍 Final map state check:`);
            // console.log(`Map sources:`, Object.keys(map.getStyle().sources || {}));
            // console.log(`Map layers:`, (map.getStyle().layers || []).map(l => l.id));

            // Add source event listeners to track tile loading
            userLayers.forEach((layer) => {
                const sourceId = `${layer.original_name}-source`;
                const source = map.getSource(sourceId);

                // if (source) {
                //     // Listen for source data events
                //     map.on('sourcedata', (e) => {
                //         if (e.sourceId === sourceId) {
                //             console.log(`📡 Source data event for ${sourceId}:`, {
                //                 isSourceLoaded: e.isSourceLoaded,
                //                 sourceDataType: e.sourceDataType,
                //                 coord: e.coord,
                //                 tile: e.tile
                //             });
                //         }
                //     });

                //     // Listen for source errors
                //     map.on('error', (e) => {
                //         if (e.sourceId === sourceId) {
                //             console.error(`❌ Source error for ${sourceId}:`, e.error);
                //         }
                //     });
                // }
            });
        };

        // Check if map is loaded, if not wait for load event
        if (map.isStyleLoaded() && map.loaded()) {
            addLayersToMap();
        } else {
            map.on('load', addLayersToMap);
            // Cleanup function
            return () => {
                if (map && !map._removed) {
                    map.off('load', addLayersToMap);
                }
            };
        }
    }, [userLayers]);

    const handleZoomIn = () => {
        if (mapRef.current) {
            mapRef.current.zoomIn();
        }
    };

    const handleZoomOut = () => {
        if (mapRef.current) {
            mapRef.current.zoomOut();
        }
    };

    const handleResetNorth = () => {
        if (mapRef.current) {
            mapRef.current.rotateTo(0, { duration: 1000 });
        }
    };

    return (
        <>
            <div className="map-background-container">
                <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapStyle={mapStyle}
                    mapboxAccessToken={MapboxAccessToken}
                    attributionControl={false}
                    hash={true}
                    dragPan={true}
                    dragRotate={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>


            {isMapDashboardActive && (
                <div className="custom-map-controls fixed bottom-8 right-10 z-20">
                    <button className="map-btn" onClick={handleZoomIn} title="Zoom In">
                        <FiPlus size={22} />
                    </button>
                    <button className="map-btn" onClick={handleZoomOut} title="Zoom Out">
                        <FiMinus size={22} />
                    </button>
                    <button className="map-btn" onClick={handleResetNorth} title="Reset North">
                        <TiLocationArrowOutline size={22} />
                    </button>
                </div>
            )}
        </>
    );
};

export default MapAndControls;