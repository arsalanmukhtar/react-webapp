import React from 'react';

/**
 * NotificationDisplay - Shows validation and success/error messages
 */
const NotificationDisplay = ({ notification }) => {
  if (!notification.visible) return null;

  const getTextColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className={`text-center text-xs mt-2 ${getTextColor(notification.type)}`}>
      {notification.message}
    </div>
  );
};

export default NotificationDisplay;
