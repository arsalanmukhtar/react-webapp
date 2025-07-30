import { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * MapLayerLogger Component
 * 
 * This component handles logging of map layer database operations for debugging and monitoring.
 * It tracks all layer interactions including:
 * 1. Layer addition (when LayerItem is added to LayersPanel)
 * 2. Layer deletion (when delete button is clicked in LayerItem)
 * 3. Layer visibility toggle (when eye button is clicked in LayerItem)
 * 4. Initial layer load (when user logs in and existing layers are loaded)
 */
const MapLayerLogger = ({ activeMapLayers, user }) => {
    const { token } = useAuth();
    const previousLayersRef = useRef([]);
    const lastLogTime = useRef(0);
    const isInitialLoad = useRef(true);
    const batchTimeout = useRef(null);

    // Effect to track layer changes and determine actions
    useEffect(() => {
        if (!user || !token) return;

        // Skip logging on initial load/refresh
        if (isInitialLoad.current) {
            // Set previous layers and mark initial load as complete
            previousLayersRef.current = (activeMapLayers || []).map(layer => ({ ...layer }));
            isInitialLoad.current = false;
            return;
        }

        // Clear any existing timeout
        if (batchTimeout.current) {
            clearTimeout(batchTimeout.current);
        }

        // Batch multiple rapid changes together
        batchTimeout.current = setTimeout(async () => {
            // Debounce mechanism to prevent duplicate logging
            const now = Date.now();
            if (now - lastLogTime.current < 50) return; // Prevent logging within 50ms
            lastLogTime.current = now;

        const currentLayers = activeMapLayers || [];
        const previousLayers = previousLayersRef.current || [];

        // Detect layer additions
        const addedLayers = currentLayers.filter(currentLayer => 
            !previousLayers.some(prevLayer => prevLayer.id === currentLayer.id)
        );

        // Detect layer deletions
        const deletedLayers = previousLayers.filter(prevLayer => 
            !currentLayers.some(currentLayer => currentLayer.id === prevLayer.id)
        );

        // Detect visibility changes
        const visibilityChanges = currentLayers.filter(currentLayer => {
            const prevLayer = previousLayers.find(p => p.id === currentLayer.id);
            return prevLayer && (prevLayer.isVisible !== currentLayer.isVisible || prevLayer.is_visible !== currentLayer.is_visible);
        });

        // Log added layers
        addedLayers.forEach(layer => {
            console.log(layer);
        });

        // Log deleted layers (before they're removed from state)
        deletedLayers.forEach(layer => {
            console.log(layer);
        });

        // Log visibility changes with fresh database state
        if (visibilityChanges.length > 0) {
            // Fetch all layers to get fresh database state
            try {
                const res = await fetch('/api/data/users/me/map_layers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const freshLayers = await res.json();
                    
                    // Log each visibility change with fresh database state
                    visibilityChanges.forEach(layer => {
                        const freshLayer = freshLayers.find(fl => fl.id === layer.id);
                        if (freshLayer) {
                            console.log(freshLayer);
                        } else {
                            // Fallback to current state if not found
                            console.log(layer);
                        }
                    });
                } else {
                    // Fallback to current state if fetch fails
                    visibilityChanges.forEach(layer => {
                        console.log(layer);
                    });
                }
            } catch (error) {
                // Fallback to current state if there's an error
                visibilityChanges.forEach(layer => {
                    console.log(layer);
                });
            }
        }

        // Update the reference for next comparison
        previousLayersRef.current = currentLayers.map(layer => ({ ...layer }));

        }, 200); // Wait 200ms to batch multiple changes together

    }, [activeMapLayers, user, token]);

    // Reset on user logout
    useEffect(() => {
        if (!user) {
            previousLayersRef.current = [];
            isInitialLoad.current = true; // Reset initial load flag for next login
            if (batchTimeout.current) {
                clearTimeout(batchTimeout.current);
                batchTimeout.current = null;
            }
        }
    }, [user]);

    // This component doesn't render anything - it's just for logging
    return null;
};

export default MapLayerLogger;
