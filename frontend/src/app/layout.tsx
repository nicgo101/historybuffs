import type { Metadata } from "next"
import { Crimson_Pro, Source_Sans_3, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/layout/header"
import "./globals.css"

const crimsonPro = Crimson_Pro({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "HistoryBuff - Historical Research Platform",
    template: "%s | HistoryBuff",
  },
  description: "See the structure of historical knowledge - where it comes from, how confident we can be, and where it fails.",
  keywords: ["history", "research", "chronology", "sources", "historical facts"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${crimsonPro.variable} ${sourceSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/50 py-8 mt-auto">
            <div className="container">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg tracking-tight">HistoryBuff</span>
                  <span className="text-muted-foreground text-sm">Built for historical research</span>
                </div>
                <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                  <a href="/about" className="hover:text-foreground transition-colors">About</a>
                  <a href="/contribute" className="hover:text-foreground transition-colors">Contribute</a>
                  <a
                    href="https://github.com/nicgo101/historybuffs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </nav>
              </div>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
