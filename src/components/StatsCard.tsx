import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  description?: string;
  onClick?: () => void;
  tooltip?: string;
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const colorClasses = {
  default: 'from-card to-primary/5 border-border hover:border-primary/50',
  success: 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 hover:border-green-400',
  warning: 'from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400',
  danger: 'from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800 hover:border-red-400',
  info: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-400',
};

const iconBgClasses = {
  default: 'from-primary to-accent',
  success: 'from-green-500 to-green-600',
  warning: 'from-yellow-500 to-yellow-600',
  danger: 'from-red-500 to-red-600',
  info: 'from-blue-500 to-blue-600',
};

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description, 
  onClick,
  tooltip,
  color = 'default'
}: StatsCardProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "p-6 bg-gradient-to-br transition-all duration-300 hover-scale",
              colorClasses[color],
              onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg'
            )}
            onClick={onClick}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                  {tooltip && <Info className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-3xl font-bold text-foreground">{value}</p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
              <div className={cn("p-3 rounded-lg bg-gradient-to-br", iconBgClasses[color])}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            {trend && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs font-medium flex items-center gap-1">
                  {trend.includes('+') && <TrendingUp className="h-3 w-3 text-green-600" />}
                  {trend.includes('-') && <TrendingDown className="h-3 w-3 text-red-600" />}
                  <span className={cn(
                    trend.includes('+') && 'text-green-600',
                    trend.includes('-') && 'text-red-600',
                    !trend.includes('+') && !trend.includes('-') && 'text-primary'
                  )}>{trend}</span>
                </span>
              </div>
            )}
          </Card>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent side="top" className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
