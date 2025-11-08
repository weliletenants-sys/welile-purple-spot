import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, AlertCircle, Info, Circle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface PriorityIndicatorProps {
  priority: PriorityLevel;
  label?: string;
  tooltip?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const priorityConfig = {
  critical: {
    icon: AlertTriangle,
    label: 'Critical',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700',
    iconClassName: 'text-red-600 dark:text-red-400',
    dotClassName: 'bg-red-600',
  },
  high: {
    icon: AlertCircle,
    label: 'High Priority',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    iconClassName: 'text-orange-600 dark:text-orange-400',
    dotClassName: 'bg-orange-600',
  },
  medium: {
    icon: Zap,
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
    dotClassName: 'bg-yellow-600',
  },
  low: {
    icon: Circle,
    label: 'Low Priority',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    iconClassName: 'text-blue-600 dark:text-blue-400',
    dotClassName: 'bg-blue-600',
  },
  info: {
    icon: Info,
    label: 'Info',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    iconClassName: 'text-gray-600 dark:text-gray-400',
    dotClassName: 'bg-gray-600',
  },
};

const sizeClasses = {
  sm: 'text-xs py-0.5 px-2',
  md: 'text-sm py-1 px-3',
  lg: 'text-base py-1.5 px-4',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const PriorityIndicator = ({
  priority,
  label,
  tooltip,
  showIcon = true,
  showLabel = true,
  size = 'md',
  animate = false,
}: PriorityIndicatorProps) => {
  const config = priorityConfig[priority];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 font-medium transition-all border-2",
        config.className,
        sizeClasses[size],
        animate && priority === 'critical' && "animate-pulse",
        "hover-scale"
      )}
    >
      {showIcon && (
        <Icon className={cn(iconSizes[size], config.iconClassName, animate && "animate-pulse")} />
      )}
      {showLabel && <span>{displayLabel}</span>}
      {!showLabel && !showIcon && (
        <span className={cn("h-2 w-2 rounded-full", config.dotClassName, animate && "animate-pulse")} />
      )}
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

// Compact dot indicator for space-constrained areas
export const PriorityDot = ({ priority, size = 'md', animate = false }: { priority: PriorityLevel; size?: 'sm' | 'md' | 'lg'; animate?: boolean }) => {
  const config = priorityConfig[priority];
  
  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "rounded-full inline-block",
              config.dotClassName,
              dotSizes[size],
              animate && "animate-pulse"
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};