import React from 'react';

const TileUrlTest = ({ layer }) => {
  if (!layer || !layer.original_name) return null;
  const url = `${window.location.origin}/mvt/layers/${layer.original_name}/z/x/y.pbf`;
  return (
    <div style={{ fontSize: '10px', color: '#888', marginTop: '2px', wordBreak: 'break-all' }}>
      {url}
    </div>
  );
};

export default TileUrlTest;
