'use client'

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, MailCheck, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { forgotPassword, isSendingReset } = useAuth()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Please enter your email address")
      return
    }

    const toastId = toast.loading("Sending password reset instructions...")
    try {
      await forgotPassword(email.trim())
      setIsSubmitted(true)
      toast.success("Instructions sent! Check your inbox.", { id: toastId })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send reset link"
      toast.error(msg, { id: toastId })
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
          <MailCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-foreground">Check your inbox</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If an account exists for <strong className="text-foreground">{email}</strong>, we have sent a secure password reset link.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => setIsSubmitted(false)}
            className="w-full cursor-pointer text-xs"
          >
            Try another email
          </Button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 pt-2"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground">
            Forgot password?
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            No worries, enter your email and we&apos;ll send you reset instructions.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="reset-email">Email</FieldLabel>
          <Input
            id="reset-email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSendingReset}
          />
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={isSendingReset}
            className="w-full cursor-pointer"
          >
            {isSendingReset ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send Reset Link
          </Button>
        </Field>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Sign In
          </Link>
        </div>
      </FieldGroup>
    </form>
  )
}
