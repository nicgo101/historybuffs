'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getMapData,
  getMapFactoids,
  getJourneyRoutes,
  getBulkLocations,
  getLocationConnections,
  type MapDataFilters,
  type MapDataResponse,
  type BulkLocationResponse,
  type LocationConnection,
} from '@/lib/api/map'
import type { MapFactoid, JourneyRoute, HistoricalMapOverlay, BulkLocation } from '@/components/map'

interface UseMapDataOptions {
  /** Initial filters to apply */
  filters?: MapDataFilters
  /** Whether to fetch on mount */
  fetchOnMount?: boolean
  /** Use demo data as fallback when API fails */
  useDemoFallback?: boolean
}

interface UseMapDataReturn {
  factoids: MapFactoid[]
  routes: JourneyRoute[]
  overlays: HistoricalMapOverlay[]
  loading: boolean
  error: Error | null
  /** Refetch data with optional new filters */
  refetch: (newFilters?: MapDataFilters) => Promise<void>
  /** Update filters and refetch */
  setFilters: (filters: MapDataFilters) => void
}

// Demo data for development/fallback
const DEMO_FACTOIDS: MapFactoid[] = [
  {
    id: 'demo-1',
    summary: 'Battle of Gaugamela',
    description: 'Decisive battle where Alexander defeated Darius III',
    layer: 'documented',
    confidence: 0.95,
    category: 'battle',
    location: {
      id: 'loc-gaugamela',
      name: 'Gaugamela',
      nameHistorical: 'Gaugamela',
      coordinates: [43.4, 36.4],
      uncertaintyRadiusKm: 5,
      locationType: 'point',
    },
  },
  {
    id: 'demo-2',
    summary: 'Founding of Alexandria',
    description: 'Alexander founded the city of Alexandria in Egypt',
    layer: 'documented',
    confidence: 0.98,
    category: 'founding',
    location: {
      id: 'loc-alexandria',
      name: 'Alexandria',
      coordinates: [29.9187, 31.2001],
      locationType: 'point',
    },
  },
  {
    id: 'demo-3',
    summary: 'The Exodus from Egypt',
    description: 'Traditional account of Israelites leaving Egypt',
    layer: 'attested',
    confidence: 0.4,
    category: 'migration',
    location: {
      id: 'loc-goshen',
      name: 'Goshen',
      nameHistorical: 'Land of Goshen',
      coordinates: [31.5, 30.9],
      uncertaintyRadiusKm: 50,
      locationType: 'area',
    },
  },
  {
    id: 'demo-4',
    summary: 'Paul arrives in Rome',
    description: 'Apostle Paul arrives in Rome as a prisoner',
    layer: 'attested',
    confidence: 0.85,
    category: 'travel',
    location: {
      id: 'loc-rome',
      name: 'Rome',
      nameHistorical: 'Roma',
      coordinates: [12.4964, 41.9028],
      locationType: 'point',
    },
  },
]

// Historical overlays disabled for now - tile sources need verification
// TODO: Re-enable when we have working IIIF/tile sources
const DEMO_OVERLAYS: HistoricalMapOverlay[] = []

// Demo bulk locations for testing clustering
// Includes several co-located points to test jitter/spiderfy
const DEMO_BULK_LOCATIONS: BulkLocation[] = [
  // Rome - multiple co-located points
  { id: 'rome-1', name: 'Roman Forum', coordinates: [12.4853, 41.8925], type: 'archaeological_site' },
  { id: 'rome-2', name: 'Colosseum', coordinates: [12.4924, 41.8902], type: 'monument' },
  { id: 'rome-3', name: 'Palatine Hill', coordinates: [12.4853, 41.8892], type: 'archaeological_site' },
  { id: 'rome-4', name: 'Circus Maximus', coordinates: [12.4853, 41.8859], type: 'monument' },
  { id: 'rome-5', name: 'Temple of Vesta', coordinates: [12.4853, 41.8925], type: 'temple' }, // Same as Forum
  { id: 'rome-6', name: 'Curia Julia', coordinates: [12.4853, 41.8925], type: 'building' }, // Same as Forum

  // Athens - cluster
  { id: 'athens-1', name: 'Acropolis', coordinates: [23.7257, 37.9715], type: 'archaeological_site' },
  { id: 'athens-2', name: 'Parthenon', coordinates: [23.7265, 37.9715], type: 'temple' },
  { id: 'athens-3', name: 'Erechtheion', coordinates: [23.7257, 37.9722], type: 'temple' },
  { id: 'athens-4', name: 'Ancient Agora', coordinates: [23.7220, 37.9747], type: 'archaeological_site' },
  { id: 'athens-5', name: 'Temple of Hephaestus', coordinates: [23.7215, 37.9753], type: 'temple' },

  // Alexandria - cluster with co-located
  { id: 'alex-1', name: 'Library of Alexandria', coordinates: [29.9097, 31.2089], type: 'building' },
  { id: 'alex-2', name: 'Pharos Lighthouse', coordinates: [29.8854, 31.2135], type: 'monument' },
  { id: 'alex-3', name: 'Serapeum', coordinates: [29.9097, 31.2089], type: 'temple' }, // Same as Library
  { id: 'alex-4', name: 'Royal Quarter', coordinates: [29.9097, 31.2089], type: 'district' }, // Same as Library

  // Jerusalem - dense cluster
  { id: 'jerus-1', name: 'Temple Mount', coordinates: [35.2354, 31.7781], type: 'religious_site' },
  { id: 'jerus-2', name: 'Western Wall', coordinates: [35.2341, 31.7767], type: 'monument' },
  { id: 'jerus-3', name: 'Church of Holy Sepulchre', coordinates: [35.2296, 31.7784], type: 'church' },
  { id: 'jerus-4', name: 'Pool of Bethesda', coordinates: [35.2354, 31.7781], type: 'archaeological_site' }, // Same as Temple Mount
  { id: 'jerus-5', name: "Solomon's Stables", coordinates: [35.2354, 31.7781], type: 'archaeological_site' }, // Same as Temple Mount

  // Constantinople
  { id: 'const-1', name: 'Hagia Sophia', coordinates: [28.9800, 41.0086], type: 'church' },
  { id: 'const-2', name: 'Hippodrome', coordinates: [28.9756, 41.0062], type: 'monument' },
  { id: 'const-3', name: 'Theodosian Walls', coordinates: [28.9239, 41.0186], type: 'fortification' },

  // Babylon
  { id: 'bab-1', name: 'Ishtar Gate', coordinates: [44.4209, 32.5425], type: 'monument' },
  { id: 'bab-2', name: 'Hanging Gardens', coordinates: [44.4209, 32.5425], type: 'monument' }, // Same location
  { id: 'bab-3', name: 'Etemenanki Ziggurat', coordinates: [44.4209, 32.5425], type: 'temple' }, // Same location
  { id: 'bab-4', name: 'Esagila Temple', coordinates: [44.4209, 32.5425], type: 'temple' }, // Same location

  // Persepolis
  { id: 'pers-1', name: 'Apadana Palace', coordinates: [52.8891, 29.9352], type: 'palace' },
  { id: 'pers-2', name: 'Gate of All Nations', coordinates: [52.8891, 29.9352], type: 'monument' }, // Same
  { id: 'pers-3', name: 'Throne Hall', coordinates: [52.8905, 29.9345], type: 'palace' },

  // Carthage
  { id: 'carth-1', name: 'Tophet', coordinates: [10.3235, 36.8528], type: 'religious_site' },
  { id: 'carth-2', name: 'Byrsa Hill', coordinates: [10.3247, 36.8531], type: 'archaeological_site' },

  // Ephesus
  { id: 'eph-1', name: 'Temple of Artemis', coordinates: [27.3639, 37.9497], type: 'temple' },
  { id: 'eph-2', name: 'Library of Celsus', coordinates: [27.3422, 37.9394], type: 'building' },
  { id: 'eph-3', name: 'Great Theatre', coordinates: [27.3411, 37.9411], type: 'theatre' },

  // Pompeii
  { id: 'pomp-1', name: 'Forum of Pompeii', coordinates: [14.4842, 40.7489], type: 'archaeological_site' },
  { id: 'pomp-2', name: 'House of the Faun', coordinates: [14.4867, 40.7508], type: 'building' },
  { id: 'pomp-3', name: 'Amphitheatre', coordinates: [14.4933, 40.7511], type: 'theatre' },

  // Scattered Mediterranean locations
  { id: 'delphi', name: 'Oracle of Delphi', coordinates: [22.5011, 38.4824], type: 'religious_site' },
  { id: 'olympia', name: 'Olympia', coordinates: [21.6300, 37.6386], type: 'religious_site' },
  { id: 'knossos', name: 'Knossos', coordinates: [25.1631, 35.2979], type: 'palace' },
  { id: 'troy', name: 'Troy', coordinates: [26.2389, 39.9575], type: 'archaeological_site' },
  { id: 'petra', name: 'Petra', coordinates: [35.4428, 30.3285], type: 'city' },
  { id: 'palmyra', name: 'Palmyra', coordinates: [38.2689, 34.5503], type: 'city' },
  { id: 'tyre', name: 'Tyre', coordinates: [35.2031, 33.2705], type: 'city' },
  { id: 'sidon', name: 'Sidon', coordinates: [35.3836, 33.5572], type: 'city' },
  { id: 'antioch', name: 'Antioch', coordinates: [36.1628, 36.2025], type: 'city' },
  { id: 'memphis', name: 'Memphis', coordinates: [31.2547, 29.8447], type: 'city' },
  { id: 'thebes', name: 'Thebes (Egypt)', coordinates: [32.6572, 25.7189], type: 'city' },
  { id: 'giza', name: 'Giza Pyramids', coordinates: [31.1342, 29.9792], type: 'monument' },
  { id: 'luxor', name: 'Karnak Temple', coordinates: [32.6572, 25.7189], type: 'temple' }, // Same as Thebes
  { id: 'corinth', name: 'Corinth', coordinates: [22.8789, 37.9069], type: 'city' },
  { id: 'sparta', name: 'Sparta', coordinates: [22.4297, 37.0736], type: 'city' },
  { id: 'mycenae', name: 'Mycenae', coordinates: [22.7561, 37.7308], type: 'archaeological_site' },
  { id: 'cyrene', name: 'Cyrene', coordinates: [21.8558, 32.8217], type: 'city' },
  { id: 'leptis', name: 'Leptis Magna', coordinates: [14.2897, 32.6378], type: 'city' },
]

const DEMO_ROUTES: JourneyRoute[] = [
  {
    id: 'route-alexander',
    name: "Alexander's Campaign",
    description: 'Military campaign of Alexander the Great (334-323 BC)',
    routeType: 'campaign',
    coordinates: [
      [22.9375, 40.6401],  // Pella
      [27.1428, 38.4237],  // Sardis
      [30.7133, 36.8969],  // Issus
      [35.5018, 33.8938],  // Tyre
      [29.9187, 31.2001],  // Alexandria
      [43.4, 36.4],        // Gaugamela
      [44.366, 33.315],    // Babylon
      [52.5311, 29.6257],  // Persepolis
    ],
    color: '#DC2626',
  },
  {
    id: 'route-paul',
    name: "Paul's Journey to Rome",
    description: 'Final journey of Apostle Paul',
    routeType: 'travel',
    coordinates: [
      [35.5018, 33.8938],  // Caesarea
      [27.9116, 36.8512],  // Myra
      [25.4858, 35.2163],  // Fair Havens (Crete)
      [14.5146, 35.8989],  // Malta
      [15.2858, 37.0679],  // Syracuse
      [12.4964, 41.9028],  // Rome
    ],
    color: '#6B7280',
  },
]

/**
 * Hook for fetching and managing map data.
 */
export function useMapData(options: UseMapDataOptions = {}): UseMapDataReturn {
  const {
    filters: initialFilters,
    fetchOnMount = true,
    useDemoFallback = true,
  } = options

  const [factoids, setFactoids] = useState<MapFactoid[]>([])
  const [routes, setRoutes] = useState<JourneyRoute[]>([])
  const [overlays, setOverlays] = useState<HistoricalMapOverlay[]>([])
  const [loading, setLoading] = useState(fetchOnMount)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFiltersState] = useState<MapDataFilters>(initialFilters || {})

  const fetchData = useCallback(async (currentFilters: MapDataFilters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMapData(currentFilters)

      // Use API data if available, otherwise fall back to demo
      const hasFactoids = data.factoids && data.factoids.length > 0
      const hasRoutes = data.routes && data.routes.length > 0
      const hasOverlays = data.overlays && data.overlays.length > 0

      if (useDemoFallback) {
        // Mix API data with demo fallbacks where API is empty
        setFactoids(hasFactoids ? data.factoids : DEMO_FACTOIDS)
        setRoutes(hasRoutes ? data.routes : DEMO_ROUTES)
        // Disable overlays for now - historical map tiles were problematic
        setOverlays([])

        if (!hasFactoids || !hasRoutes) {
          console.info('Using demo data for empty API responses:', {
            factoids: !hasFactoids,
            routes: !hasRoutes,
            overlays: !hasOverlays,
          })
        }
      } else {
        setFactoids(data.factoids || [])
        setRoutes(data.routes || [])
        setOverlays(data.overlays || [])
      }
    } catch (err) {
      console.error('Failed to fetch map data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch map data'))

      // Use demo data as fallback on error
      if (useDemoFallback) {
        console.info('Using demo data as fallback (API error)')
        setFactoids(DEMO_FACTOIDS)
        setRoutes(DEMO_ROUTES)
        setOverlays(DEMO_OVERLAYS)
      }
    } finally {
      setLoading(false)
    }
  }, [useDemoFallback])

  const refetch = useCallback(async (newFilters?: MapDataFilters) => {
    const filtersToUse = newFilters || filters
    await fetchData(filtersToUse)
  }, [filters, fetchData])

  const setFilters = useCallback((newFilters: MapDataFilters) => {
    setFiltersState(newFilters)
    fetchData(newFilters)
  }, [fetchData])

  // Initial fetch
  useEffect(() => {
    if (fetchOnMount) {
      fetchData(filters)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    factoids,
    routes,
    overlays,
    loading,
    error,
    refetch,
    setFilters,
  }
}

/**
 * Hook for fetching only factoids (lighter weight).
 */
export function useMapFactoids(options: {
  layers?: string[]
  categories?: string[]
  frameId?: string
  fetchOnMount?: boolean
} = {}) {
  const [factoids, setFactoids] = useState<MapFactoid[]>([])
  const [loading, setLoading] = useState(options.fetchOnMount !== false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMapFactoids({
        layers: options.layers,
        categories: options.categories,
        frameId: options.frameId,
      })
      setFactoids(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch factoids'))
      // Fallback to demo data
      setFactoids(DEMO_FACTOIDS)
    } finally {
      setLoading(false)
    }
  }, [options.layers, options.categories, options.frameId])

  useEffect(() => {
    if (options.fetchOnMount !== false) {
      fetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { factoids, loading, error, refetch: fetch }
}

/**
 * Hook for fetching only journey routes.
 */
export function useJourneyRoutes(options: {
  types?: string[]
  fetchOnMount?: boolean
} = {}) {
  const [routes, setRoutes] = useState<JourneyRoute[]>([])
  const [loading, setLoading] = useState(options.fetchOnMount !== false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getJourneyRoutes({ types: options.types })
      setRoutes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch routes'))
      // Fallback to demo data
      setRoutes(DEMO_ROUTES)
    } finally {
      setLoading(false)
    }
  }, [options.types])

  useEffect(() => {
    if (options.fetchOnMount !== false) {
      fetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { routes, loading, error, refetch: fetch }
}

/**
 * Hook for fetching bulk locations (for cluster layer).
 * Optimized for large datasets (45k+ locations).
 */
export function useBulkLocations(options: {
  types?: string[]
  bounds?: { sw: [number, number]; ne: [number, number] }
  fetchOnMount?: boolean
  useDemoFallback?: boolean
  limit?: number
} = {}) {
  const { useDemoFallback = true } = options
  const [locations, setLocations] = useState<BulkLocation[]>([])
  const [loading, setLoading] = useState(options.fetchOnMount !== false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getBulkLocations({
        types: options.types,
        bounds: options.bounds,
        limit: options.limit,
      })
      // Transform API response to BulkLocation type
      if (data && data.length > 0) {
        setLocations(data.map((loc) => ({
          id: loc.id,
          name: loc.name,
          coordinates: loc.coordinates,
          type: loc.type,
        })))
      } else if (useDemoFallback) {
        // API returned empty, use demo data
        console.info('API returned empty, using demo bulk locations')
        setLocations(DEMO_BULK_LOCATIONS)
      } else {
        setLocations([])
      }
    } catch (err) {
      console.error('Failed to fetch bulk locations:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'))
      // Use demo data as fallback
      if (useDemoFallback) {
        console.info('Using demo bulk locations as fallback')
        setLocations(DEMO_BULK_LOCATIONS)
      } else {
        setLocations([])
      }
    } finally {
      setLoading(false)
    }
  }, [options.types, options.bounds, options.limit, useDemoFallback])

  useEffect(() => {
    if (options.fetchOnMount !== false) {
      fetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { locations, loading, error, refetch: fetch }
}

// Demo connections for testing - lines between ancient cities
const DEMO_CONNECTIONS: LocationConnection[] = [
  {
    id: 'conn-rome-alexandria',
    from_location_id: 'rome-1',
    to_location_id: 'alex-1',
    connection_type: 'route:trade',
    confidence: 0.85,
    notes: 'Major trade route between Rome and Alexandria',
    from_coordinates: [12.4853, 41.8925],
    to_coordinates: [29.9097, 31.2089],
    from_name: 'Rome',
    to_name: 'Alexandria',
  },
  {
    id: 'conn-athens-rome',
    from_location_id: 'athens-1',
    to_location_id: 'rome-1',
    connection_type: 'route:trade',
    confidence: 0.9,
    notes: 'Mediterranean trade route',
    from_coordinates: [23.7257, 37.9715],
    to_coordinates: [12.4853, 41.8925],
    from_name: 'Athens',
    to_name: 'Rome',
  },
  {
    id: 'conn-jerusalem-alexandria',
    from_location_id: 'jerus-1',
    to_location_id: 'alex-1',
    connection_type: 'spatial:near',
    confidence: 0.95,
    notes: 'Near geographic connection',
    from_coordinates: [35.2354, 31.7781],
    to_coordinates: [29.9097, 31.2089],
    from_name: 'Jerusalem',
    to_name: 'Alexandria',
  },
  {
    id: 'conn-babylon-persepolis',
    from_location_id: 'bab-1',
    to_location_id: 'pers-1',
    connection_type: 'route:royal_road',
    confidence: 0.88,
    notes: 'Persian Royal Road connection',
    from_coordinates: [44.4209, 32.5425],
    to_coordinates: [52.8891, 29.9352],
    from_name: 'Babylon',
    to_name: 'Persepolis',
  },
]

/**
 * Hook for fetching location connections.
 * Returns connections with coordinates for line rendering on map.
 */
export function useLocationConnections(options: {
  connectionTypes?: string[]
  minConfidence?: number
  bounds?: { sw: [number, number]; ne: [number, number] }
  fetchOnMount?: boolean
  useDemoFallback?: boolean
  limit?: number
} = {}) {
  const { useDemoFallback = true } = options
  const [connections, setConnections] = useState<LocationConnection[]>([])
  const [loading, setLoading] = useState(options.fetchOnMount !== false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getLocationConnections({
        connectionTypes: options.connectionTypes,
        minConfidence: options.minConfidence,
        bounds: options.bounds,
        limit: options.limit,
      })

      if (data && data.length > 0) {
        setConnections(data)
      } else if (useDemoFallback) {
        console.info('API returned empty connections, using demo data')
        setConnections(DEMO_CONNECTIONS)
      } else {
        setConnections([])
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch connections'))

      if (useDemoFallback) {
        console.info('Using demo connections as fallback')
        setConnections(DEMO_CONNECTIONS)
      } else {
        setConnections([])
      }
    } finally {
      setLoading(false)
    }
  }, [options.connectionTypes, options.minConfidence, options.bounds, options.limit, useDemoFallback])

  useEffect(() => {
    if (options.fetchOnMount !== false) {
      fetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { connections, loading, error, refetch: fetch }
}

// Re-export type for convenience
export type { LocationConnection }
