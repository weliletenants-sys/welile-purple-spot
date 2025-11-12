import { useState } from "react";
import { useTeams, useUserTeam } from "@/hooks/useTeams";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Users, TrendingUp, Crown, Medal, Award, Star, Zap } from "lucide-react";
import { CreateTeamDialog } from "@/components/CreateTeamDialog";
import { JoinTeamDialog } from "@/components/JoinTeamDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface TeamWithEarnings {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  total_earnings: number;
  total_commission: number;
  total_bonuses: number;
  achievement_level: string;
  rank: number;
}

const getAchievementLevel = (earnings: number) => {
  if (earnings >= 10000000) return { name: "Legendary", icon: Crown, color: "text-yellow-500" };
  if (earnings >= 5000000) return { name: "Diamond", icon: Trophy, color: "text-blue-400" };
  if (earnings >= 2000000) return { name: "Platinum", icon: Medal, color: "text-purple-400" };
  if (earnings >= 1000000) return { name: "Gold", icon: Award, color: "text-yellow-600" };
  if (earnings >= 500000) return { name: "Silver", icon: Star, color: "text-gray-400" };
  return { name: "Bronze", icon: Zap, color: "text-orange-600" };
};

export default function TeamEarningsLeaderboard() {
  const [agentIdentifier] = useState(() => {
    const agentData = localStorage.getItem("agent_data");
    return agentData ? JSON.parse(agentData).phone : null;
  });

  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: userTeam } = useUserTeam(agentIdentifier);
  const { data: agentEarnings } = useAgentEarnings();
  const { toast } = useToast();

  // Calculate team earnings
  const { data: teamEarnings } = useQuery({
    queryKey: ["team-earnings", teams, agentEarnings],
    queryFn: async () => {
      if (!teams || !agentEarnings) return [];

      const teamEarningsMap = new Map<string, {
        total_earnings: number;
        total_commission: number;
        total_bonuses: number;
      }>();

      // Get team members for all teams
      const { data: allMembers } = await supabase
        .from("team_members")
        .select("team_id, user_identifier");

      if (!allMembers) return [];

      // Calculate earnings for each team
      for (const team of teams) {
        const members = allMembers.filter(m => m.team_id === team.id);
        let totalEarnings = 0;
        let totalCommission = 0;
        let totalBonuses = 0;

        members.forEach(member => {
          const agentData = agentEarnings.find(a => a.agentPhone === member.user_identifier);
          if (agentData) {
            const bonuses = (agentData.recordingBonuses || 0) + (agentData.signupBonuses || 0) + 
                           (agentData.pipelineBonuses || 0) + (agentData.dataEntryRewards || 0);
            totalEarnings += agentData.earnedCommission + bonuses;
            totalCommission += agentData.earnedCommission;
            totalBonuses += bonuses;
          }
        });

        teamEarningsMap.set(team.id, {
          total_earnings: totalEarnings,
          total_commission: totalCommission,
          total_bonuses: totalBonuses,
        });
      }

      const teamsWithEarnings: TeamWithEarnings[] = teams.map(team => {
        const earnings = teamEarningsMap.get(team.id) || { total_earnings: 0, total_commission: 0, total_bonuses: 0 };
        const level = getAchievementLevel(earnings.total_earnings);
        return {
          id: team.id,
          name: team.name,
          description: team.description,
          avatar_url: team.avatar_url,
          member_count: team.member_count || 0,
          ...earnings,
          achievement_level: level.name,
          rank: 0,
        };
      }).sort((a, b) => b.total_earnings - a.total_earnings)
        .map((team, index) => ({ ...team, rank: index + 1 }));

      return teamsWithEarnings;
    },
    enabled: !!teams && !!agentEarnings,
  });

  const handleLeaveTeam = async () => {
    if (!userTeam || !agentIdentifier) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", userTeam.id)
        .eq("user_identifier", agentIdentifier);

      if (error) throw error;

      toast({
        title: "Left Team",
        description: `You have left ${userTeam.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave team",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (teamsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Team Earnings Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Form teams and compete for collective earnings milestones
          </p>
        </div>
        
        {agentIdentifier && (
          <div className="flex gap-2">
            {userTeam ? (
              <Button variant="outline" onClick={handleLeaveTeam}>
                Leave Team
              </Button>
            ) : (
              <>
                <CreateTeamDialog userIdentifier={agentIdentifier} />
                <JoinTeamDialog userIdentifier={agentIdentifier} />
              </>
            )}
          </div>
        )}
      </div>

      {userTeam && (
        <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Your Team: {userTeam.name}
            </CardTitle>
            {userTeam.description && (
              <CardDescription>{userTeam.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{userTeam.member_count} members</span>
              </div>
              {teamEarnings && teamEarnings.find(t => t.id === userTeam.id) && (
                <>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Rank #{teamEarnings.find(t => t.id === userTeam.id)?.rank}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {teamEarnings.find(t => t.id === userTeam.id)?.achievement_level}
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          {/* Top 3 Podium */}
          {teamEarnings && teamEarnings.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* 2nd Place */}
              <Card className="mt-12">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-12 w-12 text-gray-400" />
                  </div>
                  <CardTitle className="text-lg">{teamEarnings[1].name}</CardTitle>
                  <Badge variant="secondary" className="mx-auto">Silver</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-1">
                  <p className="text-2xl font-bold text-gray-400">
                    {formatCurrency(teamEarnings[1].total_earnings)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {teamEarnings[1].member_count} members
                  </p>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="border-yellow-500 bg-gradient-to-b from-yellow-500/20 to-transparent">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Crown className="h-16 w-16 text-yellow-500" />
                  </div>
                  <CardTitle className="text-xl">{teamEarnings[0].name}</CardTitle>
                  <Badge className="mx-auto bg-yellow-500">Champion</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-1">
                  <p className="text-3xl font-bold text-yellow-500">
                    {formatCurrency(teamEarnings[0].total_earnings)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {teamEarnings[0].member_count} members
                  </p>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="mt-12">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Award className="h-12 w-12 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">{teamEarnings[2].name}</CardTitle>
                  <Badge variant="secondary" className="mx-auto">Bronze</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-1">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(teamEarnings[2].total_earnings)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {teamEarnings[2].member_count} members
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="space-y-3">
            {teamEarnings?.map((team) => {
              const level = getAchievementLevel(team.total_earnings);
              const LevelIcon = level.icon;
              const isUserTeam = userTeam?.id === team.id;

              return (
                <Card key={team.id} className={isUserTeam ? "border-primary bg-primary/5" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center min-w-12">
                          {team.rank <= 3 ? (
                            <Trophy className={`h-8 w-8 ${
                              team.rank === 1 ? "text-yellow-500" :
                              team.rank === 2 ? "text-gray-400" :
                              "text-orange-600"
                            }`} />
                          ) : (
                            <Badge variant="outline" className="text-lg font-bold">
                              #{team.rank}
                            </Badge>
                          )}
                        </div>

                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="text-lg">
                            {team.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            {isUserTeam && <Badge variant="default">Your Team</Badge>}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {team.member_count} members
                            </span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <LevelIcon className={`h-3 w-3 ${level.color}`} />
                              {level.name}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(team.total_earnings)}
                        </p>
                        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Commission: {formatCurrency(team.total_commission)}</span>
                          <span>Bonuses: {formatCurrency(team.total_bonuses)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Achievement Levels</CardTitle>
              <CardDescription>
                Unlock badges by reaching collective earnings milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { threshold: 10000000, level: "Legendary", icon: Crown, color: "text-yellow-500", desc: "Elite team performance" },
                { threshold: 5000000, level: "Diamond", icon: Trophy, color: "text-blue-400", desc: "Outstanding achievement" },
                { threshold: 2000000, level: "Platinum", icon: Medal, color: "text-purple-400", desc: "Exceptional earnings" },
                { threshold: 1000000, level: "Gold", icon: Award, color: "text-yellow-600", desc: "Impressive milestone" },
                { threshold: 500000, level: "Silver", icon: Star, color: "text-gray-400", desc: "Strong performance" },
                { threshold: 0, level: "Bronze", icon: Zap, color: "text-orange-600", desc: "Starting strong" },
              ].map((achievement) => {
                const AchIcon = achievement.icon;
                return (
                  <div key={achievement.level} className="flex items-center gap-4 p-4 rounded-lg border">
                    <AchIcon className={`h-8 w-8 ${achievement.color}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold">{achievement.level}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {formatCurrency(achievement.threshold)}+
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
