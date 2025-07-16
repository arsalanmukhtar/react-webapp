import { useEffect, useState } from 'react';
import Map, { NavigationControl } from 'react-map-gl';
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

    return (
        <div className='map-container'>
            <Map
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
                <NavigationControl position="bottom-right" />
            </Map>
        </div>
    );
};

export default MapContainer;