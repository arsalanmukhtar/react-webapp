import React from 'react';
import { FiInfo } from 'react-icons/fi';

const GeometryIcon = ({ type, color = 'currentColor', size = 16 }) => {
    const normalizedType = type ? type.toLowerCase() : '';
    switch (normalizedType) {
        case 'point':
        case 'multipoint':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="6" fill={color} />
                </svg>
            );
        case 'linestring':
        case 'multilinestring':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12L20 12" stroke={color} strokeWidth="8" strokeLinecap="round" />
                </svg>
            );
        case 'polygon':
        case 'multipolygon':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="24" height="24" fill={color} />
                </svg>
            );
        default:
            return <FiInfo size={size} color={color} />;
    }
};

export default GeometryIcon;
