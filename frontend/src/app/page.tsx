import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Library,
  Clock,
  Shield,
  GitBranch,
  Search,
  Users,
  ArrowRight,
  Sparkles,
  Quote
} from "lucide-react"

const features = [
  {
    icon: Library,
    title: "Source Trees",
    description: "Every claim links back to its origins. Trace the full citation tree and see how knowledge has traveled through centuries.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    icon: Clock,
    title: "Frame-Dependent Dating",
    description: "View events through different chronological frameworks. Compare mainstream dating with evidence-based alternatives.",
    accent: "from-accent/20 to-accent/5",
  },
  {
    icon: Shield,
    title: "Confidence Scores",
    description: "Transparent confidence calculations from source quality, independence, and corroboration. Know what you can trust.",
    accent: "from-gold/20 to-gold/5",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graphs",
    description: "Discover relationships between events, people, and places. See how history connects across time and geography.",
    accent: "from-chart-3/20 to-chart-3/5",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Find historical facts with powerful search. Filter by period, region, source type, confidence level, and more.",
    accent: "from-chart-4/20 to-chart-4/5",
  },
  {
    icon: Users,
    title: "Community Research",
    description: "Contribute your expertise. Verify claims, add sources, and collaboratively build humanity's historical knowledge.",
    accent: "from-chart-5/20 to-chart-5/5",
  },
]

const stats = [
  { value: "10K+", label: "Historical Facts" },
  { value: "2.5K+", label: "Primary Sources" },
  { value: "500+", label: "Contributors" },
  { value: "50+", label: "Time Periods" },
]

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 paper-texture" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="container relative">
          <div className="flex flex-col items-center py-20 md:py-28 lg:py-36">
            {/* Eyebrow */}
            <div className="animate-fade-in-up flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">A new way to explore history</span>
            </div>

            {/* Main headline */}
            <h1 className="animate-fade-in-up stagger-1 max-w-4xl text-center font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              See the{" "}
              <span className="relative">
                <span className="relative z-10">structure</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-accent/30 -z-0" />
              </span>
              {" "}of historical knowledge
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-in-up stagger-2 mt-8 max-w-2xl text-center text-lg text-muted-foreground md:text-xl leading-relaxed">
              Explore where historical claims come from, understand the confidence we can place in them,
              and discover where our knowledge reaches its limits.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-up stagger-3 mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" asChild className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Link href="/explore">
                  Start Exploring
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                <Link href="/timeline">View Timeline</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="animate-fade-in-up stagger-4 mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-serif text-3xl md:text-4xl font-semibold text-gradient-gold">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider-ornament container">
        <Quote className="h-6 w-6 text-muted-foreground/50" />
      </div>

      {/* Quote Section */}
      <section className="container py-8">
        <blockquote className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-2xl md:text-3xl italic text-foreground/80 leading-relaxed">
            "The past is never dead. It's not even past."
          </p>
          <footer className="mt-4 text-muted-foreground">
            <span className="font-medium">William Faulkner</span>
          </footer>
        </blockquote>
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
            History, structured differently
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            HistoryBuff isn't just a database. It's a new paradigm for understanding
            how we know what we know about the past.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group relative rounded-2xl border border-border/50 bg-card p-8 card-hover animate-fade-in-up stagger-${i + 1}`}
            >
              {/* Gradient accent */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-secondary/30" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
              From source to understanding
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every piece of historical knowledge in HistoryBuff follows a rigorous path from original source to verified fact.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

            {/* Steps */}
            {[
              { step: "01", title: "Source Extraction", description: "Primary sources are analyzed by AI and human researchers to extract discrete historical claims." },
              { step: "02", title: "Citation Mapping", description: "Each claim is linked to its source, and sources are connected in citation trees showing knowledge flow." },
              { step: "03", title: "Confidence Calculation", description: "Algorithms assess source reliability, independence, and corroboration to generate confidence scores." },
              { step: "04", title: "Frame Placement", description: "Facts are placed in multiple chronological frameworks, allowing comparison between dating systems." },
            ].map((item, i) => (
              <div key={item.step} className={`relative flex items-start gap-8 mb-12 last:mb-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Number bubble */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-background border-4 border-accent shadow-lg">
                  <span className="font-serif text-xl font-semibold text-accent">{item.step}</span>
                </div>

                {/* Content */}
                <div className={`ml-24 md:ml-0 md:w-[calc(50%-4rem)] ${i % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                  <h3 className="font-serif text-xl font-medium mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-[calc(50%-4rem)]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <div className="relative mx-auto max-w-4xl rounded-3xl bg-primary p-12 md:p-16 text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary-foreground tracking-tight">
              Ready to explore the past?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
              Join researchers and history enthusiasts building a more transparent view of human history.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" asChild className="h-12 px-8 text-base">
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="h-12 px-8 text-base text-primary-foreground hover:text-primary-foreground hover:bg-white/10">
                <Link href="/explore">Browse as Guest</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
