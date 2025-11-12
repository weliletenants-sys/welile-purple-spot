import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "fast" | "slow";
  delay?: number;
  ariaLabel?: string;
}

function Skeleton({ 
  className, 
  variant = "default", 
  delay = 0, 
  style, 
  ariaLabel = "Loading content",
  ...props 
}: SkeletonProps) {
  const animationDuration = {
    default: "2s",
    fast: "1.5s",
    slow: "2.5s",
  }[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted animate-skeleton-fade-in",
        "[&>div]:absolute [&>div]:inset-0 [&>div]:-translate-x-full",
        "[&>div]:bg-gradient-to-r [&>div]:from-transparent [&>div]:via-muted-foreground/10 [&>div]:to-transparent",
        "motion-reduce:animate-none motion-reduce:opacity-100",
        className
      )}
      style={{
        ...style,
        // @ts-ignore - CSS custom properties
        "--animation-duration": animationDuration,
        animationDelay: `${delay}ms`,
      }}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
      {...props}
    >
      <span className="sr-only">{ariaLabel}</span>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent motion-reduce:hidden"
        style={{
          animation: `shimmer ${animationDuration} infinite`,
          animationDelay: `${delay + 200}ms`, // Shimmer starts 200ms after fade-in
        }}
        aria-hidden="true"
      />
    </div>
  );
}

export { Skeleton };
