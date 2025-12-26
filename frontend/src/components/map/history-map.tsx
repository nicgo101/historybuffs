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

// Maximum unclustered points to render (WebGL can handle more than DOM)
const MAX_UNCLUSTERED_POINTS = 2000

// Jitter radius in degrees (roughly 50-100 meters at equator)
const JITTER_RADIUS = 0.001

/**
 * Add small random offsets to points that share exact coordinates.
 * This prevents co-located points from being permanently clustered.
 */
function addJitterToColocatedPoints(
  features: GeoJSON.Feature<GeoJSON.Point>[]
): GeoJSON.Feature<GeoJSON.Point>[] {
  // Group features by coordinate string
  // Use globalThis.Map to avoid conflict with MapLibre's Map type
  const coordGroups: globalThis.Map<string, GeoJSON.Feature<GeoJSON.Point>[]> = new globalThis.Map()

  for (const feature of features) {
    const coords = feature.geometry.coordinates
    const key = `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`
    if (!coordGroups.has(key)) {
      coordGroups.set(key, [])
    }
    coordGroups.get(key)!.push(feature)
  }

  // Apply jitter to groups with multiple points
  const result: GeoJSON.Feature<GeoJSON.Point>[] = []

  for (const [, group] of coordGroups) {
    if (group.length === 1) {
      // Single point, no jitter needed
      result.push(group[0])
    } else {
      // Multiple points at same location - spread them in a circle
      const baseCoords = group[0].geometry.coordinates
      const count = group.length

      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count
        // Scale jitter based on number of points (more points = wider spread)
        const radius = JITTER_RADIUS * Math.min(Math.sqrt(count), 5)
        const jitteredFeature: GeoJSON.Feature<GeoJSON.Point> = {
          ...group[i],
          geometry: {
            type: 'Point',
            coordinates: [
              baseCoords[0] + radius * Math.cos(angle),
              baseCoords[1] + radius * Math.sin(angle),
            ],
          },
          properties: {
            ...group[i].properties,
            _originalCoords: baseCoords, // Keep original for reference
            _colocatedCount: count,
          },
        }
        result.push(jitteredFeature)
      }
    }
  }

  return result
}

/**
 * Generate spider leg positions for displaying co-located points
 */
function generateSpiderPositions(
  center: [number, number],
  count: number,
  radiusPixels: number = 40
): [number, number][] {
  const positions: [number, number][] = []

  // For small counts, use specific layouts
  if (count === 2) {
    positions.push(
      [center[0] - radiusPixels, center[1]],
      [center[0] + radiusPixels, center[1]]
    )
  } else {
    // Circular layout
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2 // Start from top
      positions.push([
        center[0] + radiusPixels * Math.cos(angle),
        center[1] + radiusPixels * Math.sin(angle),
      ])
    }
  }

  return positions
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
  const spiderMarkersRef = useRef<Marker[]>([])
  const spiderLinesRef = useRef<HTMLElement[]>([])
  const popupRef = useRef<Popup | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Helper to clear spider markers
  const clearSpiderMarkers = useCallback(() => {
    spiderMarkersRef.current.forEach((marker) => marker.remove())
    spiderMarkersRef.current = []
    spiderLinesRef.current.forEach((line) => line.remove())
    spiderLinesRef.current = []
  }, [])

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
      attributionControl: {}, // Enable attribution with default settings
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.current.on('load', () => {
      console.log('Map load event fired')
      // Wait for style to be fully loaded before marking map as ready
      const checkStyleLoaded = () => {
        const styleLoaded = map.current?.isStyleLoaded()
        console.log('Checking style loaded:', styleLoaded)
        if (styleLoaded) {
          // Add extra delay to ensure WebGL context is ready
          console.log('Style loaded, setting mapLoaded=true in 100ms')
          setTimeout(() => {
            console.log('Setting mapLoaded=true now')
            setMapLoaded(true)
          }, 100)
        } else {
          // Retry after a short delay
          setTimeout(checkStyleLoaded, 50)
        }
      }
      checkStyleLoaded()
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
    console.log('Route effect check:', { hasMap: !!map.current, mapLoaded, routes: journeyRoutes.length })
    if (!map.current || !mapLoaded) return
    // Double-check style is loaded (safety check)
    if (!map.current.isStyleLoaded()) {
      console.log('Route effect: style not loaded, skipping')
      return
    }
    console.log('Route effect: adding', journeyRoutes.length, 'routes')

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
    // mapLoaded is set by the 'load' event which fires when style is ready
    if (!map.current || !mapLoaded) return
    // Double-check style is loaded (safety check)
    if (!map.current.isStyleLoaded()) return

    console.log('Cluster effect - locations:', locations.length, 'factoids:', factoids.length)

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

    if (clusterData.length === 0) {
      console.log('No cluster data, skipping')
      return
    }

    console.log('Cluster data count:', clusterData.length)
    console.log('Sample location:', clusterData[0])
    if (clusterData[0]?.coordinates) {
      console.log('Sample coords [lng, lat]:', clusterData[0].coordinates,
        '- If lng should be ~12 for Rome, lat ~42')
    }

    // Create GeoJSON features from locations - filter out invalid coordinates
    const rawFeatures: GeoJSON.Feature<GeoJSON.Point>[] = clusterData
      .filter((loc) => {
        const valid = Array.isArray(loc.coordinates) &&
          loc.coordinates.length === 2 &&
          typeof loc.coordinates[0] === 'number' &&
          typeof loc.coordinates[1] === 'number' &&
          !isNaN(loc.coordinates[0]) &&
          !isNaN(loc.coordinates[1])
        if (!valid) {
          console.warn('Invalid coordinates for location:', loc)
        }
        return valid
      })
      .map((loc) => ({
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
      }))

    console.log('Valid features count:', rawFeatures.length)

    // Apply jitter to co-located points so they can uncluster
    const jitteredFeatures = addJitterToColocatedPoints(rawFeatures)
    console.log('Jittered features count:', jitteredFeatures.length)

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: jitteredFeatures,
    }

    console.log('GeoJSON created:', geojson.features.length, 'features')
    if (geojson.features.length > 0) {
      console.log('First feature coords:', geojson.features[0].geometry)
    }

    // Determine if we should cluster based on point count
    // Below threshold, show all points unclustered for better UX
    const shouldCluster = clusterData.length > MAX_UNCLUSTERED_POINTS

    // Add source with clustering
    map.current.addSource(CLUSTER_SOURCE_ID, {
      type: 'geojson',
      data: geojson,
      cluster: shouldCluster,
      clusterMaxZoom: 16,  // Clusters resolve at zoom 16+
      clusterRadius: 30,   // Smaller radius = less aggressive clustering
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

    // Unclustered points - larger and more visible
    map.current.addLayer({
      id: UNCLUSTERED_LAYER_ID,
      type: 'circle',
      source: CLUSTER_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#dc2626', // Bright red for visibility
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    })

    console.log('Cluster layers added successfully. Clustering:', shouldCluster)

    // Verify layers exist
    const hasSource = map.current.getSource(CLUSTER_SOURCE_ID)
    const hasClusterLayer = map.current.getLayer(CLUSTER_LAYER_ID)
    const hasUnclusteredLayer = map.current.getLayer(UNCLUSTERED_LAYER_ID)
    console.log('Layer verification:', {
      hasSource: !!hasSource,
      hasClusterLayer: !!hasClusterLayer,
      hasUnclusteredLayer: !!hasUnclusteredLayer,
    })

    // Check what features are in the source
    if (hasSource) {
      const sourceData = (hasSource as maplibregl.GeoJSONSource).serialize()
      console.log('Source data type:', sourceData?.type)
    }

    // Log map center and zoom
    const center = map.current.getCenter()
    const zoom = map.current.getZoom()
    console.log('Map view:', { center: [center.lng, center.lat], zoom })

    // Click handler for clusters - zoom in or spiderfy if at max zoom
    map.current.on('click', CLUSTER_LAYER_ID, (e) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER_ID],
      })
      if (!features?.length || !map.current) return

      // Clear any existing spider markers
      clearSpiderMarkers()
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }

      const clusterId = features[0].properties?.cluster_id
      const pointCount = features[0].properties?.point_count
      const geometry = features[0].geometry
      const source = map.current.getSource(CLUSTER_SOURCE_ID) as GeoJSONSource

      // Use async/await pattern for cluster methods
      ;(async () => {
        try {
          const expansionZoom = await source.getClusterExpansionZoom(clusterId)
          if (!map.current) return

          const currentZoom = map.current.getZoom()

          // If we're already at or near max zoom, or expansion zoom is same as current,
          // show spiderfy effect
          if (expansionZoom === null || expansionZoom <= currentZoom || currentZoom >= 16) {
            // Get all locations in this cluster
            const leaves = await source.getClusterLeaves(clusterId, 50, 0) as GeoJSON.Feature<GeoJSON.Point>[]
            if (!leaves || !map.current || geometry.type !== 'Point') return

            const centerLngLat = geometry.coordinates as [number, number]
            const centerPoint = map.current!.project(centerLngLat)
            const count = Math.min(leaves.length, 20) // Cap at 20 for visual clarity

            // Generate spider positions in screen coordinates
            const spiderRadius = Math.min(30 + count * 5, 80) // Adaptive radius
            const positions = generateSpiderPositions(
              [centerPoint.x, centerPoint.y],
              count,
              spiderRadius
            )

            // Create spider markers and lines
            leaves.slice(0, count).forEach((leaf: GeoJSON.Feature, i: number) => {
              if (!map.current) return

              const props = leaf.properties
              const name = props?.name || 'Unknown'
              const type = props?.type || ''

              // Convert screen position back to lngLat
              const screenPos = positions[i]
              const lngLat = map.current.unproject(screenPos)

              // Create line element (SVG line in a positioned div)
              const lineContainer = document.createElement('div')
              lineContainer.style.cssText = `
                position: absolute;
                pointer-events: none;
                z-index: 1;
              `
              const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
              svg.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: visible;
              `
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
              line.setAttribute('x1', String(centerPoint.x))
              line.setAttribute('y1', String(centerPoint.y))
              line.setAttribute('x2', String(screenPos[0]))
              line.setAttribute('y2', String(screenPos[1]))
              line.setAttribute('stroke', '#b45309')
              line.setAttribute('stroke-width', '2')
              line.setAttribute('stroke-opacity', '0.6')
              svg.appendChild(line)
              lineContainer.appendChild(svg)
              map.current.getContainer().appendChild(lineContainer)
              spiderLinesRef.current.push(lineContainer)

              // Create spider marker
              const el = document.createElement('div')
              el.style.cssText = `
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background-color: #b45309;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: transform 0.15s ease;
              `
              el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.2)'
              })
              el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)'
              })

              // Create popup for spider marker
              const popup = new maplibregl.Popup({
                offset: 15,
                closeButton: false,
              }).setHTML(`
                <div style="font-family: system-ui, sans-serif; max-width: 200px;">
                  <h3 style="font-size: 0.875rem; font-weight: 600; margin: 0 0 4px 0;">${name}</h3>
                  ${type ? `<p style="font-size: 0.75rem; color: #666; margin: 0; text-transform: capitalize;">${type}</p>` : ''}
                </div>
              `)

              const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                .setLngLat([lngLat.lng, lngLat.lat])
                .setPopup(popup)
                .addTo(map.current)

              // Handle click on spider marker
              el.addEventListener('click', (clickE) => {
                clickE.stopPropagation()
                if (onLocationClick) {
                  const leafGeom = leaf.geometry as GeoJSON.Point
                  onLocationClick({
                    id: props?.id || '',
                    name,
                    coordinates: leafGeom.coordinates as [number, number],
                    type,
                  })
                }
              })

              spiderMarkersRef.current.push(marker)
            })

            // If there are more items, show count indicator
            if (leaves.length > count) {
              const remaining = leaves.length - count
              popupRef.current = new maplibregl.Popup({
                offset: [0, -spiderRadius - 20],
                closeButton: false,
                className: 'spider-count-popup',
              })
                .setLngLat(centerLngLat)
                .setHTML(`
                  <div style="font-size: 0.625rem; color: #666; text-align: center;">
                    + ${remaining} more
                  </div>
                `)
                .addTo(map.current)
            }
          } else {
            // Normal case: zoom to expand the cluster
            if (geometry.type === 'Point') {
              map.current.easeTo({
                center: geometry.coordinates as [number, number],
                zoom: expansionZoom,
              })
            }
          }
        } catch (err) {
          console.error('Error handling cluster click:', err)
        }
      })()
    })

    // Click on map to clear spider markers
    map.current.on('click', (e) => {
      // Check if click was on a cluster or spider marker (handled separately)
      const clusterFeatures = map.current?.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER_ID],
      })
      if (!clusterFeatures?.length) {
        clearSpiderMarkers()
        if (popupRef.current) {
          popupRef.current.remove()
          popupRef.current = null
        }
      }
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

    // Hover cursor change and cluster preview popup
    let clusterHoverPopup: maplibregl.Popup | null = null

    map.current.on('mouseenter', CLUSTER_LAYER_ID, async (e) => {
      if (!map.current) return
      map.current.getCanvas().style.cursor = 'pointer'

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER_ID],
      })
      if (!features?.length) return

      const clusterId = features[0].properties?.cluster_id
      const pointCount = features[0].properties?.point_count
      const geometry = features[0].geometry
      if (!clusterId || geometry.type !== 'Point') return

      const source = map.current.getSource(CLUSTER_SOURCE_ID) as GeoJSONSource

      try {
        // Get cluster leaves (locations inside the cluster)
        const leaves = await source.getClusterLeaves(clusterId, 10, 0) as GeoJSON.Feature[]
        if (!leaves || !map.current) return

        const locationNames = leaves
          .map((leaf: GeoJSON.Feature) => leaf.properties?.name)
          .filter(Boolean)
          .slice(0, 5)

        const moreCount = pointCount - locationNames.length

        // Remove existing hover popup
        if (clusterHoverPopup) {
          clusterHoverPopup.remove()
        }

        clusterHoverPopup = new maplibregl.Popup({
          offset: 20,
          closeButton: false,
          closeOnClick: false,
          className: 'cluster-hover-popup',
        })
          .setLngLat(geometry.coordinates as [number, number])
          .setHTML(`
            <div style="font-family: system-ui, sans-serif; max-width: 220px;">
              <div style="font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; margin-bottom: 6px;">
                ${pointCount} locations
              </div>
              <ul style="margin: 0; padding: 0 0 0 14px; font-size: 0.75rem; color: #333;">
                ${locationNames.map((name: string) => `<li style="margin: 2px 0;">${name}</li>`).join('')}
              </ul>
              ${moreCount > 0 ? `<p style="font-size: 0.625rem; color: #666; margin: 6px 0 0 0; font-style: italic;">+ ${moreCount} more (click to zoom)</p>` : ''}
            </div>
          `)
          .addTo(map.current)
      } catch (err) {
        console.error('Error fetching cluster leaves:', err)
      }
    })

    map.current.on('mouseleave', CLUSTER_LAYER_ID, () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
      if (clusterHoverPopup) {
        clusterHoverPopup.remove()
        clusterHoverPopup = null
      }
    })

    map.current.on('mouseenter', UNCLUSTERED_LAYER_ID, () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer'
    })
    map.current.on('mouseleave', UNCLUSTERED_LAYER_ID, () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
    })

    // Cleanup spider markers when effect re-runs
    return () => {
      clearSpiderMarkers()
    }
  }, [locations, factoids, useClustersForFactoids, mapLoaded, onLocationClick, clearSpiderMarkers])

  // Add featured factoid markers (DOM-based, for lens-filtered items)
  // Also handles regular factoids when under threshold
  useEffect(() => {
    if (!map.current || !mapLoaded) return
    // Double-check style is loaded (safety check)
    if (!map.current.isStyleLoaded()) return

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
    // Double-check style is loaded (safety check)
    if (!map.current.isStyleLoaded()) return

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

      // Add layer above base tiles (no beforeId = adds on top)
      // We'll insert it right after adding, before cluster/marker layers
      map.current.addLayer({
        id: `overlay-${overlay.id}`,
        type: 'raster',
        source: `overlay-${overlay.id}`,
        paint: {
          'raster-opacity': overlay.opacity ?? 0.7,
        },
      })
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
