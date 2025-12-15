'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Feather, Loader2, ArrowLeft, Check } from 'lucide-react'

const benefits = [
  "Save and organize your research",
  "Contribute historical knowledge",
  "Track confidence across sources",
  "Join a community of researchers",
]

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Account created! Please check your email to verify your account.')
    router.push('/login')
  }

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
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Join researchers exploring the structure of historical knowledge
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="historian123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-border/50 bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
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
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="h-12 rounded-xl border-border/50 bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              Create account
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="font-serif text-2xl font-medium mb-8">
            Why join HistoryBuff?
          </h2>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </div>
                <span className="text-foreground/80">{benefit}</span>
              </li>
            ))}
          </ul>
          <div className="mt-12 p-6 rounded-2xl bg-background/50 border border-border/50">
            <p className="font-serif text-lg italic text-foreground/80 leading-relaxed mb-3">
              "The study of history is a powerful antidote to contemporary arrogance."
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Paul Johnson</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
