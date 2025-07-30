import { useState, useEffect } from 'react';

/**
 * UserLayersProvider - Custom hook for managing user's map layers
 */
const useUserLayers = (user, token) => {
  const [activeMapLayers, setActiveMapLayers] = useState([]);

  useEffect(() => {
    if (!user || !token) {
      setActiveMapLayers([]);
      return;
    }
    
    const fetchUserLayers = async () => {
      try {
        const res = await fetch('/api/data/users/me/map_layers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const layers = await res.json();
          const processedLayers = layers.map(l => ({ ...l, isVisible: l.is_visible }));
          setActiveMapLayers(processedLayers);
        } else {
          console.log('⚠️ Failed to fetch user layers');
          setActiveMapLayers([]);
        }
      } catch (err) {
        console.error('❌ Error fetching user layers:', err);
        setActiveMapLayers([]);
      }
    };
    
    fetchUserLayers();
  }, [user, token]);

  return { activeMapLayers, setActiveMapLayers };
};

export default useUserLayers;
