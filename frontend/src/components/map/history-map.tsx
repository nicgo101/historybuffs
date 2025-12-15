'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl, { Map, Marker, Popup, LngLatLike, GeoJSONSource } from 'maplibre-gl'
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

// Simplified location for bulk rendering (cluster layer)
export interface BulkLocation {
  id: string
  name: string
  coordinates: [number, number]
  type?: string // location type or category
}

interface HistoryMapProps {
  /** Bulk locations for cluster layer (can handle 100k+) */
  locations?: BulkLocation[]
  /** Featured factoids for DOM marker layer (lens-filtered, max ~200) */
  featuredFactoids?: MapFactoid[]
  /** Legacy: factoids to display (will use cluster layer if >threshold) */
  factoids?: MapFactoid[]
  journeyRoutes?: JourneyRoute[]
  historicalOverlays?: HistoricalMapOverlay[]
  initialCenter?: [number, number]
  initialZoom?: number
  onFactoidClick?: (factoid: MapFactoid) => void
  onLocationClick?: (location: BulkLocation) => void
  onMapClick?: (lngLat: { lng: number; lat: number }) => void
  showUncertainty?: boolean
  /** Threshold for switching from DOM markers to clusters (default: 500) */
  clusterThreshold?: number
  className?: string
}

// Maximum DOM markers to render (safety cap)
const MAX_DOM_MARKERS = 200

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
  locations = [],
  featuredFactoids = [],
  factoids = [],
  journeyRoutes = [],
  historicalOverlays = [],
  initialCenter = [35.0, 31.5], // Default to Middle East/Mediterranean
  initialZoom = 4,
  onFactoidClick,
  onLocationClick,
  onMapClick,
  showUncertainty = true,
  clusterThreshold = 500,
  className = '',
}: HistoryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const popupRef = useRef<Popup | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Determine rendering strategy
  // Use clusters if we have bulk locations OR if factoids exceed threshold
  const useClustersForFactoids = factoids.length > clusterThreshold
  const hasBulkLocations = locations.length > 0

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

  // Add cluster layer for bulk locations (WebGL-rendered, handles 100k+)
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const CLUSTER_SOURCE_ID = 'locations-cluster'
    const CLUSTER_LAYER_ID = 'clusters'
    const CLUSTER_COUNT_LAYER_ID = 'cluster-count'
    const UNCLUSTERED_LAYER_ID = 'unclustered-point'

    // Remove existing cluster layers
    ;[CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID, UNCLUSTERED_LAYER_ID].forEach((id) => {
      if (map.current?.getLayer(id)) {
        map.current.removeLayer(id)
      }
    })
    if (map.current.getSource(CLUSTER_SOURCE_ID)) {
      map.current.removeSource(CLUSTER_SOURCE_ID)
    }

    // Combine bulk locations with factoids that should be clustered
    const clusterData: BulkLocation[] = [
      ...locations,
      ...(useClustersForFactoids
        ? factoids.map((f) => ({
            id: f.id,
            name: f.summary,
            coordinates: f.location.coordinates,
            type: f.category || f.layer,
          }))
        : []),
    ]

    if (clusterData.length === 0) return

    // Create GeoJSON from locations
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: clusterData.map((loc) => ({
        type: 'Feature',
        properties: {
          id: loc.id,
          name: loc.name,
          type: loc.type || 'location',
        },
        geometry: {
          type: 'Point',
          coordinates: loc.coordinates,
        },
      })),
    }

    // Add clustered source
    map.current.addSource(CLUSTER_SOURCE_ID, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })

    // Cluster circles layer
    map.current.addLayer({
      id: CLUSTER_LAYER_ID,
      type: 'circle',
      source: CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#b45309',   // < 100: gold
          100,
          '#92400e',   // < 500: darker gold
          500,
          '#7c2d12',   // >= 500: burgundy
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          18,      // < 100
          100,
          24,      // < 500
          500,
          32,      // >= 500
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    })

    // Cluster count label
    map.current.addLayer({
      id: CLUSTER_COUNT_LAYER_ID,
      type: 'symbol',
      source: CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#ffffff',
      },
    })

    // Unclustered points
    map.current.addLayer({
      id: UNCLUSTERED_LAYER_ID,
      type: 'circle',
      source: CLUSTER_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#b45309',
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    })

    // Click handler for clusters - zoom in
    map.current.on('click', CLUSTER_LAYER_ID, (e) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER_ID],
      })
      if (!features?.length || !map.current) return

      const clusterId = features[0].properties?.cluster_id
      const source = map.current.getSource(CLUSTER_SOURCE_ID) as GeoJSONSource

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !map.current) return
        const geometry = features[0].geometry
        if (geometry.type === 'Point') {
          map.current.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom ?? 10,
          })
        }
      })
    })

    // Click handler for unclustered points
    map.current.on('click', UNCLUSTERED_LAYER_ID, (e) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: [UNCLUSTERED_LAYER_ID],
      })
      if (!features?.length) return

      const props = features[0].properties
      const geometry = features[0].geometry
      if (!props || geometry.type !== 'Point') return

      // Create popup
      if (popupRef.current) {
        popupRef.current.remove()
      }

      popupRef.current = new maplibregl.Popup({ offset: 15 })
        .setLngLat(geometry.coordinates as [number, number])
        .setHTML(`
          <div style="font-family: system-ui, sans-serif; max-width: 200px;">
            <h3 style="font-size: 0.875rem; font-weight: 600; margin: 0 0 4px 0;">${props.name}</h3>
            <p style="font-size: 0.75rem; color: #666; margin: 0; text-transform: capitalize;">${props.type}</p>
          </div>
        `)
        .addTo(map.current!)

      // Call location click handler
      if (onLocationClick) {
        onLocationClick({
          id: props.id,
          name: props.name,
          coordinates: geometry.coordinates as [number, number],
          type: props.type,
        })
      }
    })

    // Hover cursor change
    map.current.on('mouseenter', CLUSTER_LAYER_ID, () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer'
    })
    map.current.on('mouseleave', CLUSTER_LAYER_ID, () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
    })
    map.current.on('mouseenter', UNCLUSTERED_LAYER_ID, () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer'
    })
    map.current.on('mouseleave', UNCLUSTERED_LAYER_ID, () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
    })

  }, [locations, factoids, useClustersForFactoids, mapLoaded, onLocationClick])

  // Add featured factoid markers (DOM-based, for lens-filtered items)
  // Also handles regular factoids when under threshold
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Determine which factoids to render as DOM markers
    // Featured factoids always get DOM markers (they're lens-filtered highlights)
    // Regular factoids only get DOM markers if under threshold
    const factoidsForDomMarkers = useClustersForFactoids ? [] : factoids
    const allDomFactoids = [
      ...featuredFactoids.slice(0, MAX_DOM_MARKERS), // Featured items (capped)
      ...factoidsForDomMarkers.slice(0, MAX_DOM_MARKERS - featuredFactoids.length), // Regular if room
    ]

    // Track which factoids we're rendering for cleanup
    const renderedIds = new Set(allDomFactoids.map((f) => f.id))

    // Remove existing uncertainty layers (clean up all)
    ;[...factoids, ...featuredFactoids].forEach((factoid) => {
      if (map.current?.getLayer(`uncertainty-${factoid.id}`)) {
        map.current.removeLayer(`uncertainty-${factoid.id}`)
      }
      if (map.current?.getSource(`uncertainty-${factoid.id}`)) {
        map.current.removeSource(`uncertainty-${factoid.id}`)
      }
    })

    // Create a set to track featured IDs for styling
    const featuredIds = new Set(featuredFactoids.map((f) => f.id))

    // Add uncertainty circles and markers for DOM factoids
    allDomFactoids.forEach((factoid) => {
      if (!map.current) return
      const { location } = factoid
      const isFeatured = featuredIds.has(factoid.id)

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
            'fill-opacity': isFeatured ? 0.25 : 0.15,
          },
        })
      }

      // Create marker element - featured items are larger and have distinct styling
      const el = document.createElement('div')
      el.className = `history-map-marker ${isFeatured ? 'featured' : ''}`

      const size = isFeatured ? 32 : 24
      const borderWidth = isFeatured ? 4 : 3

      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${LAYER_COLORS[factoid.layer] || '#6b7280'};
        border: ${borderWidth}px solid ${isFeatured ? '#fbbf24' : 'white'};
        box-shadow: ${isFeatured ? '0 0 0 2px rgba(251, 191, 36, 0.5), ' : ''}0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: box-shadow 0.2s ease;
        z-index: ${isFeatured ? 10 : 1};
      `
      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = `${isFeatured ? '0 0 0 3px rgba(251, 191, 36, 0.7), ' : ''}0 4px 12px rgba(0,0,0,0.5)`
      })
      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = `${isFeatured ? '0 0 0 2px rgba(251, 191, 36, 0.5), ' : ''}0 2px 8px rgba(0,0,0,0.3)`
      })

      // Create popup
      const popup = new maplibregl.Popup({
        offset: size / 2 + 10,
        closeButton: false,
        className: 'history-map-popup',
      }).setHTML(`
        <div style="font-family: var(--font-body), system-ui, sans-serif; max-width: 250px;">
          ${isFeatured ? '<div style="font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; margin-bottom: 4px;">Featured</div>' : ''}
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

      // Create marker with centered anchor
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
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
  }, [factoids, featuredFactoids, useClustersForFactoids, mapLoaded, showUncertainty, onFactoidClick])

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
