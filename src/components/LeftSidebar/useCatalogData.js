import { useState, useEffect } from 'react';

/**
 * CatalogDataProvider - Custom hook for managing catalog table data
 */
const useCatalogData = () => {
  const [catalogTables, setCatalogTables] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const tablesRes = await fetch('/api/data/layers/tables', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!tablesRes.ok) {
          const errorData = await tablesRes.json();
          setCatalogError(errorData.detail || 'Failed to fetch tables.');
          setCatalogLoading(false);
          return;
        }
        const initialTables = await tablesRes.json();
        setCatalogTables(initialTables);
      } catch (err) {
        console.error('Network or unexpected error:', err);
        setCatalogError('An unexpected error occurred while fetching tables.');
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchTables();
  }, []);

  return { catalogTables, catalogLoading, catalogError };
};

export default useCatalogData;
