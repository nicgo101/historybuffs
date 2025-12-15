"""
Map service - handles data fetching and transformation for the map view.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from supabase import Client

from app.services.geo_service import (
    calculate_distance,
    expand_bounds,
    BoundingBox,
    create_circle_polygon,
)


class MapService:
    """Service for map-related data operations."""

    def __init__(self, db: Client):
        self.db = db

    async def get_factoids_for_map(
        self,
        layers: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        bounds: Optional[BoundingBox] = None,
        frame_id: Optional[UUID] = None,
        limit: int = 500,
    ) -> List[Dict[str, Any]]:
        """
        Fetch factoids with location data for map display.

        Args:
            layers: Filter by epistemological layer (documented, attested, inferred)
            categories: Filter by factoid category
            bounds: Geographic bounding box filter
            frame_id: Reference frame for date placements
            limit: Maximum number of results

        Returns:
            List of factoids with location data formatted for map display
        """
        # Build query for factoids with locations
        query = self.db.table("factoids").select(
            """
            id,
            summary,
            description,
            layer,
            factoid_type,
            community_confidence,
            factoid_locations!inner (
                relationship,
                location:locations (
                    id,
                    name_modern,
                    name_historical,
                    coordinate_x,
                    coordinate_y,
                    location_type,
                    location_subtype,
                    uncertainty_radius_km
                )
            )
            """
        ).is_("deleted_at", "null")

        # Apply layer filter
        if layers:
            query = query.in_("layer", layers)

        # Apply category filter
        if categories:
            query = query.in_("factoid_type", categories)

        # Apply limit
        query = query.limit(limit)

        result = query.execute()

        # Transform to map format
        map_factoids = []
        for factoid in result.data or []:
            # Get location from the join
            factoid_locations = factoid.get("factoid_locations", [])
            if not factoid_locations:
                continue

            for fl in factoid_locations:
                location = fl.get("location")
                if not location:
                    continue

                # Skip if no coordinates
                coord_x = location.get("coordinate_x")
                coord_y = location.get("coordinate_y")
                if coord_x is None or coord_y is None:
                    continue

                # Apply bounds filter (post-query for simplicity)
                if bounds and not bounds.contains(float(coord_x), float(coord_y)):
                    continue

                # Get historical name for display period (if any)
                historical_names = location.get("name_historical", [])
                name_historical = None
                if historical_names and len(historical_names) > 0:
                    # Just use first historical name for now
                    name_historical = historical_names[0].get("name") if isinstance(historical_names[0], dict) else historical_names[0]

                map_factoid = {
                    "id": factoid["id"],
                    "summary": factoid.get("summary") or factoid.get("description", "")[:100],
                    "description": factoid.get("description"),
                    "layer": factoid.get("layer", "attested"),
                    "confidence": float(factoid.get("community_confidence", 0)) if factoid.get("community_confidence") else None,
                    "category": factoid.get("factoid_type"),
                    "location": {
                        "id": location["id"],
                        "name": location.get("name_modern") or "Unknown",
                        "nameHistorical": name_historical,
                        "coordinates": [float(coord_x), float(coord_y)],
                        "uncertaintyRadiusKm": float(location.get("uncertainty_radius_km", 0)) if location.get("uncertainty_radius_km") else None,
                        "locationType": location.get("location_type", "point"),
                        "locationSubtype": location.get("location_subtype"),
                    }
                }
                map_factoids.append(map_factoid)

        return map_factoids

    async def get_journey_routes(
        self,
        route_types: Optional[List[str]] = None,
        bounds: Optional[BoundingBox] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Fetch journey routes for map display.

        Args:
            route_types: Filter by route type (travel, campaign, migration, etc.)
            bounds: Geographic bounding box filter
            limit: Maximum number of results

        Returns:
            List of journey routes formatted for map display
        """
        query = self.db.table("journey_routes").select(
            """
            id,
            name,
            description,
            route_type,
            travel_mode,
            route_geojson,
            color,
            line_style,
            start_location:start_location_id (name_modern, coordinate_x, coordinate_y),
            end_location:end_location_id (name_modern, coordinate_x, coordinate_y),
            waypoints
            """
        ).is_("deleted_at", "null")

        if route_types:
            query = query.in_("route_type", route_types)

        query = query.limit(limit)
        result = query.execute()

        routes = []
        for route in result.data or []:
            # Get coordinates from route_geojson or build from waypoints
            coordinates = []

            if route.get("route_geojson"):
                # Use pre-computed route
                geojson = route["route_geojson"]
                if isinstance(geojson, dict) and "coordinates" in geojson:
                    coordinates = geojson["coordinates"]
            else:
                # Build from start/end/waypoints
                if route.get("start_location"):
                    start = route["start_location"]
                    if start.get("coordinate_x") and start.get("coordinate_y"):
                        coordinates.append([
                            float(start["coordinate_x"]),
                            float(start["coordinate_y"])
                        ])

                # Add waypoints
                waypoints = route.get("waypoints", [])
                for wp in waypoints:
                    if isinstance(wp, dict) and "coordinates" in wp:
                        coordinates.append(wp["coordinates"])

                if route.get("end_location"):
                    end = route["end_location"]
                    if end.get("coordinate_x") and end.get("coordinate_y"):
                        coordinates.append([
                            float(end["coordinate_x"]),
                            float(end["coordinate_y"])
                        ])

            if len(coordinates) < 2:
                continue  # Need at least 2 points for a route

            routes.append({
                "id": route["id"],
                "name": route.get("name", "Unnamed Route"),
                "description": route.get("description"),
                "routeType": route.get("route_type", "travel"),
                "coordinates": coordinates,
                "color": route.get("color"),
                "lineStyle": route.get("line_style", "solid"),
            })

        return routes

    async def get_historical_overlays(
        self,
        bounds: Optional[BoundingBox] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Fetch available historical map overlays.

        Args:
            bounds: Geographic bounding box filter
            limit: Maximum number of results

        Returns:
            List of historical map overlays formatted for map display
        """
        query = self.db.table("historical_maps").select(
            """
            id,
            name,
            description,
            tile_url_template,
            bounds_sw_x,
            bounds_sw_y,
            bounds_ne_x,
            bounds_ne_y,
            min_zoom,
            max_zoom,
            is_georeferenced
            """
        ).is_("deleted_at", "null").eq("is_georeferenced", True)

        query = query.limit(limit)
        result = query.execute()

        overlays = []
        for overlay in result.data or []:
            if not overlay.get("tile_url_template"):
                continue

            overlays.append({
                "id": overlay["id"],
                "name": overlay.get("name", "Historical Map"),
                "tileUrl": overlay["tile_url_template"],
                "bounds": [
                    [
                        float(overlay.get("bounds_sw_x", -180)),
                        float(overlay.get("bounds_sw_y", -90))
                    ],
                    [
                        float(overlay.get("bounds_ne_x", 180)),
                        float(overlay.get("bounds_ne_y", 90))
                    ]
                ],
                "minZoom": overlay.get("min_zoom", 0),
                "maxZoom": overlay.get("max_zoom", 18),
                "opacity": 0.7,  # Default opacity
            })

        return overlays

    async def search_locations(
        self,
        query: str,
        center_lng: Optional[float] = None,
        center_lat: Optional[float] = None,
        radius_km: Optional[float] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search locations by name with optional proximity filtering.

        Args:
            query: Search text (matches modern or historical names)
            center_lng, center_lat: Center point for proximity search
            radius_km: Maximum distance from center
            limit: Maximum number of results

        Returns:
            List of matching locations with distance if center provided
        """
        # Text search on location names
        db_query = self.db.table("locations").select(
            """
            id,
            name_modern,
            name_historical,
            coordinate_x,
            coordinate_y,
            location_type,
            location_subtype,
            uncertainty_radius_km
            """
        ).is_("deleted_at", "null").ilike("name_modern", f"%{query}%")

        db_query = db_query.limit(limit * 2)  # Fetch extra for filtering
        result = db_query.execute()

        locations = []
        for loc in result.data or []:
            coord_x = loc.get("coordinate_x")
            coord_y = loc.get("coordinate_y")

            if coord_x is None or coord_y is None:
                continue

            distance = None
            if center_lng is not None and center_lat is not None:
                distance = calculate_distance(
                    center_lng, center_lat,
                    float(coord_x), float(coord_y)
                )
                # Filter by radius
                if radius_km and distance > radius_km:
                    continue

            locations.append({
                "id": loc["id"],
                "name": loc.get("name_modern") or "Unknown",
                "nameHistorical": loc.get("name_historical"),
                "coordinates": [float(coord_x), float(coord_y)],
                "locationType": loc.get("location_type", "point"),
                "locationSubtype": loc.get("location_subtype"),
                "uncertaintyRadiusKm": float(loc.get("uncertainty_radius_km", 0)) if loc.get("uncertainty_radius_km") else None,
                "distanceKm": round(distance, 2) if distance else None,
            })

        # Sort by distance if searching by proximity
        if center_lng is not None:
            locations.sort(key=lambda x: x.get("distanceKm") or float("inf"))

        return locations[:limit]

    async def get_locations_within_radius(
        self,
        center_lng: float,
        center_lat: float,
        radius_km: float,
        model: str = "spherical",
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Find all locations within a radius of a point.

        Args:
            center_lng, center_lat: Center point
            radius_km: Search radius in kilometers
            model: Distance calculation model ("spherical" or "flat")
            limit: Maximum number of results

        Returns:
            List of locations with distance from center
        """
        # Get bounding box for initial filter
        bounds = expand_bounds(center_lng, center_lat, radius_km)

        # Query locations within bounding box
        query = self.db.table("locations").select(
            """
            id,
            name_modern,
            name_historical,
            coordinate_x,
            coordinate_y,
            location_type,
            location_subtype,
            uncertainty_radius_km
            """
        ).is_("deleted_at", "null")

        # Apply rough bounding box filter
        query = query.gte("coordinate_x", bounds.sw_lng)
        query = query.lte("coordinate_x", bounds.ne_lng)
        query = query.gte("coordinate_y", bounds.sw_lat)
        query = query.lte("coordinate_y", bounds.ne_lat)

        result = query.execute()

        # Filter by precise distance
        locations = []
        for loc in result.data or []:
            coord_x = loc.get("coordinate_x")
            coord_y = loc.get("coordinate_y")

            if coord_x is None or coord_y is None:
                continue

            distance = calculate_distance(
                center_lng, center_lat,
                float(coord_x), float(coord_y),
                model=model
            )

            if distance <= radius_km:
                locations.append({
                    "id": loc["id"],
                    "name": loc.get("name_modern") or "Unknown",
                    "nameHistorical": loc.get("name_historical"),
                    "coordinates": [float(coord_x), float(coord_y)],
                    "locationType": loc.get("location_type", "point"),
                    "uncertaintyRadiusKm": float(loc.get("uncertainty_radius_km", 0)) if loc.get("uncertainty_radius_km") else None,
                    "distanceKm": round(distance, 2),
                })

        # Sort by distance
        locations.sort(key=lambda x: x["distanceKm"])

        return locations[:limit]

    async def get_bulk_locations(
        self,
        location_types: Optional[List[str]] = None,
        bounds: Optional[BoundingBox] = None,
        limit: int = 50000,
    ) -> List[Dict[str, Any]]:
        """
        Fetch all locations for bulk map rendering (cluster layer).

        Optimized for returning large numbers of locations with minimal data.

        Args:
            location_types: Filter by location type
            bounds: Geographic bounding box filter
            limit: Maximum number of results (default 50k)

        Returns:
            List of simplified locations for cluster rendering
        """
        # Select only essential fields for performance
        query = self.db.table("locations").select(
            """
            id,
            name_modern,
            coordinate_x,
            coordinate_y,
            location_type
            """
        ).is_("deleted_at", "null")

        # Apply type filter
        if location_types:
            query = query.in_("location_type", location_types)

        # Apply bounds filter at database level for efficiency
        if bounds:
            query = query.gte("coordinate_x", bounds.sw_lng)
            query = query.lte("coordinate_x", bounds.ne_lng)
            query = query.gte("coordinate_y", bounds.sw_lat)
            query = query.lte("coordinate_y", bounds.ne_lat)

        # Ensure we only get locations with coordinates
        query = query.not_.is_("coordinate_x", "null")
        query = query.not_.is_("coordinate_y", "null")

        query = query.limit(limit)
        result = query.execute()

        # Transform to minimal format
        locations = []
        for loc in result.data or []:
            coord_x = loc.get("coordinate_x")
            coord_y = loc.get("coordinate_y")

            if coord_x is None or coord_y is None:
                continue

            locations.append({
                "id": loc["id"],
                "name": loc.get("name_modern") or "Unknown",
                "coordinates": [float(coord_x), float(coord_y)],
                "type": loc.get("location_type", "unknown"),
            })

        return locations
