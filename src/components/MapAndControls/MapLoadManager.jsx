import { useEffect, useRef, useState } from 'react';

/**
 * MapLoadManager - Handles map load detection and initial setup
 */
const MapLoadManager = ({ mapRef, user, onMapReady }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const loadCheckIntervalRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    // Handle user logout - clear everything
    if (!user) {
      setIsMapLoaded(false);
      if (loadCheckIntervalRef.current) {
        clearInterval(loadCheckIntervalRef.current);
      }
      return;
    }

    const map = mapRef.current.getMap();

    const checkMapReady = () => {
      const styleLoaded = map.isStyleLoaded();
      const mapLoaded = map.loaded();
      const readyState = styleLoaded && mapLoaded;
      
      return readyState;
    };

    const handleMapReady = () => {
      setIsMapLoaded(true);
      onMapReady(true);
      
      // Clear the interval once map is ready
      if (loadCheckIntervalRef.current) {
        clearInterval(loadCheckIntervalRef.current);
      }
    };

    // Check if map is already ready
    if (checkMapReady()) {
      handleMapReady();
    } else {
      // Set up event listeners
      const onLoad = () => {
        if (checkMapReady()) {
          handleMapReady();
        }
      };
      
      const onStyleData = () => {
        if (checkMapReady()) {
          handleMapReady();
        }
      };

      const onSourceData = () => {
        if (checkMapReady()) {
          handleMapReady();
        }
      };
      
      // Listen for various map events
      map.on('load', onLoad);
      map.on('styledata', onStyleData);
      map.on('sourcedata', onSourceData);

      // Also poll every 100ms as a fallback
      loadCheckIntervalRef.current = setInterval(() => {
        if (checkMapReady()) {
          handleMapReady();
        }
      }, 100);

      // Cleanup
      return () => {
        if (map && !map._removed) {
          map.off('load', onLoad);
          map.off('styledata', onStyleData);
          map.off('sourcedata', onSourceData);
        }
        if (loadCheckIntervalRef.current) {
          clearInterval(loadCheckIntervalRef.current);
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
