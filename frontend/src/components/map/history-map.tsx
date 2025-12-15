'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl, { Map, Marker, Popup, LngLatLike } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Types for our map data
export interface MapLocation {
  id: string
  name: string
  nameHistorical?: string
  coordinates: [number, number] // [lng, lat]
  uncertaintyRadiusKm?: number
  locationType: 'point' | 'area' | 'linear'
  locationSubtype?: string
}

export interface MapFactoid {
  id: string
  summary: string
  description?: string
  layer: 'documented' | 'attested' | 'inferred'
  confidence?: number
  location: MapLocation
  dateStart?: string
  dateEnd?: string
  category?: string
}

export interface JourneyRoute {
  id: string
  name: string
  description?: string
  routeType: 'travel' | 'campaign' | 'migration' | 'trade_route' | 'pilgrimage'
  coordinates: [number, number][] // Array of [lng, lat]
  color?: string
}

export interface HistoricalMapOverlay {
  id: string
  name: string
  tileUrl: string
  bounds: [[number, number], [number, number]] // [[sw_lng, sw_lat], [ne_lng, ne_lat]]
  minZoom?: number
  maxZoom?: number
  opacity?: number
}

interface HistoryMapProps {
  factoids?: MapFactoid[]
  journeyRoutes?: JourneyRoute[]
  historicalOverlays?: HistoricalMapOverlay[]
  initialCenter?: [number, number]
  initialZoom?: number
  onFactoidClick?: (factoid: MapFactoid) => void
  onMapClick?: (lngLat: { lng: number; lat: number }) => void
  showUncertainty?: boolean
  className?: string
}

// Route type colors
const ROUTE_COLORS: Record<string, string> = {
  travel: '#6B7280',      // gray
  campaign: '#DC2626',    // red
  migration: '#7C3AED',   // purple
  trade_route: '#D97706', // amber
  pilgrimage: '#059669',  // green
}

// Layer colors based on confidence/layer type
const LAYER_COLORS: Record<string, string> = {
  documented: '#7c2d12', // primary burgundy
  attested: '#b45309',   // accent gold
  inferred: '#6b7280',   // muted gray
}

export function HistoryMap({
  factoids = [],
  journeyRoutes = [],
  historicalOverlays = [],
  initialCenter = [35.0, 31.5], // Default to Middle East/Mediterranean
  initialZoom = 4,
  onFactoidClick,
  onMapClick,
  showUncertainty = true,
  className = '',
}: HistoryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'HistoryBuff Archival',
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: {
              'raster-saturation': -0.3, // Desaturate for archival feel
              'raster-brightness-min': 0.1,
              'raster-contrast': 0.1,
            },
          },
        ],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      },
      center: initialCenter as LngLatLike,
      zoom: initialZoom,
      attributionControl: true,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    map.current.on('click', (e) => {
      if (onMapClick) {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat })
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [initialCenter, initialZoom, onMapClick])

  // Add journey routes
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove existing route layers
    journeyRoutes.forEach((route) => {
      if (map.current?.getLayer(`route-${route.id}`)) {
        map.current.removeLayer(`route-${route.id}`)
      }
      if (map.current?.getSource(`route-${route.id}`)) {
        map.current.removeSource(`route-${route.id}`)
      }
    })

    // Add new routes
    journeyRoutes.forEach((route) => {
      if (!map.current) return

      map.current.addSource(`route-${route.id}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            name: route.name,
            type: route.routeType,
          },
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates,
          },
        },
      })

      map.current.addLayer({
        id: `route-${route.id}`,
        type: 'line',
        source: `route-${route.id}`,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': route.color || ROUTE_COLORS[route.routeType] || '#6B7280',
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': route.routeType === 'pilgrimage' ? [2, 2] : [1],
        },
      })
    })
  }, [journeyRoutes, mapLoaded])

  // Add uncertainty circles and factoid markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Remove existing uncertainty layers
    factoids.forEach((factoid) => {
      if (map.current?.getLayer(`uncertainty-${factoid.id}`)) {
        map.current.removeLayer(`uncertainty-${factoid.id}`)
      }
      if (map.current?.getSource(`uncertainty-${factoid.id}`)) {
        map.current.removeSource(`uncertainty-${factoid.id}`)
      }
    })

    // Add uncertainty circles and markers
    factoids.forEach((factoid) => {
      if (!map.current) return
      const { location } = factoid

      // Add uncertainty circle if present
      if (showUncertainty && location.uncertaintyRadiusKm && location.uncertaintyRadiusKm > 0) {
        const circle = createGeoJSONCircle(
          location.coordinates,
          location.uncertaintyRadiusKm
        )

        map.current.addSource(`uncertainty-${factoid.id}`, {
          type: 'geojson',
          data: circle,
        })

        map.current.addLayer({
          id: `uncertainty-${factoid.id}`,
          type: 'fill',
          source: `uncertainty-${factoid.id}`,
          paint: {
            'fill-color': LAYER_COLORS[factoid.layer] || '#6b7280',
            'fill-opacity': 0.15,
          },
        })
      }

      // Create marker element
      const el = document.createElement('div')
      el.className = 'history-map-marker'
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${LAYER_COLORS[factoid.layer] || '#6b7280'};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      `
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)'
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
      })

      // Create popup
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        className: 'history-map-popup',
      }).setHTML(`
        <div style="font-family: var(--font-body), system-ui, sans-serif; max-width: 250px;">
          <h3 style="font-family: var(--font-serif), Georgia, serif; font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; color: #1f1f1f;">
            ${factoid.summary}
          </h3>
          <p style="font-size: 0.75rem; color: #666; margin: 0 0 8px 0;">
            ${location.name}${location.nameHistorical ? ` (${location.nameHistorical})` : ''}
          </p>
          ${factoid.confidence ? `
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
              <span style="color: #b45309; font-weight: 500;">${Math.round(factoid.confidence * 100)}% confidence</span>
              <span style="color: #999;">•</span>
              <span style="color: #666; text-transform: capitalize;">${factoid.layer}</span>
            </div>
          ` : ''}
        </div>
      `)

      // Create marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(location.coordinates as LngLatLike)
        .setPopup(popup)
        .addTo(map.current)

      // Handle click
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        if (onFactoidClick) {
          onFactoidClick(factoid)
        }
      })

      markersRef.current.push(marker)
    })
  }, [factoids, mapLoaded, showUncertainty, onFactoidClick])

  // Add historical map overlays
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    historicalOverlays.forEach((overlay) => {
      if (!map.current) return

      // Remove existing if present
      if (map.current.getLayer(`overlay-${overlay.id}`)) {
        map.current.removeLayer(`overlay-${overlay.id}`)
      }
      if (map.current.getSource(`overlay-${overlay.id}`)) {
        map.current.removeSource(`overlay-${overlay.id}`)
      }

      // Add raster source
      map.current.addSource(`overlay-${overlay.id}`, {
        type: 'raster',
        tiles: [overlay.tileUrl],
        bounds: [...overlay.bounds[0], ...overlay.bounds[1]],
        minzoom: overlay.minZoom || 0,
        maxzoom: overlay.maxZoom || 18,
        tileSize: 256,
      })

      // Add layer (below markers, above base)
      map.current.addLayer(
        {
          id: `overlay-${overlay.id}`,
          type: 'raster',
          source: `overlay-${overlay.id}`,
          paint: {
            'raster-opacity': overlay.opacity ?? 0.7,
          },
        },
        'osm-tiles-layer' // Add above base layer
      )
    })
  }, [historicalOverlays, mapLoaded])

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  )
}

// Helper function to create GeoJSON circle for uncertainty visualization
function createGeoJSONCircle(
  center: [number, number],
  radiusKm: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = []
  const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180))
  const distanceY = radiusKm / 110.574

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)
    coords.push([center[0] + x, center[1] + y])
  }
  coords.push(coords[0]) // Close the polygon

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}

export default HistoryMap
