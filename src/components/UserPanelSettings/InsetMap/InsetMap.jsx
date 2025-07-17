import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'; // Import Geocoder
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'; // Geocoder CSS
import './InsetMap.css'; // Import the new CSS file

// Your Mapbox access token from environment variables, following MapDashboard.jsx terminology
const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Add token verification
if (!MapboxAccessToken) { // Check the constant variable
    console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

// Assign the token to the global mapboxgl object, which is required by Mapbox GL JS
mapboxgl.accessToken = MapboxAccessToken;

const InsetMap = ({ initialCenter, initialZoom, onMapChange }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const geocoder = useRef(null);
    const clickMarker = useRef(null); // Ref to store the marker placed on click

    useEffect(() => {
        if (map.current) return; // Initialize map only once

        // Initialize map with planar projection
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12', // Default style for inset map
            center: initialCenter,
            zoom: initialZoom,
            interactive: true, // Ensure interactivity for panning/zooming
            projection: 'mercator', // Explicitly set to planar projection
            attributionControl: false // Disable default attribution control
        });

        // Initialize Geocoder
        geocoder.current = new MapboxGeocoder({
            accessToken: MapboxAccessToken, // Use the constant variable here
            mapboxgl: mapboxgl,
            marker: true, // Geocoder will add its own marker
            placeholder: 'Search for a location',
            zoom: 14 // Zoom level to set when a result is selected
        });

        // Add Geocoder to the map
        // Add a check to ensure map.current exists before adding control
        if (map.current) {
            map.current.addControl(geocoder.current, 'top-left');
        }

        // Add navigation controls (zoom in/out)
        if (map.current) {
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

        // Event listener for map move (pan/zoom)
        map.current.on('moveend', () => {
            if (map.current) {
                const center = map.current.getCenter();
                const zoom = map.current.getZoom();
                onMapChange({
                    latitude: center.lat,
                    longitude: center.lng,
                    zoom: zoom
                });
            }
        });

        // Event listener for map click
        map.current.on('click', (e) => {
            if (map.current) {
                // Remove existing click marker if any
                if (clickMarker.current) {
                    clickMarker.current.remove();
                }
                // For robustness, we can clear geocoder's input which removes its marker.
                if (geocoder.current) {
                    geocoder.current.clear();
                }

                // Create a new marker at the clicked location
                clickMarker.current = new mapboxgl.Marker()
                    .setLngLat(e.lngLat)
                    .addTo(map.current);

                const zoom = map.current.getZoom(); // Use current map zoom
                onMapChange({
                    latitude: e.lngLat.lat, // Use clicked coordinates
                    longitude: e.lngLat.lng,
                    zoom: zoom
                });
                // Removed map.current.flyTo to prevent centering on click
            }
        });

        // Event listener for geocoder result
        geocoder.current.on('result', (e) => {
            if (map.current && e.result && e.result.geometry && e.result.geometry.coordinates) {
                // Remove custom click marker if a geocoder result is selected
                if (clickMarker.current) {
                    clickMarker.current.remove();
                    clickMarker.current = null;
                }

                const coords = e.result.geometry.coordinates;
                const zoom = map.current.getZoom(); // Use current map zoom after geocoder flies to location
                onMapChange({
                    latitude: coords[1],
                    longitude: coords[0],
                    zoom: zoom
                });
            }
        });


        // Cleanup function
        return () => {
            // It's generally safer to remove the map first, as controls are often tied to it.
            // Mapbox GL JS's map.remove() should handle control cleanup.
            // However, to explicitly prevent the removeChild error,
            // we can try to remove the geocoder if its container still exists.
            if (geocoder.current && map.current) { // Ensure both map and geocoder refs are valid
                // Check if the geocoder's container is still part of the map's container
                // This is a more robust check to prevent calling removeChild on a detached element
                if (map.current.getContainer().contains(geocoder.current._container)) {
                    map.current.removeControl(geocoder.current);
                }
                geocoder.current = null; // Clear the ref
            }

            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            if (clickMarker.current) {
                clickMarker.current.remove();
                clickMarker.current = null;
            }
        };
    }, []); // Empty dependency array for map and geocoder initialization

    // Effect to update map view if initialCenter or initialZoom props change
    useEffect(() => {
        if (map.current && initialCenter && initialZoom) {
            const currentCenter = map.current.getCenter();
            const currentZoom = map.current.getZoom();

            // Only update if values are different to avoid unnecessary re-renders
            if (currentCenter.lng !== initialCenter[0] || currentCenter.lat !== initialCenter[1]) {
                map.current.setCenter(initialCenter);
            }
            if (currentZoom !== initialZoom) {
                map.current.setZoom(initialZoom);
            }
        }
    }, [initialCenter, initialZoom]);


    return (
        <div
            ref={mapContainer}
            className="inset-map-container" // Apply custom styling for rounded border
            style={{ width: '100%', height: '300px', borderRadius: '5px', overflow: 'hidden' }}
        />
    );
};

export default InsetMap;