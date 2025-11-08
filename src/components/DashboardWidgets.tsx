import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface Widget {
  id: string;
  title: string;
  component: React.ReactNode;
  visible: boolean;
  order: number;
}

interface DashboardWidgetsProps {
  widgets: Widget[];
  onToggleWidget: (id: string) => void;
  onReorderWidgets?: (widgets: Widget[]) => void;
}

const STORAGE_KEY = "dashboard-widget-config";

export const useDashboardWidgets = (defaultWidgets: Omit<Widget, "visible" | "order">[]) => {
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const config = JSON.parse(stored);
        return defaultWidgets.map((widget, index) => ({
          ...widget,
          visible: config[widget.id]?.visible ?? true,
          order: config[widget.id]?.order ?? index,
        }));
      } catch {
        return defaultWidgets.map((widget, index) => ({
          ...widget,
          visible: true,
          order: index,
        }));
      }
    }
    return defaultWidgets.map((widget, index) => ({
      ...widget,
      visible: true,
      order: index,
    }));
  });

  const toggleWidget = (id: string) => {
    setWidgets(prev => {
      const updated = prev.map(w => 
        w.id === id ? { ...w, visible: !w.visible } : w
      );
      
      // Save to localStorage
      const config: Record<string, { visible: boolean; order: number }> = {};
      updated.forEach(w => {
        config[w.id] = { visible: w.visible, order: w.order };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      
      return updated;
    });
  };

  const visibleWidgets = widgets.filter(w => w.visible).sort((a, b) => a.order - b.order);

  return {
    widgets,
    visibleWidgets,
    toggleWidget,
  };
};

export const WidgetCustomizer = ({ widgets, onToggleWidget }: DashboardWidgetsProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize Widgets
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Dashboard Widgets</SheetTitle>
          <SheetDescription>
            Show or hide widgets on your dashboard
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="flex items-center justify-between space-x-2">
              <Label htmlFor={widget.id} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  {widget.visible ? (
                    <Eye className="h-4 w-4 text-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{widget.title}</span>
                </div>
              </Label>
              <Switch
                id={widget.id}
                checked={widget.visible}
                onCheckedChange={() => onToggleWidget(widget.id)}
              />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
