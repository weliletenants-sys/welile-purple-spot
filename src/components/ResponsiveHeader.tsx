import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const ResponsiveHeader = ({ 
  title, 
  subtitle, 
  icon, 
  actions,
  className 
}: ResponsiveHeaderProps) => {
  return (
    <div className={cn(
      "flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6",
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {icon && (
            <div className="shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-responsive-xl font-bold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-responsive-sm text-muted-foreground truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
