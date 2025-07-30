import React from 'react';
import CatalogExplorerContent from './CatalogExplorerContent';

/**
 * ModalContentRenderer - Renders the appropriate content based on active tab
 */
const ModalContentRenderer = ({ 
  activeTab, 
  catalogTables, 
  catalogLoading, 
  catalogError, 
  selectedTables, 
  onToggleSelectTable 
}) => {
  switch (activeTab) {
    case 'catalog':
      return (
        <CatalogExplorerContent
          tables={catalogTables}
          loading={catalogLoading}
          error={catalogError}
          selectedTables={selectedTables}
          onToggleSelectTable={onToggleSelectTable}
        />
      );
    case 'external':
      return <p className="text-gray-600 text-sm">Link to external datasets.</p>;
    default:
      return <p className="text-gray-600 text-sm">Select a tab to explore data.</p>;
  }
};

export default ModalContentRenderer;
