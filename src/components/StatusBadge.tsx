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
    label: 'Active',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300',
  },
  inactive: {
    icon: XCircle,
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300',
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-300',
  },
  info: {
    icon: Circle,
    label: 'Info',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300',
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
        "flex items-center gap-1 font-medium transition-all hover-scale",
        config.className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{displayLabel}</span>
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