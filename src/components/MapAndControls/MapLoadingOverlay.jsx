import React from 'react';

/**
 * MapLoadingOverlay - Shows loading animation while map is initializing
 */
const MapLoadingOverlay = ({ isVisible }) => {
  if (!isVisible) return null;

  // Define the keyframes animation inline
  const slowBounceKeyframes = `
    @keyframes slowBounce {
      0%, 80%, 100% {
        transform: scale(0.8) translateY(0);
        opacity: 0.7;
      }
      40% {
        transform: scale(1.2) translateY(-20px);
        opacity: 1;
      }
    }
  `;

  return (
    <>
      {/* Inject the CSS animation */}
      <style dangerouslySetInnerHTML={{ __html: slowBounceKeyframes }} />
      
      <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-30">
        <div className="flex space-x-3">
          {/* Three animated dots with slower, more pronounced bounce */}
          <div 
            className="w-5 h-5 bg-blue-600 rounded-full"
            style={{
              animation: 'slowBounce 1.4s infinite ease-in-out both'
            }}
          ></div>
          <div 
            className="w-5 h-5 bg-blue-600 rounded-full"
            style={{
              animation: 'slowBounce 1.4s infinite ease-in-out both',
              animationDelay: '0.32s'
            }}
          ></div>
          <div 
            className="w-5 h-5 bg-blue-600 rounded-full"
            style={{
              animation: 'slowBounce 1.4s infinite ease-in-out both',
              animationDelay: '0.64s'
            }}
          ></div>
        </div>
      </div>
    </>
  );
};

export default MapLoadingOverlay;
