import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { lazy, Suspense } from "react";
import { LucideProps } from "lucide-react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface IconProps extends Omit<LucideProps, "ref"> {
  name: keyof typeof dynamicIconImports;
}

const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = lazy(dynamicIconImports[name]);
  
  return (
    <Suspense fallback={<div className="h-8 w-8 bg-muted rounded animate-pulse" />}>
      <LucideIcon {...props} />
    </Suspense>
  );
};

interface BadgeNotificationProps {
  badgeName: string;
  badgeIcon: string;
  badgeDescription: string;
  badgeRarity: string;
  onClose: () => void;
}

const rarityColors = {
  common: "from-gray-500 to-gray-600",
  rare: "from-blue-500 to-blue-600",
  epic: "from-purple-500 to-purple-600",
  legendary: "from-yellow-500 to-orange-600",
};

export const BadgeNotification = ({
  badgeName,
  badgeIcon,
  badgeDescription,
  badgeRarity,
  onClose,
}: BadgeNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FFA500", "#FF6347"],
    });

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const rarityColor = rarityColors[badgeRarity as keyof typeof rarityColors] || rarityColors.common;

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <Card className="w-96 shadow-2xl border-2 border-yellow-400 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 animate-pulse" />
        
        <CardContent className="relative p-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-2 right-2 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-4">
            {/* Animated Badge Icon */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br ${rarityColor} shadow-lg animate-bounce`}
            >
              <Icon
                name={badgeIcon as keyof typeof dynamicIconImports}
                size={40}
                className="text-white"
              />
            </div>

            {/* Badge Info */}
            <div className="flex-1">
              <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                🎉 Achievement Unlocked!
              </div>
              <h3 className="font-bold text-lg mb-1">{badgeName}</h3>
              <p className="text-sm text-muted-foreground">{badgeDescription}</p>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-primary/10 text-primary capitalize">
                  {badgeRarity}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
