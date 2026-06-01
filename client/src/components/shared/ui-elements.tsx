import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({ value, className, showLabel = false, label, size = "md" }: ProgressBarProps) {
  const height = size === "sm" ? "h-1" : size === "lg" ? "h-3" : "h-1.5";
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-label-sm text-muted-foreground uppercase tracking-widest">
            {label ?? "Progress"}
          </span>
          <span className="text-label-sm font-bold text-foreground">{clampedValue}%</span>
        </div>
      )}
      <div className={cn("w-full bg-surface-container border border-border overflow-hidden", height)}>
        <div
          className="h-full bg-foreground transition-all duration-500"
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

interface BadgeStatusProps {
  status: "active" | "inactive" | "pending" | "suspended" | "success" | "warning" | "error" | "draft" | "published";
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  active: { label: "Active", classes: "border-foreground text-foreground" },
  inactive: { label: "Inactive", classes: "border-border text-muted-foreground" },
  pending: { label: "Pending", classes: "border-border text-muted-foreground" },
  suspended: { label: "Suspended", classes: "border-destructive text-destructive" },
  success: { label: "Success", classes: "bg-foreground text-background border-foreground" },
  warning: { label: "Warning", classes: "border-border text-muted-foreground" },
  error: { label: "Error", classes: "border-destructive text-destructive" },
  draft: { label: "Draft", classes: "border-border text-muted-foreground" },
  published: { label: "Published", classes: "bg-foreground text-background border-foreground" },
};

export function BadgeStatus({ status, className }: BadgeStatusProps) {
  const config = statusConfig[status] ?? statusConfig.inactive;
  return (
    <span
      className={cn(
        "badge text-label-sm",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("empty-state", className)}>
      {icon && <div className="mb-4 opacity-40">{icon}</div>}
      <h3 className="text-headline-sm font-bold text-foreground mb-2">{title}</h3>
      {description && <p className="text-body-sm text-muted-foreground max-w-md">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
