'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, CheckCircle2, ArrowLeft, MailCheck } from "lucide-react"
import { toast } from "sonner"

export type AuthMode = "login" | "signup" | "forgot_password"

export function LoginForm({
  className,
  initialMode = "login",
  ...props
}: React.ComponentProps<"form"> & { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const router = useRouter()
  const {
    loginWithEmail,
    isAuthenticating,
    signupWithEmail,
    isSigningUp,
    forgotPassword,
    isSendingReset,
    fetchGoogleAuthUrl,
  } = useAuth()

  // Form Fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // State indicators
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const isSubmitting = isAuthenticating || isSigningUp || isSendingReset || isGoogleLoading

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password")
      return
    }

    const toastId = toast.loading("Signing in...")
    try {
      await loginWithEmail({ email: email.trim(), password })
      toast.success("Welcome back!", { id: toastId })
      router.push("/dashboard")
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Invalid email or password"
      toast.error(msg, { id: toastId })
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all required fields")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    const toastId = toast.loading("Creating your account...")
    try {
      await signupWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      setSignupDone(true)
      toast.success("Account created! Verification link sent to your email.", { id: toastId })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create account"
      toast.error(msg, { id: toastId })
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Please enter your email address")
      return
    }

    const toastId = toast.loading("Sending reset instructions...")
    try {
      await forgotPassword(email.trim())
      setResetDone(true)
      toast.success("Reset instructions sent! Check your inbox.", { id: toastId })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send reset link"
      toast.error(msg, { id: toastId })
    }
  }

  const handleGoogleAuth = async () => {
    if (isGoogleLoading) return
    setIsGoogleLoading(true)
    const toastId = toast.loading("Connecting to Google OAuth...")
    try {
      const authUrl = await fetchGoogleAuthUrl()
      if (authUrl) {
        toast.success("Redirecting to Google...", { id: toastId })
        window.location.href = authUrl
      } else {
        throw new Error("No authorization URL received from server")
      }
    } catch (err: any) {
      setIsGoogleLoading(false)
      const msg = err?.response?.data?.message || err?.message || "Failed to initiate Google authentication"
      toast.error(msg, { id: toastId })
    }
  }

  // ─── Post-Signup Success State ──────────────────────────────────────────────
  if (signupDone) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-foreground">Verify your email</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We sent an activation link to <strong className="text-foreground">{email}</strong>. Please check your inbox and verify your email to access all platform features.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full cursor-pointer"
          >
            Continue to Dashboard
          </Button>
          <button
            type="button"
            onClick={() => {
              setSignupDone(false)
              setMode("login")
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  // ─── Post-Forgot Password Success State ─────────────────────────────────────
  if (resetDone) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
          <MailCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-foreground">Check your inbox</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If an account exists for <strong className="text-foreground">{email}</strong>, we have sent instructions to reset your password.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setResetDone(false)
              setMode("login")
            }}
            className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  // ─── 1. LOGIN CONTEXT ───────────────────────────────────────────────────────
  if (mode === "login") {
    return (
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleLoginSubmit}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground">
              Login to your account
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setMode("forgot_password")
                }}
                className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-foreground"
              >
                Forgot your password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer"
            >
              {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Login
            </Button>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>

          <Field>
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              className="w-full cursor-pointer"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 mr-2">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
              )}
              Login with Google
            </Button>

            <FieldDescription className="text-center mt-2">
              Don&apos;t have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setMode("signup")
                }}
                className="underline underline-offset-4 font-medium text-foreground hover:text-primary cursor-pointer"
              >
                Sign up
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  // ─── 2. SIGNUP CONTEXT ──────────────────────────────────────────────────────
  if (mode === "signup") {
    return (
      <form
        className={cn("flex flex-col gap-5", className)}
        onSubmit={handleSignupSubmit}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground">
              Create an account
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="signup-name">Full Name</FieldLabel>
            <Input
              id="signup-name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="signup-email">Email</FieldLabel>
            <Input
              id="signup-email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="signup-password">Password</FieldLabel>
            <Input
              id="signup-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer"
            >
              {isSigningUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>

          <Field>
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              className="w-full cursor-pointer"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 mr-2">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
              )}
              Sign up with Google
            </Button>

            <FieldDescription className="text-center mt-2">
              Already have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setMode("login")
                }}
                className="underline underline-offset-4 font-medium text-foreground hover:text-primary cursor-pointer"
              >
                Log in
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  // ─── 3. FORGOT PASSWORD CONTEXT ─────────────────────────────────────────────
  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleForgotPasswordSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground">
            Forgot password?
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email and we&apos;ll send you password reset instructions.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
          <Input
            id="forgot-email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer"
          >
            {isSendingReset ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send Reset Link
          </Button>
        </Field>

        <div className="text-center pt-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setMode("login")
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Sign In
          </a>
        </div>
      </FieldGroup>
    </form>
  )
}
