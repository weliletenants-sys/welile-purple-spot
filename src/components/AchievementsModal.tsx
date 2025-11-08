import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Zap } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementBadge } from "@/components/AchievementBadge";
import { ShareButton } from "./ShareButton";
import { ShareCard } from "./ShareCard";

interface AchievementsModalProps {
  open: boolean;
  onClose: () => void;
  userIdentifier?: string;
}

export const AchievementsModal = ({
  open,
  onClose,
  userIdentifier,
}: AchievementsModalProps) => {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const {
    badges,
    userAchievements,
    badgesLoading,
    totalPoints,
    markAsViewed,
  } = useAchievements(userIdentifier);

  const earnedBadgeIds = userAchievements.map((a) => a.badge_id);
  const earnedBadges = badges.filter((b) => earnedBadgeIds.includes(b.id));
  const unearnedBadges = badges.filter((b) => !earnedBadgeIds.includes(b.id));

  const progressPercentage = badges.length > 0
    ? Math.round((earnedBadges.length / badges.length) * 100)
    : 0;

  const categorizedBadges = (badgeList: typeof badges) => {
    return {
      milestone: badgeList.filter((b) => b.category === "milestone"),
      performance: badgeList.filter((b) => b.category === "performance"),
      streak: badgeList.filter((b) => b.category === "streak"),
      special: badgeList.filter((b) => b.category === "special"),
    };
  };

  const categoryIcons = {
    milestone: Target,
    performance: Zap,
    streak: Star,
    special: Trophy,
  };

  return (
    <>
      {/* Hidden share card for image generation */}
      <div id="achievements-share-card" className="fixed -left-[9999px] top-0">
        <ShareCard
          type="achievement"
          data={{
            title: "Achievement Unlocked!",
            subtitle: `${earnedBadges.length} Badges Earned`,
            points: totalPoints,
            badgeCount: earnedBadges.length,
            userName: userIdentifier || "Player",
          }}
        />
      </div>

      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Achievements</DialogTitle>
              <DialogDescription>
                Track your progress and unlock badges
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {earnedBadges.length}
            </div>
            <div className="text-xs text-muted-foreground">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {progressPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">Completion</div>
          </div>
        </div>

        <Progress value={progressPercentage} className="h-2" />

        <Tabs defaultValue="all" className="flex-1">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All ({badges.length})</TabsTrigger>
            <TabsTrigger value="earned">Earned ({earnedBadges.length})</TabsTrigger>
            <TabsTrigger value="locked">Locked ({unearnedBadges.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="all" className="space-y-6">
              {Object.entries(categorizedBadges(badges)).map(([category, categoryBadges]) => {
                if (categoryBadges.length === 0) return null;
                const Icon = categoryIcons[category as keyof typeof categoryIcons];
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold capitalize">{category}</h3>
                      <span className="text-xs text-muted-foreground">
                        ({categoryBadges.filter(b => earnedBadgeIds.includes(b.id)).length}/{categoryBadges.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {categoryBadges.map((badge) => {
                        const achievement = userAchievements.find(
                          (a) => a.badge_id === badge.id
                        );
                        return (
                          <AchievementBadge
                            key={badge.id}
                            badge={badge}
                            earned={!!achievement}
                            earnedAt={achievement?.earned_at}
                            size="sm"
                            onClick={() => {
                              if (achievement && !achievement.is_viewed) {
                                markAsViewed(achievement.id);
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="earned">
              <div className="grid grid-cols-3 gap-4">
                {earnedBadges.map((badge) => {
                  const achievement = userAchievements.find(
                    (a) => a.badge_id === badge.id
                  );
                  return (
                    <AchievementBadge
                      key={badge.id}
                      badge={badge}
                      earned
                      earnedAt={achievement?.earned_at}
                      size="sm"
                    />
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="locked">
              <div className="grid grid-cols-3 gap-4">
                {unearnedBadges.map((badge) => (
                  <AchievementBadge
                    key={badge.id}
                    badge={badge}
                    earned={false}
                    size="sm"
                  />
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
