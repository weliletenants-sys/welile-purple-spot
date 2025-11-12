import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "fast" | "slow";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const shimmerClass = {
    default: "before:animate-shimmer",
    fast: "before:animate-shimmer-fast",
    slow: "before:animate-shimmer-slow",
  }[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-muted-foreground/10 before:to-transparent",
        shimmerClass,
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
