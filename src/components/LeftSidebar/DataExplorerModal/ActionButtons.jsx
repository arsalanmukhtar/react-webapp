import React from 'react';

/**
 * ActionButtons - Handles the Cancel and Add Data buttons
 */
const ActionButtons = ({ onClose, onAddData, isAddDataEnabled, showButtons = true }) => {
  if (!showButtons) return null;

  return (
    <div className="flex justify-end space-x-2 mt-4">
      <button
        onClick={onClose}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200 cursor-pointer"
      >
        Cancel
      </button>
      <button
        onClick={onAddData}
        disabled={!isAddDataEnabled}
        className={`px-4 py-2 rounded-md border border-green-400 transition-colors duration-200
                    ${isAddDataEnabled ? 'bg-green-500 text-white hover:bg-green-600 hover:border-green-800 cursor-pointer' : 'bg-green-300 text-gray-500 cursor-not-allowed'}`}
      >
        Add Data
      </button>
    </div>
  );
};

export default ActionButtons;
