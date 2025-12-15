'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Feather, Loader2, ArrowLeft } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push(redirect)
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-12 rounded-xl border-border/50 bg-background focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="h-12 rounded-xl border-border/50 bg-background focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base shadow-lg shadow-primary/20"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create one
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Feather className="h-5 w-5 text-primary" />
            </div>
            <span className="font-serif text-2xl tracking-tight font-medium">HistoryBuff</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Enter your credentials to access your research
            </p>
          </div>

          {/* Form */}
          <Suspense
            fallback={
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-12 bg-muted rounded-xl animate-pulse" />
                  <div className="h-12 bg-muted rounded-xl animate-pulse" />
                </div>
                <div className="h-12 bg-muted rounded-xl animate-pulse" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <blockquote className="space-y-4">
            <p className="font-serif text-2xl italic text-foreground/80 leading-relaxed">
              "History is not the past. It is the present. We carry our history with us. We are our history."
            </p>
            <footer className="text-muted-foreground">
              <span className="font-medium">James Baldwin</span>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
