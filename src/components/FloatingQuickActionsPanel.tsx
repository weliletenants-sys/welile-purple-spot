import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  DollarSign, 
  FileText, 
  BarChart3,
  X,
  Menu,
  Clock,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

export const FloatingQuickActionsPanel = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions = [
    {
      icon: AlertTriangle,
      label: 'Missed Payments',
      color: 'bg-red-600 hover:bg-red-700',
      path: '/missed-payments',
      priority: 'high'
    },
    {
      icon: TrendingUp,
      label: 'Top Performers',
      color: 'bg-green-600 hover:bg-green-700',
      path: '/top-performers',
      priority: 'normal'
    },
    {
      icon: BarChart3,
      label: 'Executive Dashboard',
      color: 'bg-blue-600 hover:bg-blue-700',
      path: '/executive-dashboard',
      priority: 'normal'
    },
    {
      icon: Users,
      label: 'Agent Dashboard',
      color: 'bg-purple-600 hover:bg-purple-700',
      path: '/agent-dashboard',
      priority: 'normal'
    },
    {
      icon: DollarSign,
      label: 'Withdrawals',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      path: '/withdrawal-history',
      priority: 'normal'
    },
    {
      icon: Clock,
      label: 'Pipeline',
      color: 'bg-orange-600 hover:bg-orange-700',
      path: '/pipeline-tenants',
      priority: 'medium'
    },
    {
      icon: FileText,
      label: 'Reports',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      path: '/admin-dashboard',
      priority: 'normal'
    },
    {
      icon: Target,
      label: 'Risk Dashboard',
      color: 'bg-pink-600 hover:bg-pink-700',
      path: '/risk-dashboard',
      priority: 'high'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <div className="flex flex-col items-end gap-3">
          {/* Quick Action Buttons - shown when expanded */}
          <div
            className={cn(
              "flex flex-col gap-2 transition-all duration-300 origin-bottom",
              isExpanded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
            )}
          >
            {quickActions.map((action) => (
              <Tooltip key={action.path}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button
                      onClick={() => {
                        navigate(action.path);
                        setIsExpanded(false);
                      }}
                      className={cn(
                        "h-14 w-14 rounded-full shadow-lg transition-all duration-200 hover-scale text-white",
                        action.color
                      )}
                      size="icon"
                    >
                      <action.icon className="h-6 w-6" />
                    </Button>
                    {action.priority === 'high' && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 border-2 border-white animate-pulse" />
                    )}
                    {action.priority === 'medium' && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-600 border-2 border-white" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-medium">
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Main Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-tour="quick-actions"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  "h-16 w-16 rounded-full shadow-2xl transition-all duration-300 bg-gradient-to-br from-primary to-accent hover:shadow-primary/50",
                  isExpanded && "rotate-90"
                )}
                size="icon"
              >
                {isExpanded ? (
                  <X className="h-7 w-7 text-white" />
                ) : (
                  <Menu className="h-7 w-7 text-white animate-pulse" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-medium">
              <p>{isExpanded ? 'Close Menu' : 'Quick Actions'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};