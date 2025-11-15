import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WelileLogo } from "@/components/WelileLogo";
import { BackToHome } from "@/components/BackToHome";
import { ContactButtons } from "@/components/ContactButtons";
import { ArrowLeft, Zap, Trophy, Medal, Award, Crown, TrendingUp, Sparkles, Star } from "lucide-react";

const RecordingBonusLeaderboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<string>("all");
  const { data: allAgents, isLoading } = useAgentEarnings(period);

  // Filter and sort agents by recording bonuses
  const rankedAgents = allAgents
    ?.filter(agent => (agent.recordingBonuses || 0) > 0)
    .sort((a, b) => (b.recordingBonuses || 0) - (a.recordingBonuses || 0))
    .map((agent, index) => ({
      ...agent,
      rank: index + 1,
    })) || [];

  const totalRecordingBonuses = rankedAgents.reduce((sum, agent) => sum + (agent.recordingBonuses || 0), 0);
  const topEarner = rankedAgents[0];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-500 animate-bounce" />;
      case 2:
        return <Trophy className="w-7 h-7 text-slate-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <Star className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-lg px-4 py-1 shadow-lg shadow-yellow-500/50 animate-pulse">
            🥇 1st Place
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white text-base px-3 py-1 shadow-lg shadow-slate-400/50">
            🥈 2nd Place
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-gradient-to-r from-amber-700 to-amber-800 text-white text-base px-3 py-1 shadow-lg shadow-amber-700/50">
            🥉 3rd Place
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-sm">
            #{rank}
          </Badge>
        );
    }
  };

  const getCardStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-4 border-yellow-500 bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-100 dark:from-yellow-950 dark:via-yellow-900 dark:to-amber-900 shadow-2xl shadow-yellow-500/30 scale-105";
      case 2:
        return "border-3 border-slate-400 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 shadow-xl shadow-slate-400/20";
      case 3:
        return "border-3 border-amber-700 bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100 dark:from-amber-950 dark:via-amber-900 dark:to-orange-900 shadow-xl shadow-amber-700/20";
      default:
        return "border-border bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-all";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <WelileLogo />
          </div>

          <div className="text-center space-y-4 mb-8">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Recording Bonus Leaderboard
              </h1>
              <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground">
              Top performers earning bonuses through payment recordings
            </p>
          </div>

          {/* Period Filter */}
          <div className="flex justify-center mb-6">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[200px] bg-card border-2">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="p-6 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-2 border-amber-500/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Recording Bonuses</p>
                  <p className="text-3xl font-black text-amber-900 dark:text-amber-100">
                    UGX {totalRecordingBonuses.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary shadow-lg">
                  <TrendingUp className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active Earners</p>
                  <p className="text-3xl font-black text-foreground">
                    {rankedAgents.length}
                  </p>
                </div>
              </div>
            </Card>

            {topEarner && (
              <Card className="p-6 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg animate-pulse">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Top Earner</p>
                    <p className="text-2xl font-black text-yellow-900 dark:text-yellow-100 truncate">
                      {topEarner.agentName}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {!isLoading && rankedAgents.length > 0 && (
          <div className="space-y-4">
            {rankedAgents.map((agent) => (
              <Card
                key={agent.agentPhone}
                className={`p-6 transition-all duration-300 cursor-pointer ${getCardStyle(agent.rank)}`}
                onClick={() => navigate(`/agent/${encodeURIComponent(agent.agentName)}`)}
              >
                <div className="flex items-center gap-6">
                  {/* Rank Icon */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    {getRankIcon(agent.rank)}
                    <span className="text-xs font-bold text-muted-foreground mt-1">
                      {agent.rank <= 3 ? "" : `#${agent.rank}`}
                    </span>
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground truncate">
                        {agent.agentName}
                      </h3>
                      {getRankBadge(agent.rank)}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{agent.agentPhone}</p>
                      <ContactButtons phoneNumber={agent.agentPhone} iconOnly />
                    </div>
                  </div>

                  {/* Recording Bonus Amount */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Zap className={`w-6 h-6 ${agent.rank <= 3 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <p className={`text-3xl font-black ${
                        agent.rank === 1 ? 'text-yellow-900 dark:text-yellow-100' :
                        agent.rank === 2 ? 'text-slate-700 dark:text-slate-300' :
                        agent.rank === 3 ? 'text-amber-800 dark:text-amber-200' :
                        'text-foreground'
                      }`}>
                        UGX {(agent.recordingBonuses || 0).toLocaleString()}
                      </p>
                    </div>
                    {topEarner && agent.rank > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {(((agent.recordingBonuses || 0) / (topEarner.recordingBonuses || 1)) * 100).toFixed(1)}% of top earner
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Stats for Top 3 */}
                {agent.rank <= 3 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Tenants</p>
                        <p className="text-lg font-bold text-foreground">{agent.tenantsCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Commission</p>
                        <p className="text-lg font-bold text-foreground">
                          UGX {agent.earnedCommission.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Earned</p>
                        <p className="text-lg font-bold text-primary">
                          UGX {(agent.earnedCommission + (agent.recordingBonuses || 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && rankedAgents.length === 0 && (
          <Card className="p-12 text-center">
            <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Recording Bonuses Yet</h3>
            <p className="text-muted-foreground">
              No agents have earned recording bonuses in this period.
            </p>
          </Card>
        )}

        <div className="mt-8">
          <BackToHome />
        </div>
      </div>
    </div>
  );
};

export default RecordingBonusLeaderboard;
