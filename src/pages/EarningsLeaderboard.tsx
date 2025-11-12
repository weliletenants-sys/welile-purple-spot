import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Star, Zap, TrendingUp, Award, Sparkles } from "lucide-react";
import { BackToHome } from "@/components/BackToHome";
import { cn } from "@/lib/utils";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { useNavigate } from "react-router-dom";

interface AgentEarning {
  agent_name: string;
  agent_phone: string;
  total_earnings: number;
  commission: number;
  bonuses: number;
  recording_count: number;
  rank: number;
  achievement_level: string;
}

const ACHIEVEMENT_LEVELS = [
  { name: "Bronze", min: 0, max: 50000, color: "text-orange-600", icon: Medal },
  { name: "Silver", min: 50001, max: 150000, color: "text-slate-400", icon: Medal },
  { name: "Gold", min: 150001, max: 300000, color: "text-yellow-500", icon: Trophy },
  { name: "Platinum", min: 300001, max: 500000, color: "text-cyan-500", icon: Crown },
  { name: "Diamond", min: 500001, max: Infinity, color: "text-purple-500", icon: Sparkles },
];

const getAchievementLevel = (earnings: number) => {
  return ACHIEVEMENT_LEVELS.find(level => earnings >= level.min && earnings <= level.max) || ACHIEVEMENT_LEVELS[0];
};

const getRankBadge = (rank: number) => {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold shadow-lg">
        <Crown className="w-4 h-4" />
        <span>1st</span>
      </div>
    );
  } else if (rank === 2) {
    return (
      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 text-white font-bold shadow-lg">
        <Trophy className="w-4 h-4" />
        <span>2nd</span>
      </div>
    );
  } else if (rank === 3) {
    return (
      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold shadow-lg">
        <Medal className="w-4 h-4" />
        <span>3rd</span>
      </div>
    );
  } else {
    return (
      <Badge variant="outline" className="font-semibold">
        #{rank}
      </Badge>
    );
  }
};

export default function EarningsLeaderboard() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "all-time">("monthly");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch earnings data
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["earningsLeaderboard", period],
    queryFn: async () => {
      let startDate: Date;
      const now = new Date();

      switch (period) {
        case "daily":
          startDate = startOfDay(now);
          break;
        case "weekly":
          startDate = startOfWeek(now);
          break;
        case "monthly":
          startDate = startOfMonth(now);
          break;
        case "all-time":
          startDate = new Date(0); // Beginning of time
          break;
      }

      const { data, error } = await supabase
        .from("agent_earnings")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Aggregate earnings by agent
      const agentMap = new Map<string, AgentEarning>();

      data.forEach((earning) => {
        const key = earning.agent_name;
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agent_name: earning.agent_name,
            agent_phone: earning.agent_phone,
            total_earnings: 0,
            commission: 0,
            bonuses: 0,
            recording_count: 0,
            rank: 0,
            achievement_level: "",
          });
        }

        const agent = agentMap.get(key)!;
        const amount = Number(earning.amount);

        if (earning.earning_type === "commission") {
          agent.commission += amount;
        } else if (earning.earning_type === "recording_bonus") {
          agent.bonuses += amount;
          agent.recording_count += 1;
        } else if (earning.earning_type !== "withdrawal") {
          agent.bonuses += amount;
        }

        if (earning.earning_type !== "withdrawal") {
          agent.total_earnings += amount;
        }
      });

      // Convert to array and sort by total earnings
      const agents = Array.from(agentMap.values()).sort(
        (a, b) => b.total_earnings - a.total_earnings
      );

      // Assign ranks and achievement levels
      agents.forEach((agent, index) => {
        agent.rank = index + 1;
        agent.achievement_level = getAchievementLevel(agent.total_earnings).name;
      });

      return agents;
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("earnings-leaderboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_earnings",
        },
        (payload) => {
          console.log("Real-time earnings update:", payload);
          // Invalidate and refetch the leaderboard
          queryClient.invalidateQueries({ queryKey: ["earningsLeaderboard"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const topThree = leaderboardData?.slice(0, 3) || [];
  const restOfLeaders = leaderboardData?.slice(3) || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackToHome />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-8 h-8 text-primary animate-pulse" />
              Earnings Leaderboard
            </h1>
            <p className="text-muted-foreground">Top performers ranked by total earnings</p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="gap-1 px-3 py-1.5 text-sm animate-pulse">
              <Zap className="w-3 h-3" />
              Live Updates
            </Badge>
          </div>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v: any) => setPeriod(v)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="all-time">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-6 mt-6">
            {isLoading ? (
              <Card className="p-12">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              </Card>
            ) : !leaderboardData || leaderboardData.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No earnings yet</h3>
                <p className="text-muted-foreground">Leaderboard will populate as agents earn commissions and bonuses</p>
              </Card>
            ) : (
              <>
                {/* Top 3 Podium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topThree.map((agent, index) => {
                    const achievement = getAchievementLevel(agent.total_earnings);
                    const AchievementIcon = achievement.icon;

                    return (
                      <Card
                        key={agent.agent_name}
                        className={cn(
                          "p-6 cursor-pointer transition-all hover:scale-105",
                          index === 0 && "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 md:order-2 ring-2 ring-yellow-400",
                          index === 1 && "border-slate-400 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 md:order-1 ring-2 ring-slate-400",
                          index === 2 && "border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 md:order-3 ring-2 ring-orange-400"
                        )}
                        onClick={() => navigate(`/agent/${agent.agent_phone}`)}
                      >
                        <div className="flex flex-col items-center space-y-3">
                          {getRankBadge(agent.rank)}
                          
                          <div className="relative">
                            <div className={cn(
                              "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold",
                              index === 0 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
                              index === 1 && "bg-gradient-to-br from-slate-300 to-slate-400 text-white",
                              index === 2 && "bg-gradient-to-br from-orange-400 to-orange-500 text-white"
                            )}>
                              {agent.agent_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                              <AchievementIcon className={cn("w-6 h-6", achievement.color)} />
                            </div>
                          </div>

                          <div className="text-center">
                            <h3 className="font-bold text-lg text-foreground">{agent.agent_name}</h3>
                            <p className="text-xs text-muted-foreground">{agent.agent_phone}</p>
                          </div>

                          <div className="w-full space-y-2 pt-2 border-t">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Earnings:</span>
                              <span className="font-bold text-primary">
                                UGX {agent.total_earnings.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Commission:</span>
                              <span>UGX {agent.commission.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Bonuses:</span>
                              <span>UGX {agent.bonuses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Recordings:</span>
                              <span className="font-medium">{agent.recording_count}</span>
                            </div>
                          </div>

                          <Badge className={cn("w-full justify-center", achievement.color)}>
                            {achievement.name} Level
                          </Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Rest of Leaderboard */}
                {restOfLeaders.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Other Top Performers
                    </h3>
                    <div className="space-y-3">
                      {restOfLeaders.map((agent) => {
                        const achievement = getAchievementLevel(agent.total_earnings);
                        const AchievementIcon = achievement.icon;

                        return (
                          <div
                            key={agent.agent_name}
                            className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/agent/${agent.agent_phone}`)}
                          >
                            <div className="flex-shrink-0">
                              {getRankBadge(agent.rank)}
                            </div>

                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-foreground">
                                {agent.agent_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground truncate">{agent.agent_name}</h4>
                                <AchievementIcon className={cn("w-4 h-4 flex-shrink-0", achievement.color)} />
                              </div>
                              <p className="text-xs text-muted-foreground">{agent.agent_phone}</p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-primary">
                                UGX {agent.total_earnings.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {agent.recording_count} recordings
                              </p>
                            </div>

                            <Badge variant="outline" className={achievement.color}>
                              {achievement.name}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Achievement Legend */}
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Achievement Levels
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {ACHIEVEMENT_LEVELS.map((level) => {
                      const Icon = level.icon;
                      return (
                        <div key={level.name} className="flex items-center gap-2">
                          <Icon className={cn("w-5 h-5", level.color)} />
                          <div>
                            <p className={cn("font-semibold text-sm", level.color)}>{level.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {level.max === Infinity
                                ? `${(level.min / 1000).toFixed(0)}K+`
                                : `${(level.min / 1000).toFixed(0)}K - ${(level.max / 1000).toFixed(0)}K`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
