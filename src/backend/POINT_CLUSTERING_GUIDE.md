# Point Clustering Frontend Integration Guide

## Overview
The updated `tiling_operations.py` now handles point data with intelligent clustering. Here's how to integrate this on the frontend using Mapbox GL JS.

## Clustering Behavior

### Zoom Levels
- **0-6**: Heavy clustering (64px grid, ~100m tolerance)
- **7-12**: Medium clustering (32px grid, ~50m tolerance)  
- **13+**: Individual points (no clustering)

### Data Structure
Clustered points include a `point_count` property:
- `point_count = 1`: Individual point
- `point_count > 1`: Cluster representing multiple points

## Frontend Implementation

### 1. Layer Configuration
```javascript
// Add point layer with clustering support
map.addLayer({
  id: 'points-layer',
  type: 'circle',
  source: 'points-source',
  paint: {
    'circle-radius': [
      'case',
      ['>', ['get', 'point_count'], 1],
      // Cluster circle - size based on count
      ['interpolate', ['linear'], ['get', 'point_count'],
        1, 8,    // Single point
        10, 15,  // Small cluster
        50, 25,  // Medium cluster
        100, 35  // Large cluster
      ],
      // Individual point
      6
    ],
    'circle-color': [
      'case',
      ['>', ['get', 'point_count'], 1],
      '#ff6b35', // Cluster color
      '#4264fb'  // Individual point color
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff'
  }
});

// Add cluster count labels
map.addLayer({
  id: 'points-count',
  type: 'symbol',
  source: 'points-source',
  filter: ['>', ['get', 'point_count'], 1],
  layout: {
    'text-field': '{point_count}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  },
  paint: {
    'text-color': '#ffffff'
  }
});
```

### 2. Click Interaction
```javascript
// Handle cluster clicks
map.on('click', 'points-layer', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['points-layer']
  });
  
  if (!features.length) return;
  
  const feature = features[0];
  const pointCount = feature.properties.point_count;
  
  if (pointCount > 1) {
    // Cluster clicked - zoom in to expand
    const zoom = map.getZoom();
    const newZoom = Math.min(zoom + 2, 18);
    
    map.flyTo({
      center: e.lngLat,
      zoom: newZoom
    });
  } else {
    // Individual point clicked - show popup
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <h3>Point Details</h3>
        <p>Name: ${feature.properties.name || 'N/A'}</p>
        <p>Type: ${feature.properties.type || 'N/A'}</p>
      `)
      .addTo(map);
  }
});
```

### 3. Hover Effects
```javascript
// Change cursor on hover
map.on('mouseenter', 'points-layer', () => {
  map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'points-layer', () => {
  map.getCanvas().style.cursor = '';
});

// Show cluster info on hover
map.on('mouseenter', 'points-layer', (e) => {
  const feature = e.features[0];
  const pointCount = feature.properties.point_count;
  
  if (pointCount > 1) {
    new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    })
    .setLngLat(e.lngLat)
    .setHTML(`<div>Cluster: ${pointCount} points</div>`)
    .addTo(map);
  }
});
```

### 4. Data Source Configuration
```javascript
// Add the MVT source with clustering-aware tiles
map.addSource('points-source', {
  type: 'vector',
  tiles: [`${API_BASE_URL}/api/tiling/mvt/my_points_table/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 18
});
```

## Benefits

### Performance
- **Reduced tile size**: Fewer features at low zoom levels
- **Faster rendering**: Less geometry to process
- **Better UX**: Prevents visual clutter from overlapping points

### Scalability
- **Large datasets**: Can handle millions of points efficiently
- **Progressive disclosure**: More detail as users zoom in
- **Cache friendly**: Consistent tile sizes across zoom levels

## Customization Options

### Clustering Parameters
Modify in `_build_point_clustering_query()`:
```python
# Adjust clustering grid sizes
if z <= 6:
    cluster_grid_size = 128  # Larger clusters
    cluster_tolerance = 0.002  # More aggressive clustering
```

### Attribute Aggregation
Customize how attributes are handled in clusters:
```python
# Example: Average numeric values in clusters
attributes_sql = ', '.join([
    f'AVG("{attr}") AS "{attr}"' if attr in numeric_fields
    else f'(array_agg("{attr}" ORDER BY "{attr}"))[1] AS "{attr}"'
    for attr in attributes_list
])
```

This clustering approach provides an optimal balance between performance and user experience for point datasets of any size.
