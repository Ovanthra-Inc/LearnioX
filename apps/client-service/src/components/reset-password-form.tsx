'use client'

import React, { useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, KeyRound, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""
  const { resetPassword, isResettingPassword } = useAuth()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error("Reset token is missing or invalid")
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

    const toastId = toast.loading("Updating password...")
    try {
      await resetPassword({
        token,
        new_password: password,
      })
      setIsSuccess(true)
      toast.success("Password updated successfully!", { id: toastId })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to reset password"
      toast.error(msg, { id: toastId })
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-foreground">Invalid Reset Link</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This password reset link is invalid or incomplete. Please request a new one.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => router.push("/forgot-password")}
            className="w-full cursor-pointer text-xs"
          >
            Request New Link
          </Button>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-foreground">Password Reset Complete</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your password has been successfully updated. You can now log in with your new password.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => router.push("/login")}
            className="w-full cursor-pointer"
          >
            Sign In Now
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleReset}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground">
            Set new password
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            Your new password must be at least 8 characters long.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="new-password">New Password</FieldLabel>
          <Input
            id="new-password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isResettingPassword}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-new-password">Confirm New Password</FieldLabel>
          <Input
            id="confirm-new-password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isResettingPassword}
          />
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={isResettingPassword}
            className="w-full cursor-pointer"
          >
            {isResettingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Reset Password
          </Button>
        </Field>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Back to Sign In
          </Link>
        </div>
      </FieldGroup>
    </form>
  )
}
