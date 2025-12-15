'use client'

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Map as MapIcon,
  Layers,
  Route,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  Calendar,
  MapPin,
  Shield,
  Swords,
  Ship,
  Footprints,
  Star,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import type { MapFactoid, JourneyRoute, BulkLocation } from '@/components/map'
import { useMapData, useBulkLocations } from '@/hooks/use-map-data'

// Dynamic import to avoid SSR issues with MapLibre
const HistoryMap = dynamic(
  () => import('@/components/map/history-map').then((mod) => mod.HistoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-secondary/30">
        <div className="flex flex-col items-center gap-3">
          <MapIcon className="h-8 w-8 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    ),
  }
)

const LAYER_FILTERS = [
  { id: 'documented', label: 'Documented', color: 'bg-primary' },
  { id: 'attested', label: 'Attested', color: 'bg-accent' },
  { id: 'inferred', label: 'Inferred', color: 'bg-muted-foreground' },
]

const CATEGORY_FILTERS = [
  { id: 'Military', label: 'Military', icon: Swords },
  { id: 'Political', label: 'Political', icon: Star },
  { id: 'Cultural', label: 'Cultural', icon: Star },
  { id: 'Construction', label: 'Construction', icon: MapPin },
  { id: 'Religious', label: 'Religious', icon: Star },
]

const ROUTE_TYPE_INFO = {
  campaign: { label: 'Campaign', icon: Swords, color: 'text-red-600' },
  migration: { label: 'Migration', icon: Footprints, color: 'text-purple-600' },
  pilgrimage: { label: 'Pilgrimage', icon: Star, color: 'text-green-600' },
  trade_route: { label: 'Trade Route', icon: Ship, color: 'text-amber-600' },
  travel: { label: 'Travel', icon: Route, color: 'text-gray-600' },
}

export default function MapPage() {
  // Fetch bulk locations for cluster layer (handles 45k+ locations)
  const {
    locations,
    loading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useBulkLocations({
    fetchOnMount: true,
  })

  // Fetch factoids and routes (for filtered/featured items and routes)
  const { factoids, routes, loading: dataLoading, error: dataError, refetch: refetchData } = useMapData({
    fetchOnMount: true,
    useDemoFallback: true,
  })

  // Combined loading/error states
  const loading = locationsLoading || dataLoading
  const error = locationsError || dataError

  const refetch = useCallback(() => {
    refetchLocations()
    refetchData()
  }, [refetchLocations, refetchData])

  const [selectedFactoid, setSelectedFactoid] = useState<MapFactoid | null>(null)
  const [showUncertainty, setShowUncertainty] = useState(true)
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(['documented', 'attested', 'inferred'])
  )
  const [visibleRoutes, setVisibleRoutes] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Initialize visible routes when routes are loaded
  useMemo(() => {
    if (routes.length > 0 && visibleRoutes.size === 0) {
      setVisibleRoutes(new Set(routes.map((r) => r.id)))
    }
  }, [routes])

  const handleFactoidClick = useCallback((factoid: MapFactoid) => {
    setSelectedFactoid(factoid)
  }, [])

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
      } else {
        next.add(layerId)
      }
      return next
    })
  }

  const toggleRoute = (routeId: string) => {
    setVisibleRoutes((prev) => {
      const next = new Set(prev)
      if (next.has(routeId)) {
        next.delete(routeId)
      } else {
        next.add(routeId)
      }
      return next
    })
  }

  // Filter factoids based on visible layers
  const filteredFactoids = factoids.filter((f) => visibleLayers.has(f.layer))
  const filteredRoutes = routes.filter((r) => visibleRoutes.has(r.id))

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-background px-4 py-3">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Map View</h1>
            <p className="text-sm text-muted-foreground">
              Explore historical events and journeys across geography
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <Badge variant="outline" className="text-amber-600 border-amber-600/30 gap-1">
                <AlertCircle className="h-3 w-3" />
                Using demo data
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUncertainty(!showUncertainty)}
              className="gap-2"
            >
              {showUncertainty ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              Uncertainty
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="gap-2"
            >
              <Layers className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <HistoryMap
          locations={locations}
          factoids={filteredFactoids}
          journeyRoutes={filteredRoutes}
          showUncertainty={showUncertainty}
          onFactoidClick={handleFactoidClick}
          initialCenter={[35.0, 33.0]}
          initialZoom={4}
        />

        {/* Legend */}
        <div className="absolute bottom-8 left-4 bg-background/95 backdrop-blur-sm rounded-xl border border-border/50 p-4 shadow-lg max-w-xs">
          <h3 className="font-medium text-sm mb-3">Legend</h3>

          {/* Layers */}
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Evidence Level</p>
            {LAYER_FILTERS.map((layer) => (
              <div key={layer.id} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${layer.color}`} />
                <span>{layer.label}</span>
              </div>
            ))}
          </div>

          {/* Routes */}
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Journey Types</p>
            {Object.entries(ROUTE_TYPE_INFO).map(([type, info]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <info.icon className={`h-3 w-3 ${info.color}`} />
                <span>{info.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm">
            {locations.length.toLocaleString()} Locations
          </Badge>
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm">
            {filteredFactoids.length} Events
          </Badge>
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm">
            {filteredRoutes.length} Routes
          </Badge>
        </div>
      </div>

      {/* Filters Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="right" className="w-[320px]">
          <SheetHeader>
            <SheetTitle className="font-serif">Map Filters</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Layer Filters */}
            <div>
              <h4 className="font-medium text-sm mb-3">Evidence Level</h4>
              <div className="space-y-2">
                {LAYER_FILTERS.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      visibleLayers.has(layer.id)
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-background hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${layer.color}`} />
                      <span className="text-sm">{layer.label}</span>
                    </div>
                    {visibleLayers.has(layer.id) ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Route Filters */}
            <div>
              <h4 className="font-medium text-sm mb-3">Journey Routes</h4>
              <div className="space-y-2">
                {routes.map((route) => {
                  const info = ROUTE_TYPE_INFO[route.routeType as keyof typeof ROUTE_TYPE_INFO]
                  if (!info) return null
                  return (
                    <button
                      key={route.id}
                      onClick={() => toggleRoute(route.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        visibleRoutes.has(route.id)
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border bg-background hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <info.icon className={`h-4 w-4 ${info.color}`} />
                        <div className="text-left">
                          <span className="text-sm block">{route.name}</span>
                          <span className="text-xs text-muted-foreground">{info.label}</span>
                        </div>
                      </div>
                      {visibleRoutes.has(route.id) ? (
                        <Eye className="h-4 w-4 text-primary" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Factoid Detail Sheet */}
      <Sheet open={!!selectedFactoid} onOpenChange={() => setSelectedFactoid(null)}>
        <SheetContent side="right" className="w-[400px]">
          {selectedFactoid && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          selectedFactoid.layer === 'documented'
                            ? 'default'
                            : selectedFactoid.layer === 'attested'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {selectedFactoid.layer}
                      </Badge>
                      {selectedFactoid.category && (
                        <Badge variant="outline">{selectedFactoid.category}</Badge>
                      )}
                    </div>
                    <SheetTitle className="font-serif text-xl">
                      {selectedFactoid.summary}
                    </SheetTitle>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Confidence */}
                {selectedFactoid.confidence && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 40 40">
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-muted/30"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 18}
                            strokeDashoffset={2 * Math.PI * 18 * (1 - selectedFactoid.confidence)}
                            className="text-accent"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                          {Math.round(selectedFactoid.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Confidence Score</p>
                      <p className="text-xs text-muted-foreground">
                        Based on source quality and corroboration
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedFactoid.description && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedFactoid.description}
                    </p>
                  </div>
                )}

                {/* Location */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Location</h4>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedFactoid.location.name}</p>
                      {selectedFactoid.location.nameHistorical && (
                        <p className="text-sm text-muted-foreground">
                          Historical: {selectedFactoid.location.nameHistorical}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedFactoid.location.coordinates[1].toFixed(4)}°N,{' '}
                        {selectedFactoid.location.coordinates[0].toFixed(4)}°E
                      </p>
                      {selectedFactoid.location.uncertaintyRadiusKm && (
                        <p className="text-xs text-accent mt-1">
                          ± {selectedFactoid.location.uncertaintyRadiusKm} km uncertainty
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date */}
                {selectedFactoid.dateStart && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Date</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedFactoid.dateStart.startsWith('-')
                          ? `${selectedFactoid.dateStart.slice(1)} BCE`
                          : `${selectedFactoid.dateStart} CE`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-border">
                  <Button asChild className="w-full">
                    <a href={`/factoid/${selectedFactoid.id}`}>
                      View Full Details
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
