import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "fast" | "slow";
  delay?: number;
}

function Skeleton({ className, variant = "default", delay = 0, style, ...props }: SkeletonProps) {
  const animationDuration = {
    default: "2s",
    fast: "1.5s",
    slow: "2.5s",
  }[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "[&::before]:absolute [&::before]:inset-0 [&::before]:-translate-x-full",
        "[&::before]:bg-gradient-to-r [&::before]:from-transparent [&::before]:via-muted-foreground/10 [&::before]:to-transparent",
        "[&::before]:animate-[shimmer_var(--animation-duration)_infinite]",
        className
      )}
      style={{
        ...style,
        // @ts-ignore - CSS custom properties
        "--animation-duration": animationDuration,
        "--animation-delay": `${delay}ms`,
        animationDelay: `${delay}ms`,
      }}
      {...props}
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"
        style={{
          animation: `shimmer ${animationDuration} infinite`,
          animationDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

export { Skeleton };
