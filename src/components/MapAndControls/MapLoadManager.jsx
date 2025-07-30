import { useEffect, useRef, useState } from 'react';

/**
 * MapLoadManager - Handles map load detection and initial setup
 */
const MapLoadManager = ({ mapRef, user, onMapReady }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    console.log('🔧 Map setup effect triggered', {
      hasMapRef: !!mapRef.current,
      hasUser: !!user,
      isMapLoaded: isMapLoaded
    });

    if (!mapRef.current) {
      console.log('⚠️ MapLoadManager: No mapRef, exiting');
      return;
    }

    // Handle user logout - clear everything
    if (!user) {
      console.log('🚪 User logged out, resetting map load state');
      setIsMapLoaded(false);
      return;
    }

    const map = mapRef.current.getMap();

    const handleMapReady = () => {
      console.log('🗺️ Map is ready for layers');
      setIsMapLoaded(true);
      onMapReady(true);
    };

    // Check if map is ready
    if (map.isStyleLoaded() && map.loaded()) {
      handleMapReady();
    } else {
      // Listen for map to be ready
      const onLoad = () => {
        if (map.isStyleLoaded() && map.loaded()) {
          handleMapReady();
        }
      };
      
      map.on('load', onLoad);
      map.on('styledata', onLoad);

      // Cleanup
      return () => {
        if (map && !map._removed) {
          map.off('load', onLoad);
          map.off('styledata', onLoad);
        }
      };
    }
  }, [mapRef, user]);

  // Pass isMapLoaded state up to parent when it changes
  useEffect(() => {
    onMapReady(isMapLoaded);
  }, [isMapLoaded, onMapReady]);

  return null; // This component doesn't render anything
};

export default MapLoadManager;
