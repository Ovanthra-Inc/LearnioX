"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

interface TooltipContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const TooltipContext = React.createContext<TooltipContextType | null>(null)

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        className="relative inline-block"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  asChild,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return children
  }
  return (
    <div className={cn("inline-block", className)} {...props}>
      {children}
    </div>
  )
}

function TooltipContent({
  className,
  side = "top",
  align = "center",
  hidden = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  hidden?: boolean
}) {
  const context = React.useContext(TooltipContext)

  if (!context?.open || hidden) {
    return null
  }

  const sideClass =
    side === "right"
      ? "left-full top-1/2 -translate-y-1/2 ml-2"
      : side === "left"
      ? "right-full top-1/2 -translate-y-1/2 mr-2"
      : side === "bottom"
      ? "top-full left-1/2 -translate-x-1/2 mt-2"
      : "bottom-full left-1/2 -translate-x-1/2 mb-2"

  return (
    <div
      data-slot="tooltip-content"
      className={cn(
        "absolute z-50 overflow-hidden rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 pointer-events-none whitespace-nowrap shadow-md",
        sideClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
