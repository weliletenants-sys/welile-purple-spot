import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, Clock, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'warning' | 'info';
  label?: string;
  tooltip?: string;
  showIcon?: boolean;
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    emoji: '✅',
    label: 'Active',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-500 border-2',
  },
  inactive: {
    icon: XCircle,
    emoji: '⭕',
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-500 border-2',
  },
  pending: {
    icon: Clock,
    emoji: '⏳',
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-500 border-2',
  },
  approved: {
    icon: CheckCircle,
    emoji: '✅',
    label: 'Approved',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-500 border-2',
  },
  rejected: {
    icon: XCircle,
    emoji: '❌',
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-500 border-2',
  },
  warning: {
    icon: AlertTriangle,
    emoji: '⚠️',
    label: 'Warning',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-500 border-2',
  },
  info: {
    icon: Circle,
    emoji: 'ℹ️',
    label: 'Info',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-500 border-2',
  },
};

export const StatusBadge = ({ 
  status, 
  label, 
  tooltip,
  showIcon = true 
}: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-2 font-bold text-base transition-all hover-scale px-4 py-2 shadow-sm",
        config.className
      )}
    >
      <span className="text-xl">{config.emoji}</span>
      <span>{displayLabel.toUpperCase()}</span>
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