import { useEffect, useState, useRef } from 'react';
import Map from 'react-map-gl';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { TiLocationArrowOutline  } from 'react-icons/ti';
import './MapContainer.css';

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Add token verification
if (!MapboxAccessToken) {
    console.error('Mapbox token not found! Make sure you have added it to your .env file');
}

const MapContainer = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/hello')
            .then(res => res.json())
            .then(data => setMessage(data.message))
            .catch(err => setMessage('Error fetching message'));
    }, []);

    const mapRef = useRef();

    // Handlers for custom controls
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
            mapRef.current.rotateTo(0, { duration: 500 });
        }
    };

    return (
        <div className='map-container'>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: -122.4,
                    latitude: 37.8,
                    zoom: 14
                }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={MapboxAccessToken}
                attributionControl={false}
                hash={true}
            >
                <div className="custom-map-controls">
                    <button className="map-btn" onClick={handleZoomIn} title="Zoom In">
                        <FiPlus size={22} />
                    </button>
                    <button className="map-btn" onClick={handleZoomOut} title="Zoom Out">
                        <FiMinus size={22} />
                    </button>
                    <button className="map-btn" onClick={handleResetNorth} title="Reset North">
                        <TiLocationArrowOutline  size={22} />
                    </button>
                </div>
            </Map>
        </div>
    );
};

export default MapContainer;