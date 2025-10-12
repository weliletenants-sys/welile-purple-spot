import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  description?: string;
}

export const StatsCard = ({ title, value, icon: Icon, trend, description }: StatsCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border hover:shadow-[var(--shadow-card)] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-border">
          <span className="text-xs text-primary font-medium">{trend}</span>
        </div>
      )}
    </Card>
  );
};
