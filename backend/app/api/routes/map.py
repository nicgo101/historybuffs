"""
Map API endpoints - Geographic data for map visualization.
"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.services.map_service import MapService
from app.services.geo_service import BoundingBox, calculate_distance


router = APIRouter()


# ============================================
# Response Models
# ============================================

class MapLocation(BaseModel):
    """Location data for map display."""
    id: str
    name: str
    nameHistorical: Optional[str] = None
    coordinates: List[float] = Field(..., description="[longitude, latitude]")
    uncertaintyRadiusKm: Optional[float] = None
    locationType: str = "point"
    locationSubtype: Optional[str] = None
    distanceKm: Optional[float] = None


class MapFactoid(BaseModel):
    """Factoid data for map markers."""
    id: str
    summary: str
    description: Optional[str] = None
    layer: str  # documented, attested, inferred
    confidence: Optional[float] = None
    category: Optional[str] = None
    dateStart: Optional[str] = None
    dateEnd: Optional[str] = None
    location: MapLocation


class JourneyRoute(BaseModel):
    """Journey route data for map lines."""
    id: str
    name: str
    description: Optional[str] = None
    routeType: str  # travel, campaign, migration, trade_route, pilgrimage
    coordinates: List[List[float]] = Field(..., description="Array of [lng, lat]")
    color: Optional[str] = None
    lineStyle: Optional[str] = "solid"


class HistoricalOverlay(BaseModel):
    """Historical map overlay data."""
    id: str
    name: str
    tileUrl: str
    bounds: List[List[float]] = Field(..., description="[[sw_lng, sw_lat], [ne_lng, ne_lat]]")
    minZoom: int = 0
    maxZoom: int = 18
    opacity: float = 0.7


class MapDataResponse(BaseModel):
    """Combined map data response."""
    factoids: List[MapFactoid]
    routes: List[JourneyRoute]
    overlays: List[HistoricalOverlay]


class DistanceResult(BaseModel):
    """Distance calculation result."""
    spherical_km: float
    flat_km: float
    difference_km: float
    difference_percent: float


# ============================================
# Endpoints
# ============================================

@router.get("/factoids", response_model=List[MapFactoid])
async def get_map_factoids(
    layers: Optional[str] = Query(None, description="Comma-separated layers: documented,attested,inferred"),
    categories: Optional[str] = Query(None, description="Comma-separated categories"),
    sw_lng: Optional[float] = Query(None, description="Southwest longitude"),
    sw_lat: Optional[float] = Query(None, description="Southwest latitude"),
    ne_lng: Optional[float] = Query(None, description="Northeast longitude"),
    ne_lat: Optional[float] = Query(None, description="Northeast latitude"),
    frame_id: Optional[UUID] = Query(None, description="Reference frame for dates"),
    limit: int = Query(500, le=1000),
    db=Depends(get_db),
):
    """
    Get factoids with location data for map display.

    Filters:
    - layers: Epistemological layers (documented, attested, inferred)
    - categories: Factoid types/categories
    - bounds: Geographic bounding box (sw_lng, sw_lat, ne_lng, ne_lat)
    - frame_id: Reference frame for retrieving date placements
    """
    service = MapService(db)

    # Parse comma-separated filters
    layer_list = layers.split(",") if layers else None
    category_list = categories.split(",") if categories else None

    # Build bounds if provided
    bounds = None
    if all(v is not None for v in [sw_lng, sw_lat, ne_lng, ne_lat]):
        bounds = BoundingBox(
            sw_lng=sw_lng,
            sw_lat=sw_lat,
            ne_lng=ne_lng,
            ne_lat=ne_lat,
        )

    factoids = await service.get_factoids_for_map(
        layers=layer_list,
        categories=category_list,
        bounds=bounds,
        frame_id=frame_id,
        limit=limit,
    )

    return factoids


@router.get("/routes", response_model=List[JourneyRoute])
async def get_journey_routes(
    types: Optional[str] = Query(None, description="Comma-separated route types: travel,campaign,migration,trade_route,pilgrimage"),
    sw_lng: Optional[float] = Query(None),
    sw_lat: Optional[float] = Query(None),
    ne_lng: Optional[float] = Query(None),
    ne_lat: Optional[float] = Query(None),
    limit: int = Query(100, le=500),
    db=Depends(get_db),
):
    """
    Get journey routes for map display.

    Route types:
    - travel: Personal journeys
    - campaign: Military campaigns
    - migration: Population movements
    - trade_route: Trade routes
    - pilgrimage: Religious journeys
    """
    service = MapService(db)

    type_list = types.split(",") if types else None

    bounds = None
    if all(v is not None for v in [sw_lng, sw_lat, ne_lng, ne_lat]):
        bounds = BoundingBox(
            sw_lng=sw_lng,
            sw_lat=sw_lat,
            ne_lng=ne_lng,
            ne_lat=ne_lat,
        )

    routes = await service.get_journey_routes(
        route_types=type_list,
        bounds=bounds,
        limit=limit,
    )

    return routes


@router.get("/overlays", response_model=List[HistoricalOverlay])
async def get_historical_overlays(
    sw_lng: Optional[float] = Query(None),
    sw_lat: Optional[float] = Query(None),
    ne_lng: Optional[float] = Query(None),
    ne_lat: Optional[float] = Query(None),
    limit: int = Query(20, le=50),
    db=Depends(get_db),
):
    """
    Get available historical map overlays.

    Returns georeferenced historical maps that can be overlaid on the modern map.
    """
    service = MapService(db)

    bounds = None
    if all(v is not None for v in [sw_lng, sw_lat, ne_lng, ne_lat]):
        bounds = BoundingBox(
            sw_lng=sw_lng,
            sw_lat=sw_lat,
            ne_lng=ne_lng,
            ne_lat=ne_lat,
        )

    overlays = await service.get_historical_overlays(
        bounds=bounds,
        limit=limit,
    )

    return overlays


@router.get("/data", response_model=MapDataResponse)
async def get_all_map_data(
    layers: Optional[str] = Query(None),
    categories: Optional[str] = Query(None),
    route_types: Optional[str] = Query(None),
    sw_lng: Optional[float] = Query(None),
    sw_lat: Optional[float] = Query(None),
    ne_lng: Optional[float] = Query(None),
    ne_lat: Optional[float] = Query(None),
    frame_id: Optional[UUID] = Query(None),
    db=Depends(get_db),
):
    """
    Get all map data in a single request.

    Combines factoids, routes, and overlays for efficient loading.
    """
    service = MapService(db)

    layer_list = layers.split(",") if layers else None
    category_list = categories.split(",") if categories else None
    route_type_list = route_types.split(",") if route_types else None

    bounds = None
    if all(v is not None for v in [sw_lng, sw_lat, ne_lng, ne_lat]):
        bounds = BoundingBox(
            sw_lng=sw_lng,
            sw_lat=sw_lat,
            ne_lng=ne_lng,
            ne_lat=ne_lat,
        )

    # Fetch all data
    factoids = await service.get_factoids_for_map(
        layers=layer_list,
        categories=category_list,
        bounds=bounds,
        frame_id=frame_id,
    )

    routes = await service.get_journey_routes(
        route_types=route_type_list,
        bounds=bounds,
    )

    overlays = await service.get_historical_overlays(bounds=bounds)

    return MapDataResponse(
        factoids=factoids,
        routes=routes,
        overlays=overlays,
    )


@router.get("/search", response_model=List[MapLocation])
async def search_locations(
    q: str = Query(..., min_length=2, description="Search query"),
    center_lng: Optional[float] = Query(None, description="Center longitude for proximity search"),
    center_lat: Optional[float] = Query(None, description="Center latitude for proximity search"),
    radius_km: Optional[float] = Query(None, description="Search radius in km"),
    limit: int = Query(20, le=100),
    db=Depends(get_db),
):
    """
    Search locations by name.

    Optionally filter by proximity to a center point.
    """
    service = MapService(db)

    locations = await service.search_locations(
        query=q,
        center_lng=center_lng,
        center_lat=center_lat,
        radius_km=radius_km,
        limit=limit,
    )

    return locations


@router.get("/nearby", response_model=List[MapLocation])
async def get_nearby_locations(
    lng: float = Query(..., description="Center longitude"),
    lat: float = Query(..., description="Center latitude"),
    radius_km: float = Query(50, description="Search radius in km"),
    model: str = Query("spherical", description="Distance model: spherical or flat"),
    limit: int = Query(100, le=500),
    db=Depends(get_db),
):
    """
    Find locations within a radius of a point.

    Supports both spherical (Haversine) and flat (Euclidean) distance models.
    """
    service = MapService(db)

    locations = await service.get_locations_within_radius(
        center_lng=lng,
        center_lat=lat,
        radius_km=radius_km,
        model=model,
        limit=limit,
    )

    return locations


@router.get("/distance", response_model=DistanceResult)
async def calculate_distance_between_points(
    lng1: float = Query(..., description="First point longitude"),
    lat1: float = Query(..., description="First point latitude"),
    lng2: float = Query(..., description="Second point longitude"),
    lat2: float = Query(..., description="Second point latitude"),
):
    """
    Calculate distance between two points using both models.

    Returns spherical (Haversine) and flat (Euclidean) distances
    for comparison and transparency.
    """
    spherical = calculate_distance(lng1, lat1, lng2, lat2, model="spherical")
    flat = calculate_distance(lng1, lat1, lng2, lat2, model="flat")

    difference = abs(spherical - flat)
    percent_diff = (difference / spherical * 100) if spherical > 0 else 0

    return DistanceResult(
        spherical_km=round(spherical, 2),
        flat_km=round(flat, 2),
        difference_km=round(difference, 2),
        difference_percent=round(percent_diff, 2),
    )


# ============================================
# Bulk Location Endpoint (for cluster layer)
# ============================================

class BulkLocation(BaseModel):
    """Simplified location for bulk rendering."""
    id: str
    name: str
    coordinates: List[float] = Field(..., description="[longitude, latitude]")
    type: Optional[str] = None


@router.get("/locations", response_model=List[BulkLocation])
async def get_bulk_locations(
    types: Optional[str] = Query(None, description="Comma-separated location types"),
    sw_lng: Optional[float] = Query(None),
    sw_lat: Optional[float] = Query(None),
    ne_lng: Optional[float] = Query(None),
    ne_lat: Optional[float] = Query(None),
    limit: int = Query(50000, le=100000, description="Max locations to return"),
    db=Depends(get_db),
):
    """
    Get all locations for bulk map rendering (cluster layer).

    Returns simplified location data optimized for WebGL rendering.
    Can handle 100k+ locations efficiently.
    """
    service = MapService(db)

    type_list = types.split(",") if types else None

    bounds = None
    if all(v is not None for v in [sw_lng, sw_lat, ne_lng, ne_lat]):
        bounds = BoundingBox(
            sw_lng=sw_lng,
            sw_lat=sw_lat,
            ne_lng=ne_lng,
            ne_lat=ne_lat,
        )

    locations = await service.get_bulk_locations(
        location_types=type_list,
        bounds=bounds,
        limit=limit,
    )

    return locations
