import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VisualProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const colorClasses = {
  default: '[&>div]:bg-primary',
  success: '[&>div]:bg-green-600',
  warning: '[&>div]:bg-yellow-600',
  danger: '[&>div]:bg-red-600',
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export const VisualProgressBar = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'default',
  size = 'md',
  tooltip
}: VisualProgressBarProps) => {
  const percentage = Math.round((value / max) * 100);
  
  const getColor = (): typeof color => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'default';
    if (percentage >= 25) return 'warning';
    return 'danger';
  };

  const autoColor = color === 'default' ? getColor() : color;

  const progressBar = (
    <div className="space-y-2 w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-muted-foreground font-semibold">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <Progress 
        value={percentage} 
        className={cn(
          "transition-all duration-300",
          sizeClasses[size],
          colorClasses[autoColor]
        )}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              {progressBar}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return progressBar;
};