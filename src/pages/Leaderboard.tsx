import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, ArrowLeft, Star, TrendingUp } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { cn } from "@/lib/utils";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"all" | "monthly" | "weekly">("monthly");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover-scale"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Leaderboard</h1>
                <p className="text-muted-foreground text-sm">
                  Top performers ranked by achievement points
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Rankings
                  </CardTitle>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {leaderboard.length} Participants
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
                  <TabsList className="grid grid-cols-3 w-full mb-6">
                    <TabsTrigger value="all">All Time</TabsTrigger>
                    <TabsTrigger value="monthly">This Month</TabsTrigger>
                    <TabsTrigger value="weekly">This Week</TabsTrigger>
                  </TabsList>

                  <div className="space-y-3">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading leaderboard...
                      </div>
                    ) : leaderboard.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No data available for {getPeriodLabel().toLowerCase()}
                      </div>
                    ) : (
                      leaderboard.map((entry) => (
                        <Card
                          key={entry.user_identifier}
                          className={cn(
                            "overflow-hidden transition-all hover-scale",
                            getRankBgColor(entry.rank)
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
                                <h4 className="font-semibold mb-1">
                                  {entry.agent_name || entry.user_identifier}
                                </h4>
                                
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
                      ))
                    )}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 3</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-center gap-2">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                      <Medal className="h-8 w-8 text-gray-400 mb-2" />
                      <div className="w-20 bg-gradient-to-t from-gray-400 to-gray-500 rounded-t-lg p-3 text-center">
                        <p className="text-white font-bold text-xs truncate">
                          {leaderboard[1]?.agent_name || leaderboard[1]?.user_identifier}
                        </p>
                        <p className="text-white text-xs mt-1">
                          {leaderboard[1]?.total_points}
                        </p>
                      </div>
                      <div className="w-20 h-16 bg-gray-400/30 border-t-2 border-gray-400" />
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center">
                      <Crown className="h-10 w-10 text-yellow-500 mb-2 animate-pulse" />
                      <div className="w-24 bg-gradient-to-t from-yellow-500 to-yellow-600 rounded-t-lg p-4 text-center">
                        <p className="text-white font-bold text-sm truncate">
                          {leaderboard[0]?.agent_name || leaderboard[0]?.user_identifier}
                        </p>
                        <p className="text-white text-sm mt-1">
                          {leaderboard[0]?.total_points}
                        </p>
                      </div>
                      <div className="w-24 h-24 bg-yellow-400/30 border-t-2 border-yellow-400" />
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                      <Medal className="h-8 w-8 text-orange-600 mb-2" />
                      <div className="w-20 bg-gradient-to-t from-orange-500 to-orange-600 rounded-t-lg p-3 text-center">
                        <p className="text-white font-bold text-xs truncate">
                          {leaderboard[2]?.agent_name || leaderboard[2]?.user_identifier}
                        </p>
                        <p className="text-white text-xs mt-1">
                          {leaderboard[2]?.total_points}
                        </p>
                      </div>
                      <div className="w-20 h-12 bg-orange-400/30 border-t-2 border-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competition Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Competition Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">{leaderboard.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Points Awarded</p>
                  <p className="text-2xl font-bold">
                    {leaderboard.reduce((sum, e) => sum + e.total_points, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Points</p>
                  <p className="text-2xl font-bold">
                    {leaderboard.length > 0
                      ? Math.round(
                          leaderboard.reduce((sum, e) => sum + e.total_points, 0) /
                            leaderboard.length
                        ).toLocaleString()
                      : 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
