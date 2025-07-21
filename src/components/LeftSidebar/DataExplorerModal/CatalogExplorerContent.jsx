import React, { useState } from 'react';
import TableCard from './TableCard';
import { FiSearch } from 'react-icons/fi';

const CatalogExplorerContent = ({ tables, loading, error, selectedTables, onToggleSelectTable }) => { // Updated props
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTables = tables.filter(table =>
        table.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            {/* Search Bar with Icon */}
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Search datasets by name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2">
                {loading && <p className="text-gray-600 text-center">Loading tables...</p>}
                {error && <p className="text-red-500 text-center">Error: {error}</p>}
                {!loading && !error && filteredTables.length === 0 && (
                    <p className="text-gray-600 text-center">No tables found.</p>
                )}
                <div className="space-y-4">
                    {!loading && !error && filteredTables.map(table => (
                        <TableCard
                            key={table.name}
                            table={table}
                            // Check if the current table is in the selectedTables array
                            isSelected={selectedTables.some(selected => selected.name === table.name)}
                            onToggleSelect={onToggleSelectTable} // Pass the toggle function
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CatalogExplorerContent;
