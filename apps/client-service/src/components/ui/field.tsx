import * as React from "react"
import { cn } from "@/lib/utils"

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  )
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldSeparator({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-separator"
      className={cn("relative flex items-center justify-center text-xs uppercase my-1", className)}
      {...props}
    >
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <span className="relative bg-background px-2 text-muted-foreground">
        {children}
      </span>
    </div>
  )
}

export { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator }
