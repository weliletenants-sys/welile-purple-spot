import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, ArrowRight } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { cn } from "@/lib/utils";

interface LeaderboardWidgetProps {
  onViewFull: () => void;
  userIdentifier?: string;
  limit?: number;
}

export const LeaderboardWidget = ({
  onViewFull,
  userIdentifier,
  limit = 5,
}: LeaderboardWidgetProps) => {
  const { data: leaderboard = [], isLoading } = useLeaderboard("monthly");
  const topEntries = leaderboard.slice(0, limit);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Top Performers</CardTitle>
          </div>
          <Badge variant="secondary">This Month</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading rankings...
          </div>
        ) : topEntries.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No rankings available yet
          </div>
        ) : (
          <div className="space-y-2">
            {topEntries.map((entry) => {
              const isCurrentUser = entry.user_identifier === userIdentifier;
              
              return (
                <div
                  key={entry.user_identifier}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    entry.rank <= 3 ? "bg-primary/5" : "bg-muted/30",
                    isCurrentUser && "ring-2 ring-primary"
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {entry.agent_name || entry.user_identifier}
                      </p>
                      {isCurrentUser && (
                        <Badge variant="default" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.badge_count} badges
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {entry.total_points.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={onViewFull}
        >
          View Full Leaderboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
