'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getMapData,
  getMapFactoids,
  getJourneyRoutes,
  getBulkLocations,
  type MapDataFilters,
  type MapDataResponse,
  type BulkLocationResponse,
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

const DEMO_ROUTES: JourneyRoute[] = [
  {
    id: 'route-alexander',
    name: "Alexander's Campaign",
    description: 'Military campaign of Alexander the Great (334-323 BCE)',
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
      setFactoids(data.factoids)
      setRoutes(data.routes)
      setOverlays(data.overlays)
    } catch (err) {
      console.error('Failed to fetch map data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch map data'))

      // Use demo data as fallback in development
      if (useDemoFallback) {
        console.info('Using demo data as fallback')
        setFactoids(DEMO_FACTOIDS)
        setRoutes(DEMO_ROUTES)
        setOverlays([])
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
  limit?: number
} = {}) {
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
      setLocations(data.map((loc) => ({
        id: loc.id,
        name: loc.name,
        coordinates: loc.coordinates,
        type: loc.type,
      })))
    } catch (err) {
      console.error('Failed to fetch bulk locations:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'))
      setLocations([])
    } finally {
      setLoading(false)
    }
  }, [options.types, options.bounds, options.limit])

  useEffect(() => {
    if (options.fetchOnMount !== false) {
      fetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { locations, loading, error, refetch: fetch }
}
