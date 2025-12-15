'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
import type { MapFactoid, JourneyRoute } from '@/components/map'

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

// Demo data - in production this would come from Supabase
const DEMO_FACTOIDS: MapFactoid[] = [
  {
    id: '1',
    summary: 'Construction of the Great Pyramid of Giza',
    description: 'The Great Pyramid was built as a tomb for Pharaoh Khufu during the Fourth Dynasty.',
    layer: 'documented',
    confidence: 0.85,
    location: {
      id: 'giza',
      name: 'Giza',
      nameHistorical: 'Giza Necropolis',
      coordinates: [31.1342, 29.9792],
      uncertaintyRadiusKm: 0.5,
      locationType: 'point',
      locationSubtype: 'monument',
    },
    dateStart: '-2560',
    category: 'Construction',
  },
  {
    id: '2',
    summary: 'Battle of Thermopylae',
    description: 'King Leonidas and 300 Spartans made their famous last stand against the Persian army.',
    layer: 'attested',
    confidence: 0.78,
    location: {
      id: 'thermopylae',
      name: 'Thermopylae',
      nameHistorical: 'Hot Gates',
      coordinates: [22.5367, 38.7967],
      uncertaintyRadiusKm: 2,
      locationType: 'point',
      locationSubtype: 'battlefield',
    },
    dateStart: '-0480',
    category: 'Military',
  },
  {
    id: '3',
    summary: 'Library of Alexandria founded',
    description: 'The great library was established during the reign of Ptolemy II Philadelphus.',
    layer: 'attested',
    confidence: 0.72,
    location: {
      id: 'alexandria',
      name: 'Alexandria',
      nameHistorical: 'Alexandria',
      coordinates: [29.9187, 31.2001],
      uncertaintyRadiusKm: 1,
      locationType: 'point',
      locationSubtype: 'structure',
    },
    dateStart: '-0283',
    category: 'Cultural',
  },
  {
    id: '4',
    summary: 'Fall of Jerusalem to Babylon',
    description: 'Nebuchadnezzar II conquered Jerusalem and destroyed the First Temple.',
    layer: 'documented',
    confidence: 0.88,
    location: {
      id: 'jerusalem',
      name: 'Jerusalem',
      nameHistorical: 'Yerushalayim',
      coordinates: [35.2137, 31.7683],
      uncertaintyRadiusKm: 0.5,
      locationType: 'point',
      locationSubtype: 'city',
    },
    dateStart: '-0586',
    category: 'Military',
  },
  {
    id: '5',
    summary: 'Founding of Rome',
    description: 'Traditional date for the founding of Rome by Romulus.',
    layer: 'inferred',
    confidence: 0.35,
    location: {
      id: 'rome',
      name: 'Rome',
      nameHistorical: 'Roma',
      coordinates: [12.4964, 41.9028],
      uncertaintyRadiusKm: 3,
      locationType: 'point',
      locationSubtype: 'city',
    },
    dateStart: '-0753',
    category: 'Political',
  },
  {
    id: '6',
    summary: 'Construction of Persepolis begins',
    description: 'Darius I began construction of the ceremonial capital of the Achaemenid Empire.',
    layer: 'documented',
    confidence: 0.82,
    location: {
      id: 'persepolis',
      name: 'Persepolis',
      nameHistorical: 'Parsa',
      coordinates: [52.8917, 29.9353],
      uncertaintyRadiusKm: 0.5,
      locationType: 'point',
      locationSubtype: 'structure',
    },
    dateStart: '-0515',
    category: 'Construction',
  },
]

const DEMO_ROUTES: JourneyRoute[] = [
  {
    id: 'alexander',
    name: "Alexander's Campaign",
    description: 'The military campaign of Alexander the Great from Macedonia to India.',
    routeType: 'campaign',
    coordinates: [
      [22.9444, 40.6401], // Pella
      [26.2389, 39.9575], // Troy
      [36.1627, 36.2021], // Issus
      [35.5018, 33.8938], // Tyre
      [31.2357, 30.0444], // Alexandria
      [44.3661, 33.3152], // Babylon
      [52.8917, 29.9353], // Persepolis
      [69.1723, 34.5281], // Kabul
    ],
  },
  {
    id: 'exodus',
    name: 'Journey of the Exodus',
    description: 'Traditional route of the Israelite exodus from Egypt.',
    routeType: 'migration',
    coordinates: [
      [31.2357, 30.0444], // Egypt
      [32.5567, 29.9667], // Succoth
      [33.9667, 28.5667], // Sinai area
      [34.9533, 29.5569], // Gulf of Aqaba
      [35.2137, 31.7683], // Jerusalem
    ],
  },
  {
    id: 'paul',
    name: "Paul's First Missionary Journey",
    description: "The apostle Paul's first missionary journey through Asia Minor.",
    routeType: 'pilgrimage',
    coordinates: [
      [36.1566, 36.2028], // Antioch
      [32.8597, 36.9181], // Seleucia
      [33.0333, 34.6667], // Cyprus (Salamis)
      [30.6206, 36.8969], // Perga
      [31.5878, 37.8469], // Pisidian Antioch
      [32.4667, 37.9833], // Iconium
      [32.4667, 37.0833], // Lystra
      [36.1566, 36.2028], // Return to Antioch
    ],
  },
]

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
  const [selectedFactoid, setSelectedFactoid] = useState<MapFactoid | null>(null)
  const [showUncertainty, setShowUncertainty] = useState(true)
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(['documented', 'attested', 'inferred'])
  )
  const [visibleRoutes, setVisibleRoutes] = useState<Set<string>>(
    new Set(DEMO_ROUTES.map((r) => r.id))
  )
  const [showFilters, setShowFilters] = useState(false)

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
  const filteredFactoids = DEMO_FACTOIDS.filter((f) => visibleLayers.has(f.layer))
  const filteredRoutes = DEMO_ROUTES.filter((r) => visibleRoutes.has(r.id))

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
                {DEMO_ROUTES.map((route) => {
                  const info = ROUTE_TYPE_INFO[route.routeType]
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
