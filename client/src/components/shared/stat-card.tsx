import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  inverted?: boolean;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  inverted = false,
  className,
  prefix,
  suffix,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return "↑";
    if (trend < 0) return "↓";
    return "→";
  };

  const getTrendColor = () => {
    if (inverted) return "text-inherit";
    if (trend === undefined) return "text-muted-foreground";
    if (trend > 0) return "text-foreground";
    if (trend < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div
      className={cn(
        "stat-card flex flex-col justify-between min-h-[120px]",
        inverted && "bg-foreground text-background border-foreground",
        className
      )}
    >
      <p
        className={cn(
          "text-label-sm uppercase tracking-widest",
          inverted ? "text-background/70" : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <div className="flex items-end justify-between mt-4">
        <p
          className={cn(
            "text-headline-lg font-bold",
            inverted ? "text-background" : "text-foreground"
          )}
        >
          {prefix}{value}{suffix}
        </p>
        {icon && (
          <span className={cn("opacity-60", inverted ? "text-background" : "text-muted-foreground")}>
            {icon}
          </span>
        )}
      </div>
      {(trend !== undefined || trendLabel) && (
        <div className={cn("flex items-center gap-1 mt-4 text-label-sm", getTrendColor())}>
          {trend !== undefined && (
            <span>{getTrendIcon()} {Math.abs(trend)}%</span>
          )}
          {trendLabel && <span>{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
