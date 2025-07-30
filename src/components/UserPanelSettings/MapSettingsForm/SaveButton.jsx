import React from 'react';
import { FiSave } from 'react-icons/fi';

/**
 * SaveButton - Handles the save button for map settings
 */
const SaveButton = ({ onSubmit, disabled = false }) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={onSubmit}
      className={`w-full py-2 px-4 rounded-md border mt-4 flex items-center justify-center
                  ${disabled 
                    ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed' 
                    : 'bg-green-500 text-white border-green-400 hover:bg-green-400 hover:border-green-800 focus:outline-none focus:border-green-500 active:border-green-800 hover:cursor-pointer'
                  }`}
    >
      <FiSave className="mr-2" /> Save Map Settings
    </button>
  );
};

export default SaveButton;
