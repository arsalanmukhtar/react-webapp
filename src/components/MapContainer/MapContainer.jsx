import { useEffect, useState } from 'react'

const MapContainer = () => {
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetch('/api/hello')
            .then(res => res.json())
            .then(data => setMessage(data.message))
            .catch(err => setMessage('Error fetching message'))
    }, [])

    return (
        <div className='map-container'>
            <div id="map">
                Map Container
            </div>
            <div>
                Backend says: {message}
            </div>
        </div>
    )
}

export default MapContainer