import React from 'react';

/**
 * LayerLoadingIndicator - Shows minimal loading animation (green dots with white background)
 * Positioned in the center of the map
 */
const LayerLoadingIndicator = ({ isVisible }) => {
  if (!isVisible) return null;

  // Define the keyframes animation inline - smoother and smaller
  const smoothPulseKeyframes = `
    @keyframes smoothPulse {
      0%, 100% {
        transform: scale(0.8);
        opacity: 0.4;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
    }
  `;

  return (
    <>
      {/* Inject the CSS animation */}
      <style dangerouslySetInnerHTML={{ __html: smoothPulseKeyframes }} />
      
      {/* Loading indicator with white background and green dots */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-md px-4 py-3 border border-gray-200">
          <div className="flex space-x-2">
            <div 
              className="w-3 h-3 bg-green-500 rounded-full"
              style={{
                animation: 'smoothPulse 1.2s infinite ease-in-out'
              }}
            ></div>
            <div 
              className="w-3 h-3 bg-green-500 rounded-full"
              style={{
                animation: 'smoothPulse 1.2s infinite ease-in-out',
                animationDelay: '0.2s'
              }}
            ></div>
            <div 
              className="w-3 h-3 bg-green-500 rounded-full"
              style={{
                animation: 'smoothPulse 1.2s infinite ease-in-out',
                animationDelay: '0.4s'
              }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LayerLoadingIndicator;
