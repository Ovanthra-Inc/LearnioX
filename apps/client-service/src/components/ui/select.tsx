"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  selectedLabel?: string
  setSelectedLabel: React.Dispatch<React.SetStateAction<string | undefined>>
}

const SelectContext = React.createContext<SelectContextType | null>(null)

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
  children,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "")
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const [selectedLabel, setSelectedLabel] = React.useState<string | undefined>()

  const isControlledValue = controlledValue !== undefined
  const value = isControlledValue ? controlledValue : uncontrolledValue

  const isControlledOpen = controlledOpen !== undefined
  const open = isControlledOpen ? controlledOpen : uncontrolledOpen

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlledValue) {
        setUncontrolledValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [isControlledValue, onValueChange]
  )

  const setOpen = React.useCallback(
    (next: React.SetStateAction<boolean>) => {
      const nextOpen = typeof next === "function" ? next(open) : next
      if (!isControlledOpen) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlledOpen, onOpenChange, open]
  )

  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div ref={containerRef} className="relative w-full text-left">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

function SelectGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-group" className={cn("p-1", className)} {...props} />
}

function SelectValue({
  placeholder,
  className,
}: {
  placeholder?: string
  className?: string
}) {
  const context = React.useContext(SelectContext)
  const display = context?.selectedLabel || context?.value || placeholder

  return (
    <span
      data-slot="select-value"
      className={cn(
        "block truncate text-left",
        !context?.value && !context?.selectedLabel ? "text-muted-foreground" : "text-foreground",
        className
      )}
    >
      {display}
    </span>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    context?.setOpen((prev) => !prev)
  }

  return (
    <button
      ref={ref}
      type="button"
      role="combobox"
      aria-expanded={context?.open}
      data-state={context?.open ? "open" : "closed"}
      onClick={handleClick}
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-xs transition-[color,box-shadow] outline-none select-none cursor-pointer",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
        "hover:bg-accent/40 hover:border-input",
        "disabled:cursor-not-allowed disabled:opacity-50",
        context?.open && "border-ring ring-1 ring-ring",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
          context?.open && "rotate-180 text-foreground"
        )}
      />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

function SelectContent({
  className,
  position = "popper",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  position?: "popper" | "item-aligned"
}) {
  const context = React.useContext(SelectContext)

  if (!context?.open) {
    return null
  }

  return (
    <div
      data-slot="select-content"
      data-state={context.open ? "open" : "closed"}
      className={cn(
        "absolute z-50 mt-1 max-h-64 min-w-[8rem] w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl transition-all",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        position === "popper" && "top-full left-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  value,
  children,
  className,
  disabled,
  ...props
}: React.ComponentProps<"div"> & {
  value: string
  disabled?: boolean
}) {
  const context = React.useContext(SelectContext)
  const isSelected = context?.value === value

  React.useEffect(() => {
    if (isSelected && typeof children === "string") {
      context.setSelectedLabel(children)
    }
  }, [isSelected, children, context])

  const handleSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (typeof children === "string") {
      context?.setSelectedLabel(children)
    }
    context?.onValueChange?.(value)
    context?.setOpen(false)
  }

  return (
    <div
      data-slot="select-item"
      role="option"
      aria-selected={isSelected}
      data-disabled={disabled}
      onClick={handleSelect}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-primary/10 text-primary font-semibold",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
    </div>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
