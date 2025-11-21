import { Clock, Users, FileText, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminBottomNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const AdminBottomNav = ({ activeSection, onSectionChange }: AdminBottomNavProps) => {
  const navItems = [
    { 
      id: 'requests', 
      label: 'Requests', 
      icon: Clock,
      description: 'Withdrawal requests'
    },
    { 
      id: 'agents', 
      label: 'Agents', 
      icon: Users,
      description: 'Manage agents'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: FileText,
      description: 'View reports'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Performance data'
    }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border safe-bottom"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200 tap-target relative",
                "hover:bg-accent/50 active:bg-accent",
                isActive && "text-primary"
              )}
              aria-label={item.description}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
              )}
              
              <Icon 
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span 
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
