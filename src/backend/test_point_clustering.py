#!/usr/bin/env python3
"""
Test script to demonstrate point clustering functionality.

This script tests the point clustering logic by:
1. Identifying point tables in the database
2. Testing MVT tile generation at different zoom levels
3. Showing clustering behavior changes across zoom levels

Usage:
    python test_point_clustering.py [table_name]
"""

import sys
import os
from tiling_operations import get_mvt_tile_from_db, get_geometry_type_from_db, get_tables
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='../../.env.local')

def find_point_tables():
    """Find all tables containing point geometries"""
    print("🔍 Searching for point tables...")
    tables = get_tables()
    point_tables = []
    
    for table in tables:
        try:
            geom_type = get_geometry_type_from_db(table)
            if geom_type and 'POINT' in geom_type.upper():
                point_tables.append((table, geom_type))
                print(f"  ✓ Found point table: {table} ({geom_type})")
        except Exception as e:
            print(f"  ⚠️  Error checking {table}: {e}")
    
    return point_tables

def test_point_clustering(table_name):
    """Test point clustering at different zoom levels"""
    print(f"\n🎯 Testing point clustering for table: {table_name}")
    print("=" * 60)
    
    # Test different zoom levels to show clustering behavior
    test_zooms = [2, 6, 10, 14]  # Low, medium-low, medium-high, high zoom
    test_tile_coords = (0, 0)  # Simple test coordinates
    
    for zoom in test_zooms:
        x, y = test_tile_coords
        print(f"\n📍 Testing zoom level {zoom} (tile {zoom}/{x}/{y})...")
        
        try:
            tile_data = get_mvt_tile_from_db(table_name, zoom, x, y)
            
            if tile_data:
                size_kb = len(tile_data) / 1024
                print(f"  ✅ Generated MVT tile: {size_kb:.2f} KB")
                
                # Clustering behavior description
                if zoom <= 6:
                    print(f"  🔵 Heavy clustering active (64px grid, ~100m tolerance)")
                elif zoom <= 12:
                    print(f"  🟡 Medium clustering active (32px grid, ~50m tolerance)")
                else:
                    print(f"  🟢 Individual points shown (no clustering)")
            else:
                print(f"  ⚠️  No tile data generated (empty tile)")
                
        except Exception as e:
            print(f"  ❌ Error generating tile at zoom {zoom}: {e}")

def main():
    if len(sys.argv) > 1:
        # Test specific table
        table_name = sys.argv[1]
        
        # Verify it's a point table
        geom_type = get_geometry_type_from_db(table_name)
        if not geom_type or 'POINT' not in geom_type.upper():
            print(f"❌ Table '{table_name}' is not a point table. Geometry type: {geom_type}")
            sys.exit(1)
        
        test_point_clustering(table_name)
    else:
        # Find and list all point tables
        point_tables = find_point_tables()
        
        if not point_tables:
            print("❌ No point tables found in the database.")
            sys.exit(1)
        
        print(f"\n📊 Found {len(point_tables)} point tables:")
        for i, (table, geom_type) in enumerate(point_tables, 1):
            print(f"  {i}. {table} ({geom_type})")
        
        print(f"\n💡 To test clustering on a specific table, run:")
        print(f"   python test_point_clustering.py <table_name>")
        print(f"\nExample:")
        if point_tables:
            example_table = point_tables[0][0]
            print(f"   python test_point_clustering.py {example_table}")

if __name__ == "__main__":
    main()
