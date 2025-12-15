import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  SlidersHorizontal,
  Compass,
  Plus,
  Layers,
  TrendingUp,
  Calendar,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Explore Facts',
  description: 'Browse and search historical facts',
}

function ConfidenceRing({ value }: { value: number }) {
  const percentage = Math.round(value * 100)
  const circumference = 2 * Math.PI * 18
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
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
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-accent transition-all duration-500"
        />
      </svg>
      <span className="absolute text-sm font-semibold">{percentage}%</span>
    </div>
  )
}

function FactoidCard({ factoid }: { factoid: any }) {
  const layerStyles = {
    documented: { bg: 'bg-primary/10', text: 'text-primary', label: 'Documented' },
    attested: { bg: 'bg-accent/10', text: 'text-accent', label: 'Attested' },
    inferred: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Inferred' },
  }
  const layer = layerStyles[factoid.layer as keyof typeof layerStyles] || layerStyles.inferred

  return (
    <Link href={`/factoid/${factoid.id}`} className="group block">
      <article className="relative h-full rounded-2xl border border-border/50 bg-card p-6 card-hover overflow-hidden">
        {/* Subtle gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${layer.bg} ${layer.text}`}>
                <Layers className="h-3 w-3" />
                {layer.label}
              </span>
              <Badge variant="outline" className="text-xs">
                {factoid.factoid_type}
              </Badge>
            </div>
            {factoid.community_confidence && (
              <ConfidenceRing value={factoid.community_confidence} />
            )}
          </div>

          {/* Content */}
          <h3 className="font-serif text-lg font-medium leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {factoid.summary || factoid.description?.slice(0, 100)}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
            {factoid.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{factoid.status}</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View details
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

async function FactoidList() {
  const supabase = await createClient()

  const { data: factoids, error } = await supabase
    .from('factoids')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching factoids:', error)
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Compass className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="font-serif text-lg font-medium mb-2">Unable to load factoids</h3>
        <p className="text-muted-foreground mb-6">Please try again later.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (!factoids || factoids.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <Compass className="h-8 w-8 text-accent" />
        </div>
        <h3 className="font-serif text-xl font-medium mb-2">No factoids yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Be the first to contribute historical knowledge to the platform.
        </p>
        <Button asChild>
          <Link href="/contribute">
            <Plus className="mr-2 h-4 w-4" />
            Add a Factoid
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {factoids.map((factoid, i) => (
        <div key={factoid.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
          <FactoidCard factoid={factoid} />
        </div>
      ))}
    </div>
  )
}

function FactoidListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="h-14 w-14 bg-muted rounded-full animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-6 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

const quickFilters = [
  { label: 'High Confidence', icon: TrendingUp },
  { label: 'Documented', icon: Layers },
  { label: 'Recent', icon: Calendar },
]

export default function ExplorePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative border-b border-border/50 bg-gradient-to-b from-secondary/30 to-transparent">
        <div className="container py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Explore Facts
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Browse and search the historical knowledge base. Every fact is traced to its sources
              with transparent confidence scores.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Search and Filters Bar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search historical facts..."
                className="h-12 pl-12 pr-4 text-base rounded-xl border-border/50 bg-card focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {/* Filter Button */}
            <Button variant="outline" size="lg" className="h-12 px-6 rounded-xl gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            {/* Add Button */}
            <Button asChild size="lg" className="h-12 px-6 rounded-xl">
              <Link href="/contribute">
                <Plus className="mr-2 h-4 w-4" />
                Add Factoid
              </Link>
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-sm text-muted-foreground shrink-0">Quick filters:</span>
            {quickFilters.map((filter) => (
              <Button
                key={filter.label}
                variant="outline"
                size="sm"
                className="rounded-full shrink-0 gap-1.5 hover:bg-primary/5 hover:border-primary/20"
              >
                <filter.icon className="h-3.5 w-3.5" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <Suspense fallback={<FactoidListSkeleton />}>
          <FactoidList />
        </Suspense>
      </div>
    </div>
  )
}
