#!/usr/bin/env python3
"""
Geometry Simplification Script for MVT Tiling Performance

This script adds pre-simplified geometry columns to a table for different zoom levels
to improve MVT tile generation performance. Only works with non-point geometries.

Usage:
    python simplify_geometries.py <table_name>

Example:
    python simplify_geometries.py countries
"""

import sys
import time
import os
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='../../.env.local')

# Get database URL from environment
database_url = os.getenv("DOCKER_DATABASE_URL") or os.getenv("DATABASE_URL")
if not database_url:
    print("❌ No database URL found in environment variables!")
    print("Make sure DOCKER_DATABASE_URL or DATABASE_URL is set in .env.local")
    sys.exit(1)

# Create engine and session factory
engine = create_engine(database_url, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_geometry_type(table_name):
    """Check if the table contains non-point geometries"""
    print(f"🔍 Checking geometry type for table '{table_name}'...")
    
    db = SessionLocal()
    try:
        # Get geometry column name
        geom_col_query = text("""
            SELECT f_geometry_column
            FROM geometry_columns
            WHERE f_table_schema = 'layers' AND f_table_name = :table
        """)
        result = db.execute(geom_col_query, {"table": table_name}).fetchone()
        
        if not result:
            print(f"❌ No geometry column found for table '{table_name}' in layers schema")
            return None, None
            
        geom_column = result[0]
        print(f"✓ Found geometry column: {geom_column}")
        
        # Check geometry type
        geom_type_query = text(f"""
            SELECT DISTINCT ST_GeometryType({geom_column}) AS geom_type
            FROM layers.{table_name}
            WHERE {geom_column} IS NOT NULL
            LIMIT 1
        """)
        result = db.execute(geom_type_query).fetchone()
        
        if not result:
            print(f"❌ No geometries found in table '{table_name}'")
            return None, None
            
        geom_type = result[0]
        print(f"✓ Geometry type: {geom_type}")
        
        # Check if it's point geometry
        if 'POINT' in geom_type.upper():
            print(f"⚠️  Table '{table_name}' contains point geometries. This script is for non-point data only.")
            return None, None
            
        return geom_column, geom_type
    finally:
        db.close()

def add_geometry_columns(table_name, geom_type):
    """Add new geometry columns for different zoom levels"""
    print(f"\n📐 Adding geometry columns to table '{table_name}'...")
    
    # Determine the correct geometry type for the new columns
    if 'MULTIPOLYGON' in geom_type.upper():
        geom_type_sql = 'MultiPolygon'
    elif 'POLYGON' in geom_type.upper():
        geom_type_sql = 'MultiPolygon'  # Convert to MultiPolygon for consistency
    elif 'MULTILINESTRING' in geom_type.upper():
        geom_type_sql = 'MultiLineString'
    elif 'LINESTRING' in geom_type.upper():
        geom_type_sql = 'MultiLineString'  # Convert to MultiLineString for consistency
    else:
        geom_type_sql = 'Geometry'  # Generic fallback
    
    columns = [
        ('geom_z_0_3', 'MVT zooms 0-3'),
        ('geom_z_3_6', 'MVT zooms 4-6'), 
        ('geom_z_6_10', 'MVT zooms 7-9')
    ]
    
    db = SessionLocal()
    try:
        for col_name, description in columns:
            print(f"  📝 Adding column {col_name} for {description}...")
            
            # Check if column already exists
            check_col_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'layers' 
                AND table_name = :table 
                AND column_name = :column
            """)
            existing = db.execute(check_col_query, {"table": table_name, "column": col_name}).fetchone()
            
            if existing:
                print(f"    ⚠️  Column {col_name} already exists, skipping...")
                continue
                
            add_col_query = text(f"""
                ALTER TABLE layers.{table_name}
                ADD COLUMN {col_name} GEOMETRY({geom_type_sql}, 3857)
            """)
            
            start_time = time.time()
            db.execute(add_col_query)
            db.commit()
            elapsed = time.time() - start_time
            print(f"    ✓ Added column {col_name} ({elapsed:.2f}s)")
    finally:
        db.close()

def populate_geometry_columns(table_name, geom_column):
    """
    Populate the new geometry columns with simplified and precision-reduced geometries.
    """
    print(f"\n🔄 Populating simplified geometries for table '{table_name}'...")
    
    # Define simplification tolerances and target precision for 3857 (3 decimal places = ~1mm)
    simplifications = [
        ('geom_z_0_3', 0.00225, 3, 'zooms 0-3 (~250m tolerance, ~1mm precision)'),
        ('geom_z_3_6', 0.001125, 3, 'zooms 4-6 (~125m tolerance, ~1mm precision)'),
        ('geom_z_6_10', 0.00045, 3, 'zooms 7-9 (~50m tolerance, ~1mm precision)')
    ]
    
    db = SessionLocal()
    try:
        for col_name, tolerance, precision, description in simplifications:
            print(f"  🎯 Populating {col_name} for {description}...")
            
            # Check if column is already populated (simple check for any non-NULL values)
            check_query = text(f"""
                SELECT COUNT(*) FROM layers.{table_name} 
                WHERE {col_name} IS NOT NULL
            """)
            existing_count = db.execute(check_query).fetchone()[0]
            
            if existing_count > 0:
                print(f"    ⚠️  Column {col_name} already has {existing_count} records, skipping population.")
                continue
            
            # Updated UPDATE query to include ST_ReducePrecision
            update_query = text(f"""
                UPDATE layers.{table_name}
                SET {col_name} = ST_ReducePrecision(
                    ST_Transform(
                        ST_Multi(ST_SimplifyPreserveTopology(ST_Transform({geom_column}, 4326), :tolerance)),
                        3857
                    ),
                    :precision -- Apply ST_ReducePrecision after simplification and transformation
                )
                WHERE {geom_column} IS NOT NULL
            """)
            
            start_time = time.time()
            result = db.execute(update_query, {"tolerance": tolerance, "precision": precision})
            db.commit()
            elapsed = time.time() - start_time
            
            print(f"    ✓ Updated {result.rowcount} rows in {col_name} ({elapsed:.2f}s)")
    finally:
        db.close()

def create_spatial_indexes(table_name, original_geom_column):
    """
    Create spatial indexes on the new geometry columns and ensure an index
    exists on the original geometry column.
    """
    print(f"\n📊 Creating spatial indexes for table '{table_name}'...")
    
    columns_to_index = ['geom_z_0_3', 'geom_z_3_6', 'geom_z_6_10', original_geom_column]
    
    db = SessionLocal()
    try:
        for col_name in columns_to_index:
            # For the original geom column, use a generic index name or ensure it's predictable
            if col_name == original_geom_column:
                index_name = f"idx_{table_name}_{col_name}" # Example: idx_countries_geom
            else:
                index_name = f"idx_{table_name}_{col_name}"
            
            print(f"  🔍 Creating index {index_name} on {col_name}...")
            
            # Check if index already exists
            check_index_query = text("""
                SELECT indexname FROM pg_indexes 
                WHERE schemaname = 'layers' 
                AND tablename = :table 
                AND indexname = :index
            """)
            existing = db.execute(check_index_query, {"table": table_name, "index": index_name}).fetchone()
            
            if existing:
                print(f"    ⚠️  Index {index_name} already exists, skipping...")
                continue
            
            create_index_query = text(f"""
                CREATE INDEX {index_name} ON layers.{table_name} USING GIST ({col_name})
            """)
            
            start_time = time.time()
            db.execute(create_index_query)
            db.commit()
            elapsed = time.time() - start_time
            print(f"    ✓ Created index {index_name} ({elapsed:.2f}s)")
    finally:
        db.close()

def main():
    if len(sys.argv) != 2:
        print("Usage: python simplify_geometries.py <table_name>")
        print("Example: python simplify_geometries.py countries")
        sys.exit(1)
    
    table_name = sys.argv[1]
    
    print(f"🚀 Starting geometry simplification for table '{table_name}'")
    print("=" * 60)
    
    # Step 1: Check geometry type
    geom_column, geom_type = check_geometry_type(table_name)
    if not geom_column:
        sys.exit(1)
    
    # Step 2: Add geometry columns
    add_geometry_columns(table_name, geom_type)
    
    # Step 3: Populate geometry columns
    populate_geometry_columns(table_name, geom_column)
    
    # Step 4: Create spatial indexes (now passing original_geom_column)
    create_spatial_indexes(table_name, geom_column)
    
    print("\n" + "=" * 60)
    print(f"✅ Geometry simplification completed for table '{table_name}'!")
    print(f"📈 The table now has optimized geometries for MVT tile generation at different zoom levels.")
    print(f"🎯 Use the updated tiling queries to take advantage of these pre-simplified geometries.")

if __name__ == "__main__":
    main()