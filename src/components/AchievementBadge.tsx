import { Badge as BadgeType } from "@/hooks/useAchievements";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { lazy, Suspense } from "react";
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AchievementBadgeProps {
  badge: BadgeType;
  earned?: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
  showPoints?: boolean;
  onClick?: () => void;
}

const rarityColors = {
  common: "from-gray-500 to-gray-600",
  rare: "from-blue-500 to-blue-600",
  epic: "from-purple-500 to-purple-600",
  legendary: "from-yellow-500 to-orange-600",
};

const rarityBorders = {
  common: "border-gray-300",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-yellow-400",
};

export const AchievementBadge = ({
  badge,
  earned = false,
  earnedAt,
  size = "md",
  showPoints = true,
  onClick,
}: AchievementBadgeProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  const rarityColor = rarityColors[badge.rarity as keyof typeof rarityColors] || rarityColors.common;
  const rarityBorder = rarityBorders[badge.rarity as keyof typeof rarityBorders] || rarityBorders.common;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 border-2",
        rarityBorder,
        earned ? "hover-scale cursor-pointer" : "opacity-50 grayscale",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center gap-3">
        {/* Badge Icon */}
        <div
          className={cn(
            "rounded-full flex items-center justify-center bg-gradient-to-br",
            sizeClasses[size],
            earned ? rarityColor : "from-gray-400 to-gray-500",
            earned && "shadow-lg animate-pulse-slow"
          )}
        >
          <Icon
            name={badge.icon as keyof typeof dynamicIconImports}
            size={iconSizes[size]}
            className="text-white"
          />
        </div>

        {/* Badge Info */}
        <div className="text-center space-y-1">
          <h3 className="font-bold text-sm">{badge.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {badge.description}
          </p>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-xs capitalize",
                earned && "bg-primary/10"
              )}
            >
              {badge.rarity}
            </Badge>
            {showPoints && (
              <Badge variant="secondary" className="text-xs">
                {badge.points} pts
              </Badge>
            )}
          </div>

          {earned && earnedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Earned {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
