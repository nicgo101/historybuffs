import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpRight,
  Plus,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Timeline',
  description: 'View historical events on a timeline',
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function TimelineCard({ placement, index }: { placement: any; index: number }) {
  const isLeft = index % 2 === 0

  const layerStyles = {
    documented: { bg: 'bg-primary', ring: 'ring-primary/20' },
    attested: { bg: 'bg-accent', ring: 'ring-accent/20' },
    inferred: { bg: 'bg-muted-foreground', ring: 'ring-muted/20' },
  }
  const layer = layerStyles[placement.factoid?.layer as keyof typeof layerStyles] || layerStyles.inferred

  return (
    <div className={`relative flex items-start gap-6 md:gap-0 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
      {/* Timeline marker */}
      <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
        <div className={`w-4 h-4 rounded-full ${layer.bg} ring-4 ${layer.ring} shadow-lg`} />
      </div>

      {/* Date column (desktop) */}
      <div className={`hidden md:flex md:w-[calc(50%-2rem)] items-center ${isLeft ? 'justify-end pr-12' : 'justify-start pl-12'}`}>
        <div className={`text-${isLeft ? 'right' : 'left'}`}>
          <time className="block font-serif text-lg font-medium text-foreground">
            {formatDate(placement.date_start)}
          </time>
          {placement.date_end && placement.date_end !== placement.date_start && (
            <span className="text-sm text-muted-foreground">
              to {formatDate(placement.date_end)}
            </span>
          )}
          {placement.date_precision && (
            <Badge variant="outline" className="mt-2 text-xs">
              {placement.date_precision}
            </Badge>
          )}
        </div>
      </div>

      {/* Content card */}
      <div className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? 'md:pl-12' : 'md:pr-12'}`}>
        <Link href={`/factoid/${placement.factoid?.id}`} className="group block">
          <article className="relative rounded-2xl border border-border/50 bg-card p-6 card-hover overflow-hidden">
            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              {/* Mobile date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 md:hidden">
                <Calendar className="h-4 w-4" />
                <time>{formatDate(placement.date_start)}</time>
                {placement.date_precision && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {placement.date_precision}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="font-serif text-lg font-medium leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {placement.factoid?.summary || placement.factoid?.description?.slice(0, 80)}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                {placement.factoid?.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    <Layers className="h-3 w-3" />
                    {placement.factoid?.layer}
                  </span>
                  {placement.placement_confidence && (
                    <span className="text-xs text-accent font-medium">
                      {Math.round(placement.placement_confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <ArrowUpRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </article>
        </Link>
      </div>
    </div>
  )
}

async function TimelineView() {
  const supabase = await createClient()

  const { data: frames } = await supabase
    .from('reference_frames')
    .select('id')
    .eq('is_default', true)
    .single()

  if (!frames) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-serif text-lg font-medium mb-2">Reference frames not configured</h3>
        <p className="text-muted-foreground">Please set up chronological reference frames.</p>
      </div>
    )
  }

  const { data: placements, error } = await supabase
    .from('factoid_placements')
    .select(`
      *,
      factoid:factoids(*)
    `)
    .eq('frame_id', frames.id)
    .is('deleted_at', null)
    .order('date_start', { ascending: true })
    .limit(50)

  if (error) {
    console.error('Error fetching timeline:', error)
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="font-serif text-lg font-medium mb-2">Unable to load timeline</h3>
        <p className="text-muted-foreground mb-6">Please try again later.</p>
        <Button variant="outline">Try Again</Button>
      </div>
    )
  }

  if (!placements || placements.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-accent" />
        </div>
        <h3 className="font-serif text-xl font-medium mb-2">No events on timeline</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Add factoids with date placements to populate the timeline.
        </p>
        <Button asChild>
          <Link href="/contribute">
            <Plus className="mr-2 h-4 w-4" />
            Add Events
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative py-8">
      {/* Timeline line */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

      {/* Timeline items */}
      <div className="space-y-12">
        {placements.map((placement, index) => (
          <div key={placement.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
            <TimelineCard placement={placement} index={index} />
          </div>
        ))}
      </div>

      {/* End marker */}
      <div className="absolute left-6 md:left-1/2 bottom-0 -translate-x-1/2 w-3 h-3 rounded-full bg-border" />
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="relative py-8">
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-12">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`relative flex items-start gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2">
              <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
            </div>
            <div className={`hidden md:block md:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'pr-12' : 'pl-12'}`}>
              <div className="h-6 w-32 bg-muted rounded animate-pulse ml-auto" />
            </div>
            <div className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'md:pl-12' : 'md:pr-12'}`}>
              <div className="rounded-2xl border border-border/50 bg-card p-6">
                <div className="h-6 w-full bg-muted rounded animate-pulse mb-3" />
                <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TimelinePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative border-b border-border/50 bg-gradient-to-b from-secondary/30 to-transparent">
        <div className="container py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                Timeline
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                View historical events chronologically across different reference frames.
                Compare mainstream academic dating with evidence-based alternatives.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Frame Toggle */}
        <Tabs defaultValue="default" className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="h-11 p-1 rounded-full">
              <TabsTrigger value="default" className="rounded-full px-6 gap-2">
                <Calendar className="h-4 w-4" />
                Default Academic
              </TabsTrigger>
              <TabsTrigger value="evidence" className="rounded-full px-6 gap-2">
                <Sparkles className="h-4 w-4" />
                Evidence-Based
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="default">
            <Suspense fallback={<TimelineSkeleton />}>
              <TimelineView />
            </Suspense>
          </TabsContent>

          <TabsContent value="evidence">
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Evidence-based timeline view will show events dated only through scientific methods.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
