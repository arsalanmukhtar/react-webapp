import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TileUrlTest = () => {
  const { token } = useAuth();
  useEffect(() => {
    if (!token) {
      console.warn('TileUrlTest: No token found in context');
      return;
    }
    console.log('TileUrlTest using token:', token);
    fetch('/api/tiling/layer-state?browser_url=' + encodeURIComponent(window.location.href), {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.layers)) {
          data.layers.forEach(layer => {
            console.log('Layer URL:', layer.url);
          });
        } else {
          console.log('TileUrlTest /api/tiling/layer-state result:', data);
        }
      })
      .catch(err => {
        console.error('TileUrlTest error:', err);
      });
  }, [token]);
  return null;
};

export default TileUrlTest;
