import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Crown, Medal } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";

interface TeamLeaderboardProps {
  userTeamId?: string;
  limit?: number;
}

export const TeamLeaderboard = ({ userTeamId, limit = 10 }: TeamLeaderboardProps) => {
  const { data: teams = [], isLoading } = useTeams();

  const sortedTeams = [...teams]
    .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
    .slice(0, limit);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return (
          <span className="text-sm font-semibold text-muted-foreground">
            #{index + 1}
          </span>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Team Leaderboard</CardTitle>
          </div>
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {sortedTeams.length} Teams
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading teams...
          </div>
        ) : sortedTeams.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No teams yet. Create one to get started!
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTeams.map((team, index) => {
              const isUserTeam = team.id === userTeamId;

              return (
                <div
                  key={team.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    index < 3 ? "bg-primary/5" : "bg-muted/30",
                    isUserTeam && "ring-2 ring-primary"
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(index)}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{team.name}</p>
                      {isUserTeam && (
                        <Badge variant="default" className="text-xs">
                          Your Team
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {team.member_count} {team.member_count === 1 ? "member" : "members"}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {(team.total_points || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};