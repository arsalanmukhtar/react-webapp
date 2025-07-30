// Function to pretty print table names (e.g., convert snake_case to Title Case)
export const prettyPrintName = (name) => {
    if (!name) return '';
    return name
        .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
        .split(' ') // Split by spaces
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
        .join(' '); // Join back with spaces
};

// Helper to capitalize the first letter of a string
export const capitalizeFirstLetter = (string) => {
    if (!string) return 'Unknown';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};
