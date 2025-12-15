import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  SlidersHorizontal,
  Library,
  Plus,
  BookOpen,
  FileText,
  ScrollText,
  ArrowUpRight,
  Globe,
  Tag
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Sources',
  description: 'Browse historical sources and documents',
}

function SourceCard({ source }: { source: any }) {
  const typeStyles = {
    primary: { icon: ScrollText, bg: 'bg-primary/10', text: 'text-primary', label: 'Primary' },
    secondary: { icon: BookOpen, bg: 'bg-accent/10', text: 'text-accent', label: 'Secondary' },
    tertiary: { icon: FileText, bg: 'bg-muted', text: 'text-muted-foreground', label: 'Tertiary' },
  }
  const type = typeStyles[source.source_type as keyof typeof typeStyles] || typeStyles.tertiary
  const TypeIcon = type.icon

  const statusStyles = {
    pending: { bg: 'bg-muted', text: 'text-muted-foreground' },
    in_progress: { bg: 'bg-accent/10', text: 'text-accent' },
    completed: { bg: 'bg-primary/10', text: 'text-primary' },
    failed: { bg: 'bg-destructive/10', text: 'text-destructive' },
  }
  const status = statusStyles[source.extraction_status as keyof typeof statusStyles] || statusStyles.pending

  return (
    <Link href={`/source/${source.id}`} className="group block">
      <article className="relative h-full rounded-2xl border border-border/50 bg-card p-6 card-hover overflow-hidden">
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${type.bg} ${type.text}`}>
                <TypeIcon className="h-3 w-3" />
                {type.label}
              </span>
              {source.genre && (
                <Badge variant="outline" className="text-xs">
                  {source.genre}
                </Badge>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {source.extraction_status}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg font-medium leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {source.title}
          </h3>

          {/* Description */}
          {source.raw_period_covered && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4 flex-1">
              Period covered: {source.raw_period_covered}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
            <div className="flex items-center gap-3">
              {source.original_language && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{source.original_language}</span>
                </div>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View source
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

async function SourceList() {
  const supabase = await createClient()

  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching sources:', error)
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Library className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="font-serif text-lg font-medium mb-2">Unable to load sources</h3>
        <p className="text-muted-foreground mb-6">Please try again later.</p>
        <Button variant="outline">Try Again</Button>
      </div>
    )
  }

  if (!sources || sources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <Library className="h-8 w-8 text-accent" />
        </div>
        <h3 className="font-serif text-xl font-medium mb-2">No sources yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Be the first to add a historical source to the platform.
        </p>
        <Button asChild>
          <Link href="/contribute">
            <Plus className="mr-2 h-4 w-4" />
            Add a Source
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sources.map((source, i) => (
        <div key={source.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
          <SourceCard source={source} />
        </div>
      ))}
    </div>
  )
}

function SourceListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
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
  { label: 'Primary Sources', icon: ScrollText },
  { label: 'Extracted', icon: Tag },
  { label: 'Recent', icon: Library },
]

export default function SourcesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative border-b border-border/50 bg-gradient-to-b from-secondary/30 to-transparent">
        <div className="container py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Sources
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Browse historical documents and references. Primary, secondary, and tertiary
              sources form the foundation of every factoid in our knowledge base.
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
                placeholder="Search sources by title, author, or period..."
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
                Add Source
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
        <Suspense fallback={<SourceListSkeleton />}>
          <SourceList />
        </Suspense>
      </div>
    </div>
  )
}
