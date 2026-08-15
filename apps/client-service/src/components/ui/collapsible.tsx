"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null)

function Collapsible({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  asChild,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  asChild?: boolean
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const nextValue = typeof value === "function" ? value(open) : value
      if (!isControlled) {
        setUncontrolledOpen(nextValue)
      }
      onOpenChange?.(nextValue)
    },
    [isControlled, open, onOpenChange]
  )

  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div
        data-state={open ? "open" : "closed"}
        className={cn(className)}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

function CollapsibleTrigger({
  asChild,
  className,
  onClick,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const context = React.useContext(CollapsibleContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context?.setOpen((prev) => !prev)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: any) => {
        children.props.onClick?.(e)
        context?.setOpen((prev) => !prev)
      },
      "data-state": context?.open ? "open" : "closed",
    })
  }

  return (
    <button
      type="button"
      data-state={context?.open ? "open" : "closed"}
      onClick={handleClick}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  )
}

function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const context = React.useContext(CollapsibleContext)

  if (!context?.open) {
    return null
  }

  return (
    <div
      data-state={context.open ? "open" : "closed"}
      className={cn("overflow-hidden transition-all", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
