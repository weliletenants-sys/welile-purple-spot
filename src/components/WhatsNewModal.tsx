import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Zap,
  Target,
  Award,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "new" | "improved" | "fixed";
  demo?: React.ReactNode;
  benefits: string[];
}

interface WhatsNewModalProps {
  open: boolean;
  onClose: () => void;
  version: string;
}

export const WhatsNewModal = ({ open, onClose, version }: WhatsNewModalProps) => {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const features: Feature[] = [
    {
      title: "AI Help Assistant",
      description: "Get instant help with contextual guidance powered by AI. Ask questions and get answers in real-time.",
      icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
      category: "new",
      benefits: [
        "Context-aware responses based on your current page",
        "Quick question suggestions",
        "Streaming responses for faster interaction",
      ],
      demo: (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-full bg-primary">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <p className="text-sm">How do I add a new tenant?</p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Click the "Add Tenant" button in the top right...
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Visual Onboarding Tour",
      description: "New users are automatically guided through key features with spotlights and step-by-step tooltips.",
      icon: <Target className="h-8 w-8 text-green-500" />,
      category: "new",
      benefits: [
        "No reading required - visual highlights show where to look",
        "Progressive steps that don't overwhelm",
        "Skip or restart tour anytime",
      ],
      demo: (
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6 border-2 border-green-200 dark:border-green-800">
          <div className="absolute inset-0 bg-black/5 rounded-lg" />
          <div className="relative">
            <div className="inline-block px-4 py-2 bg-primary text-white rounded-lg shadow-lg animate-pulse">
              <p className="text-sm font-medium">👋 Welcome! Let me show you around...</p>
            </div>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4].map((step, i) => (
                <div
                  key={step}
                  className={cn(
                    "h-1.5 rounded-full flex-1",
                    i === 0 ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Quick Actions Panel",
      description: "Floating panel with instant access to common features. No need to navigate through menus.",
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      category: "new",
      benefits: [
        "Always accessible from any page",
        "Color-coded priority indicators",
        "One-click access to key sections",
      ],
      demo: (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg p-6 border-2 border-yellow-200 dark:border-yellow-800">
          <div className="flex flex-col items-end gap-2">
            {[
              { color: "bg-red-600", label: "Missed Payments" },
              { color: "bg-green-600", label: "Top Performers" },
              { color: "bg-blue-600", label: "Dashboard" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <div className={cn("h-10 w-10 rounded-full shadow-lg", item.color)} />
              </div>
            ))}
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent shadow-xl mt-2" />
          </div>
        </div>
      ),
    },
    {
      title: "Priority Indicators",
      description: "Visual color-coding throughout the app helps you instantly identify what needs attention.",
      icon: <Award className="h-8 w-8 text-purple-500" />,
      category: "improved",
      benefits: [
        "High priority items highlighted in red",
        "Medium priority in yellow",
        "Normal items in neutral colors",
      ],
      demo: (
        <div className="space-y-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/20 rounded border-l-4 border-red-600">
            <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-sm font-medium">High Priority</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-600">
            <div className="h-2 w-2 rounded-full bg-yellow-600" />
            <span className="text-sm font-medium">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded border-l-4 border-gray-400">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-sm font-medium">Normal</span>
          </div>
        </div>
      ),
    },
  ];

  const currentFeature = features[currentFeatureIndex];

  const nextFeature = () => {
    if (currentFeatureIndex < features.length - 1) {
      setCurrentFeatureIndex(currentFeatureIndex + 1);
    }
  };

  const prevFeature = () => {
    if (currentFeatureIndex > 0) {
      setCurrentFeatureIndex(currentFeatureIndex - 1);
    }
  };

  const getCategoryBadge = (category: Feature["category"]) => {
    const configs = {
      new: { label: "New", className: "bg-green-600 text-white" },
      improved: { label: "Improved", className: "bg-blue-600 text-white" },
      fixed: { label: "Fixed", className: "bg-purple-600 text-white" },
    };
    const config = configs[category];
    return (
      <Badge className={cn("text-xs font-semibold", config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary to-accent text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  What's New in v{version}
                </DialogTitle>
                <DialogDescription className="text-white/90 text-sm mt-1">
                  Discover the latest features and improvements
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <Card className="border-2 border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              {/* Feature Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                    {currentFeature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{currentFeature.title}</h3>
                    {getCategoryBadge(currentFeature.category)}
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                {currentFeature.description}
              </p>

              {/* Interactive Demo */}
              {currentFeature.demo && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Interactive Preview
                  </h4>
                  {currentFeature.demo}
                </div>
              )}

              <Separator className="my-6" />

              {/* Benefits */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Key Benefits</h4>
                <ul className="space-y-2">
                  {currentFeature.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* All Features Summary */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">All New Features</h4>
            <div className="grid grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <Button
                  key={index}
                  variant={index === currentFeatureIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentFeatureIndex(index)}
                  className="justify-start h-auto py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="scale-75">{feature.icon}</div>
                    <span className="text-xs">{feature.title}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Footer Navigation */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    index === currentFeatureIndex
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevFeature}
                disabled={currentFeatureIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {currentFeatureIndex < features.length - 1 ? (
                <Button size="sm" onClick={nextFeature}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={onClose} className="bg-green-600 hover:bg-green-700">
                  Got it!
                  <CheckCircle2 className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
