import React from 'react';

/**
 * LayerLoadingIndicator - Shows loading animation specifically for layer operations
 * Positioned in the bottom-left of the map without full overlay
 */
const LayerLoadingIndicator = ({ isVisible, message = "Loading layers..." }) => {
  if (!isVisible) return null;

  // Define the keyframes animation inline - smoother and smaller
  const smoothPulseKeyframes = `
    @keyframes smoothPulse {
      0%, 100% {
        transform: scale(0.9);
        opacity: 0.6;
      }
      50% {
        transform: scale(1.1);
        opacity: 1;
      }
    }
  `;

  return (
    <>
      {/* Inject the CSS animation */}
      <style dangerouslySetInnerHTML={{ __html: smoothPulseKeyframes }} />
      
      {/* Layer loading indicator positioned in center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Three animated dots - smaller and smoother */}
            <div className="flex space-x-1">
              <div 
                className="w-2 h-2 bg-blue-500 rounded-full"
                style={{
                  animation: 'smoothPulse 1.2s infinite ease-in-out'
                }}
              ></div>
              <div 
                className="w-2 h-2 bg-blue-500 rounded-full"
                style={{
                  animation: 'smoothPulse 1.2s infinite ease-in-out',
                  animationDelay: '0.2s'
                }}
              ></div>
              <div 
                className="w-2 h-2 bg-blue-500 rounded-full"
                style={{
                  animation: 'smoothPulse 1.2s infinite ease-in-out',
                  animationDelay: '0.4s'
                }}
              ></div>
            </div>
            
            {/* Loading message */}
            <span className="text-xs text-gray-600 font-medium">
              {message}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default LayerLoadingIndicator;
