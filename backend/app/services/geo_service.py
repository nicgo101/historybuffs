"""
Geographic calculations service.
Supports both spherical (WGS84) and flat plane models.
"""
import math
from typing import Tuple, List, Optional
from dataclasses import dataclass


# Earth radius in kilometers
EARTH_RADIUS_KM = 6371.0


@dataclass
class BoundingBox:
    """Geographic bounding box."""
    sw_lng: float  # Southwest longitude
    sw_lat: float  # Southwest latitude
    ne_lng: float  # Northeast longitude
    ne_lat: float  # Northeast latitude

    def contains(self, lng: float, lat: float) -> bool:
        """Check if a point is within the bounding box."""
        return (
            self.sw_lng <= lng <= self.ne_lng and
            self.sw_lat <= lat <= self.ne_lat
        )


def haversine_distance(
    lng1: float, lat1: float,
    lng2: float, lat2: float
) -> float:
    """
    Calculate great-circle distance between two points using Haversine formula.

    Args:
        lng1, lat1: First point (longitude, latitude in degrees)
        lng2, lat2: Second point (longitude, latitude in degrees)

    Returns:
        Distance in kilometers
    """
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    # Haversine formula
    a = (
        math.sin(delta_lat / 2) ** 2 +
        math.cos(lat1_rad) * math.cos(lat2_rad) *
        math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c


def euclidean_distance(
    x1: float, y1: float,
    x2: float, y2: float
) -> float:
    """
    Calculate flat plane Euclidean distance.
    Assumes coordinates are in the same unit (km or degrees).

    For lat/lng, this is approximate and only suitable for small areas.
    """
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def calculate_distance(
    lng1: float, lat1: float,
    lng2: float, lat2: float,
    model: str = "spherical"
) -> float:
    """
    Calculate distance between two points.

    Args:
        lng1, lat1: First point
        lng2, lat2: Second point
        model: "spherical" for Haversine, "flat" for Euclidean

    Returns:
        Distance in kilometers
    """
    if model == "flat":
        # For flat model, convert degrees to approximate km
        # 1 degree latitude ≈ 111 km
        # 1 degree longitude ≈ 111 km * cos(latitude)
        avg_lat = (lat1 + lat2) / 2
        x1_km = lng1 * 111.32 * math.cos(math.radians(avg_lat))
        y1_km = lat1 * 110.574
        x2_km = lng2 * 111.32 * math.cos(math.radians(avg_lat))
        y2_km = lat2 * 110.574
        return euclidean_distance(x1_km, y1_km, x2_km, y2_km)
    else:
        return haversine_distance(lng1, lat1, lng2, lat2)


def expand_bounds(
    center_lng: float,
    center_lat: float,
    radius_km: float
) -> BoundingBox:
    """
    Create a bounding box around a center point.
    Used for initial filtering before precise distance calculation.
    """
    # Approximate degrees per km
    lat_delta = radius_km / 110.574
    lng_delta = radius_km / (111.32 * math.cos(math.radians(center_lat)))

    return BoundingBox(
        sw_lng=center_lng - lng_delta,
        sw_lat=center_lat - lat_delta,
        ne_lng=center_lng + lng_delta,
        ne_lat=center_lat + lat_delta,
    )


def create_circle_polygon(
    center_lng: float,
    center_lat: float,
    radius_km: float,
    num_points: int = 64
) -> List[List[float]]:
    """
    Create a GeoJSON polygon approximating a circle.
    Used for uncertainty visualization.

    Returns:
        List of [lng, lat] coordinates forming a closed polygon
    """
    coords = []

    # Convert radius to degrees (approximate)
    lat_delta = radius_km / 110.574
    lng_delta = radius_km / (111.32 * math.cos(math.radians(center_lat)))

    for i in range(num_points):
        theta = (i / num_points) * (2 * math.pi)
        lng = center_lng + lng_delta * math.cos(theta)
        lat = center_lat + lat_delta * math.sin(theta)
        coords.append([lng, lat])

    # Close the polygon
    coords.append(coords[0])

    return coords


def point_in_polygon(
    lng: float,
    lat: float,
    polygon: List[List[float]]
) -> bool:
    """
    Check if a point is inside a polygon using ray casting algorithm.

    Args:
        lng, lat: Point to check
        polygon: List of [lng, lat] coordinates

    Returns:
        True if point is inside polygon
    """
    n = len(polygon)
    inside = False

    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]

        if ((yi > lat) != (yj > lat)) and (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i

    return inside
