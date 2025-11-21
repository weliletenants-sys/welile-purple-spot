import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export const ResponsiveCard = ({ 
  children, 
  className,
  padding = "md" 
}: ResponsiveCardProps) => {
  const paddingClasses = {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-5 md:p-6",
    lg: "p-5 sm:p-6 md:p-8"
  };

  return (
    <Card className={cn(
      paddingClasses[padding],
      "w-full",
      className
    )}>
      {children}
    </Card>
  );
};

interface ResponsiveCardGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export const ResponsiveCardGrid = ({ 
  children, 
  cols = 3,
  className 
}: ResponsiveCardGridProps) => {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  return (
    <div className={cn(
      "grid gap-3 sm:gap-4 md:gap-6",
      gridClasses[cols],
      className
    )}>
      {children}
    </div>
  );
};
