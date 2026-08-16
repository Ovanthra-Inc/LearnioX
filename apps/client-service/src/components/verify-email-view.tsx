'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react"
import { toast } from "sonner"

export function VerifyEmailView({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""
  const { verifyEmail, resendVerification, isResendingVerification } = useAuth()

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    if (token) {
      setStatus("loading")
      verifyEmail(token)
        .then(() => {
          setStatus("success")
          toast.success("Email verified successfully!")
        })
        .catch((err: any) => {
          setStatus("error")
          const msg = err?.response?.data?.message || err?.message || "Verification link is invalid or expired."
          setErrorMessage(msg)
          toast.error(msg)
        })
    }
  }, [token, verifyEmail])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail.trim()) {
      toast.error("Please enter your email address")
      return
    }

    const toastId = toast.loading("Sending verification link...")
    try {
      await resendVerification(resendEmail.trim())
      setResendSent(true)
      toast.success("Fresh verification link sent to your inbox!", { id: toastId })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to resend verification link"
      toast.error(msg, { id: toastId })
    }
  }

  // 1. Loading State
  if (status === "loading") {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-4", className)}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-foreground">Verifying email...</h2>
          <p className="text-xs text-muted-foreground">
            Please wait a moment while we verify your account credentials.
          </p>
        </div>
      </div>
    )
  }

  // 2. Success State
  if (status === "success") {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-4", className)}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-foreground">Email Verified!</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your LearnioX account is now fully activated. You can now access your dashboard and courses.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full cursor-pointer"
          >
            Go to Dashboard
          </Button>
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  // 3. Error or Resend View
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-4", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
        {status === "error" ? <AlertCircle className="h-6 w-6 text-destructive" /> : <Mail className="h-6 w-6" />}
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-sans text-foreground">
          {status === "error" ? "Verification Failed" : "Verify Your Email"}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {status === "error"
            ? errorMessage || "This verification link is invalid or has expired."
            : "Please enter your email to receive a new activation link."}
        </p>
      </div>

      {resendSent ? (
        <div className="rounded-lg bg-muted/60 p-4 text-xs text-muted-foreground space-y-2">
          <p>A fresh verification link has been dispatched to <strong>{resendEmail}</strong>.</p>
          <Link href="/login" className="inline-block text-foreground font-medium underline underline-offset-4">
            Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleResend} className="space-y-4 pt-2 text-left">
          <Field>
            <FieldLabel htmlFor="resend-email">Account Email</FieldLabel>
            <Input
              id="resend-email"
              type="email"
              placeholder="m@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
              disabled={isResendingVerification}
            />
          </Field>
          <Button
            type="submit"
            disabled={isResendingVerification}
            className="w-full cursor-pointer text-xs"
          >
            {isResendingVerification ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Resend Verification Link
          </Button>
          <div className="text-center pt-1">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
