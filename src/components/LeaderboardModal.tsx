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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Star, TrendingUp } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { cn } from "@/lib/utils";

interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
  userIdentifier?: string;
}

export const LeaderboardModal = ({
  open,
  onClose,
  userIdentifier,
}: LeaderboardModalProps) => {
  const [period, setPeriod] = useState<"all" | "monthly" | "weekly">("all");
  const { data: leaderboard = [], isLoading } = useLeaderboard(period);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400";
      case 3:
        return "bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-2 border-orange-500";
      default:
        return "bg-muted/30 border border-border";
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "monthly":
        return "This Month";
      case "weekly":
        return "This Week";
      default:
        return "All Time";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Leaderboard</DialogTitle>
              <DialogDescription>
                Top performers ranked by achievement points
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{getPeriodLabel()} Rankings</h3>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {leaderboard.length} Participants
              </Badge>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading leaderboard...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available for this period
                  </div>
                ) : (
                  leaderboard.map((entry) => {
                    const isCurrentUser = entry.user_identifier === userIdentifier;
                    
                    return (
                      <Card
                        key={entry.user_identifier}
                        className={cn(
                          "overflow-hidden transition-all hover-scale",
                          getRankBgColor(entry.rank),
                          isCurrentUser && "ring-2 ring-primary"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background/50">
                              {getRankIcon(entry.rank)}
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {entry.agent_name || entry.user_identifier}
                                </h4>
                                {isCurrentUser && (
                                  <Badge variant="default" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Recent Badges */}
                              {entry.recent_badges.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {entry.recent_badges.slice(0, 3).map((badge, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {badge}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-2 justify-end">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-xl font-bold text-primary">
                                  {entry.total_points.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">pts</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.badge_count} badge{entry.badge_count !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* User's Position (if not in top) */}
            {userIdentifier && leaderboard.length > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Position</span>
                  {(() => {
                    const userEntry = leaderboard.find(
                      (e) => e.user_identifier === userIdentifier
                    );
                    if (!userEntry) {
                      return <span className="text-sm">Not ranked yet</span>;
                    }
                    if (userEntry.rank <= 3) {
                      return <span className="text-sm font-semibold">In top 3! 🎉</span>;
                    }
                    return (
                      <span className="text-sm font-semibold">
                        Rank #{userEntry.rank} of {leaderboard.length}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
