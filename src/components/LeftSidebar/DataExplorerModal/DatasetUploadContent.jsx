import React, { useState, useEffect, useCallback } from 'react';
import { FiUpload, FiClipboard, FiFileText, FiXCircle, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const MAX_FILE_SIZE_MB = 10; // 10 MB limit
const MAX_TEXT_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes

// Helper function to infer geometry type and feature count
const inferGeoJSONMetadata = (geojson) => {
    let geometry_type = 'Unknown';
    let feature_count = 0;
    let srid = '4326'; // GeoJSON default SRID

    if (geojson && typeof geojson === 'object') {
        if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
            feature_count = geojson.features.length;
            if (feature_count > 0 && geojson.features[0].geometry) {
                geometry_type = geojson.features[0].geometry.type || 'Unknown';
            }
        } else if (geojson.type === 'Feature' && geojson.geometry) {
            feature_count = 1;
            geometry_type = geojson.geometry.type || 'Unknown';
        } else if (geojson.type && geojson.coordinates) { // Direct Geometry object
            geometry_type = geojson.type;
            feature_count = 0; // Or 1 if considered a single feature
        }

        // Basic check for CRS (though GeoJSON CRS is deprecated)
        if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name) {
            const urnMatch = geojson.crs.properties.name.match(/urn:ogc:def:crs:EPSG::(\d+)/i);
            if (urnMatch) {
                srid = urnMatch[1];
            } else if (geojson.crs.properties.name.toLowerCase().includes('wgs84')) {
                srid = '4326';
            }
        }
    }
    return { geometry_type, feature_count, srid };
};


const DatasetUploadContent = ({ onGeoJSONChange }) => {
    const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'text'
    const [filesToProcess, setFilesToProcess] = useState([]); // Array for multiple files
    const [geojsonText, setGeojsonText] = useState('');
    const [overallError, setOverallError] = useState(''); // For general errors (e.g., file size limit)
    const [isLoading, setIsLoading] = useState(false); // For overall processing indicator

    // Helper to process a single file or text content
    const processGeoJSONContent = useCallback((content, isFile = false, fileId = null, initialName = null) => {
        let currentError = null;
        let parsed = null;
        let isValid = false;
        let metadata = { geometry_type: 'Unknown', feature_count: 'N/A', srid: 'N/A' };

        if (!content) {
            return { isValid: false, parsed: null, error: null, metadata };
        }

        // Size check for text content
        if (!isFile && new TextEncoder().encode(content).length > MAX_TEXT_SIZE_BYTES) {
            currentError = `GeoJSON text exceeds ${MAX_FILE_SIZE_MB}MB limit.`;
            isValid = false;
        } else {
            try {
                parsed = JSON.parse(content);
                if (parsed && typeof parsed.type === 'string') {
                    isValid = true;
                    metadata = inferGeoJSONMetadata(parsed);
                } else {
                    currentError = 'Invalid GeoJSON format: Missing "type" property.';
                    isValid = false;
                }
            } catch (e) {
                currentError = 'Invalid JSON format.';
                isValid = false;
            }
        }

        if (isFile && fileId !== null) {
            setFilesToProcess(prevFiles =>
                prevFiles.map(f =>
                    f.id === fileId
                        ? { ...f, status: isValid ? 'valid' : 'invalid', parsedGeoJSON: parsed, error: currentError, metadata }
                        : f
                )
            );
        } else if (!isFile) {
            setOverallError(currentError);
            onGeoJSONChange(isValid ? [{ geojson: parsed, name: initialName || 'Pasted GeoJSON', ...metadata }] : []); // Pass as array for consistency, or empty array if invalid
        }

        return { isValid, parsed, error: currentError, metadata };
    }, [onGeoJSONChange]);

    // Effect to clear inputs and errors when uploadMethod changes
    useEffect(() => {
        setOverallError('');
        setIsLoading(false);
        if (uploadMethod === 'file') {
            setGeojsonText('');
            // Do not clear filesToProcess here, it should only be cleared by explicit removal or when switching to text
            onGeoJSONChange([]); // Clear parent's state for files
        } else { // Switching to 'text'
            setFilesToProcess([]); // Clear files when switching to text upload
            const fileInput = document.getElementById('geojson-file-upload');
            if (fileInput) fileInput.value = '';
            setGeojsonText(''); // Clear text
            onGeoJSONChange([]); // Clear parent's state for text
        }
    }, [uploadMethod, onGeoJSONChange]);

    // Effect for text area processing
    useEffect(() => {
        if (uploadMethod === 'text') {
            if (geojsonText) {
                setIsLoading(true);
                const handler = setTimeout(() => {
                    processGeoJSONContent(geojsonText, false, null, 'Pasted GeoJSON'); // Pass a default name
                    setIsLoading(false);
                }, 50); // Small delay to show loading indicator
                return () => clearTimeout(handler);
            } else {
                onGeoJSONChange([]); // Pass empty array if text area is empty
                setOverallError('');
                setIsLoading(false);
            }
        }
    }, [geojsonText, uploadMethod, processGeoJSONContent, onGeoJSONChange]);

    // Effect to update parent's GeoJSON state when filesToProcess changes and processing is done
    useEffect(() => {
        if (uploadMethod === 'file' && !isLoading) {
            const validGeoJSONs = filesToProcess
                .filter(f => f.status === 'valid')
                .map(f => ({
                    id: f.id,
                    name: f.name,
                    geojson: f.parsedGeoJSON,
                    ...f.metadata,
                }));
            onGeoJSONChange(validGeoJSONs);
        }
    }, [filesToProcess, isLoading, uploadMethod, onGeoJSONChange]);


    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length === 0) {
            // If no new files selected, do nothing, don't clear existing
            return;
        }

        setOverallError('');
        setIsLoading(true); // Start overall loading for new files

        const newFileEntries = newFiles.map(file => ({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substr(2, 9)}`, // More robust unique ID
            file: file,
            name: file.name.split('.').slice(0, -1).join('.') || file.name, // Default name from filename
            status: 'pending',
            parsedGeoJSON: null,
            error: null,
            metadata: { geometry_type: 'Unknown', feature_count: 'N/A', srid: 'N/A' },
        }));

        setFilesToProcess(prev => [...prev, ...newFileEntries]); // Append new files

        let processedCount = 0;
        newFileEntries.forEach((fileEntry) => {
            if (fileEntry.file.size > MAX_TEXT_SIZE_BYTES) {
                setFilesToProcess(prevFiles =>
                    prevFiles.map(f =>
                        f.id === fileEntry.id
                            ? { ...f, status: 'invalid', error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.` }
                            : f
                    )
                );
                processedCount++;
                if (processedCount === newFileEntries.length) {
                    setIsLoading(false); // All *new* files processed
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const { isValid, parsed, error, metadata } = processGeoJSONContent(event.target.result, true, fileEntry.id);
                processedCount++;
                if (processedCount === newFileEntries.length) {
                    setIsLoading(false); // All *new* files processed
                }
            };
            reader.onerror = () => {
                setFilesToProcess(prevFiles =>
                    prevFiles.map(f =>
                        f.id === fileEntry.id
                            ? { ...f, status: 'invalid', error: 'Failed to read file.' }
                            : f
                    )
                );
                processedCount++;
                if (processedCount === newFileEntries.length) {
                    setIsLoading(false); // All *new* files processed
                }
            };
            reader.readAsText(fileEntry.file);
        });

        // Clear the file input element itself to allow re-selection of the same files
        const fileInput = document.getElementById('geojson-file-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleGeoJSONNameChange = (id, newName) => {
        setFilesToProcess(prevFiles => {
            const updatedFiles = prevFiles.map(f =>
                f.id === id ? { ...f, name: newName } : f
            );
            return updatedFiles; // useEffect will handle onGeoJSONChange
        });
    };

    const clearFileInput = (fileId) => {
        setFilesToProcess(prevFiles => {
            const updatedFiles = prevFiles.filter(f => f.id !== fileId);
            // No need to manually call onGeoJSONChange here, the useEffect will handle it
            return updatedFiles;
        });
    };

    const clearTextareaInput = () => {
        setGeojsonText('');
        onGeoJSONChange([]); // Clear parent state by passing empty array
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4 flex space-x-4">
                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="radio"
                        name="uploadMethod"
                        value="file"
                        checked={uploadMethod === 'file'}
                        onChange={() => setUploadMethod('file')}
                        className="form-radio h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                    />
                    <span className="ml-2 text-gray-700 text-sm flex items-center">
                        <FiFileText className="mr-1" /> Upload File(s)
                    </span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="radio"
                        name="uploadMethod"
                        value="text"
                        checked={uploadMethod === 'text'}
                        onChange={() => setUploadMethod('text')}
                        className="form-radio h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                    />
                    <span className="ml-2 text-gray-700 text-sm flex items-center">
                        <FiClipboard className="mr-1" /> Paste GeoJSON
                    </span>
                </label>
            </div>

            {uploadMethod === 'file' && (
                <div className="flex flex-col space-y-2 flex-1">
                    <label htmlFor="geojson-file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                        Select GeoJSON File(s) (max {MAX_FILE_SIZE_MB}MB per file)
                    </label>
                    <input
                        type="file"
                        id="geojson-file-upload"
                        accept=".geojson,application/json"
                        multiple
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-green-50 file:text-green-700
                            hover:file:bg-green-100 hover:file:cursor-pointer"
                    />
                    {isLoading && filesToProcess.some(f => f.status === 'pending') && (
                        <div className="flex items-center justify-center py-4">
                            <FiLoader className="animate-spin text-green-500 mr-2" size={20} />
                            <span className="text-green-700 text-sm">Processing files...</span>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-2">
                        {filesToProcess.map(fileEntry => (
                            <div
                                key={fileEntry.id}
                                className={`flex items-center justify-between p-3 border rounded-md transition-all duration-200
                                            ${fileEntry.status === 'valid' ? 'bg-green-50 border-green-500' :
                                              fileEntry.status === 'invalid' ? 'bg-red-50 border-red-500' :
                                              'bg-gray-50 border-gray-200'}`}
                            >
                                <div className="flex items-center flex-1 min-w-0 mr-2">
                                    {fileEntry.status === 'valid' && <FiCheckCircle className="text-green-600 mr-2 flex-shrink-0" size={18} />}
                                    {fileEntry.status === 'invalid' && <FiAlertCircle className="text-red-600 mr-2 flex-shrink-0" size={18} />}
                                    {fileEntry.status === 'pending' && <FiLoader className="animate-spin text-gray-400 mr-2 flex-shrink-0" size={18} />}
                                    <input
                                        type="text"
                                        value={fileEntry.name}
                                        onChange={(e) => handleGeoJSONNameChange(fileEntry.id, e.target.value)}
                                        className="flex-1 text-sm font-medium text-gray-800 bg-transparent border-b border-gray-300 focus:outline-none focus:border-green-500"
                                        placeholder="Layer Name"
                                    />
                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">({(fileEntry.file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                </div>
                                {fileEntry.error && <span className="text-xs text-red-700 ml-4 flex-shrink-0">{fileEntry.error}</span>}
                                <button
                                    type="button"
                                    onClick={() => clearFileInput(fileEntry.id)}
                                    className="ml-4 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors flex-shrink-0"
                                    title="Remove file"
                                >
                                    <FiXCircle size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {overallError && <p className="text-red-500 text-sm mt-2">{overallError}</p>}
                </div>
            )}

            {uploadMethod === 'text' && (
                <div className={`flex flex-col space-y-2 flex-1 p-3 border rounded-md transition-all duration-200 relative
                                ${!geojsonText ? 'bg-gray-50 border-gray-200' : isValidGeoJSON ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                    <label htmlFor="geojson-textarea" className="block text-sm font-medium text-gray-700">
                        Paste GeoJSON Code (max {MAX_FILE_SIZE_MB}MB)
                    </label>
                    <div className="relative flex-1">
                        <textarea
                            id="geojson-textarea"
                            className="w-full h-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-green-500 font-mono text-xs resize-none"
                            placeholder='Paste your GeoJSON here, e.g., {"type": "FeatureCollection", "features": [...]}'
                            value={geojsonText}
                            onChange={handleTextareaChange}
                            disabled={isLoading}
                        ></textarea>
                        {geojsonText && !isLoading && (
                            <button
                                type="button"
                                onClick={clearTextareaInput}
                                className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                                title="Clear text"
                            >
                                <FiXCircle size={20} />
                            </button>
                        )}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
                                <FiLoader className="animate-spin text-green-500" size={30} />
                                <span className="ml-2 text-green-700 text-sm">Processing...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {overallError && <p className="text-red-500 text-sm mt-2">{overallError}</p>}
        </div>
    );
};

export default DatasetUploadContent;