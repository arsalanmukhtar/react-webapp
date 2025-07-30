import { useState, useEffect } from 'react';

/**
 * NotificationManager - Custom hook for managing notifications
 */
const useNotificationManager = () => {
  const [notification, setNotification] = useState({ 
    message: '', 
    type: '', 
    visible: false 
  });

  // Auto-hide notifications after 3 seconds
  useEffect(() => {
    let timer;
    if (notification.visible) {
      timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false, message: '' }));
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [notification.visible]);

  return { notification, setNotification };
};

export default useNotificationManager;
