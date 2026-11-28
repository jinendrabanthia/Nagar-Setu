# Database & PostGIS Spatial Standards — Nagar-Setu

## 1. Database Engine & Schema
- PostgreSQL 16 with PostGIS 3.4 extension.
- Always use WGS 84 spatial reference system (`SRID=4326`).
- Spatial columns use `geometry(Point, 4326)` for cameras and incidents, and `geometry(Polygon, 4326)` for municipal boundary polygons.

## 2. Spatial Indexing & Performance
- Every spatial column MUST have a `GIST` index:
  `CREATE INDEX idx_<table_name>_<column_name> ON <table_name> USING GIST (<column_name>);`
- Spatial distance queries must use `ST_DWithin` with geography casting or bounding box pre-filtering (`&&` operator).
- Hotspot clustering must leverage PostGIS `ST_ClusterDBSCAN` with calibrated `eps` and `minpoints`.

## 3. Migration Rules (Alembic)
- All schema modifications must occur via Alembic migrations in `apps/api/alembic/versions/`.
- Migrations must be reversible (`upgrade` and `downgrade` implemented).
- Never rename existing production columns without a phased deprecation strategy.
- Set `lock_timeout = '2s'` on migrations altering heavily queried tables.
