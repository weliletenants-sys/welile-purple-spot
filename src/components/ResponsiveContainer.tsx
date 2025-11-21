import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveContainer = ({ children, className }: ResponsiveContainerProps) => {
  return (
    <div className={cn(
      "w-full overflow-x-hidden",
      "container-padding section-padding",
      className
    )}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

export const ResponsiveGrid = ({ children, cols = 3, className }: ResponsiveGridProps) => {
  const gridClass = cols === 2 ? "grid-responsive-2" : cols === 3 ? "grid-responsive-3" : "grid-responsive-4";
  
  return (
    <div className={cn(
      "grid gap-responsive",
      gridClass,
      className
    )}>
      {children}
    </div>
  );
};

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveTable = ({ children, className }: ResponsiveTableProps) => {
  return (
    <div className={cn(
      "mobile-scroll",
      "rounded-lg border border-border",
      className
    )}>
      <div className="min-w-full inline-block align-middle">
        {children}
      </div>
    </div>
  );
};
