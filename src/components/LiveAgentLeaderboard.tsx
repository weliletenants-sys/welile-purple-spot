import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface LeaderboardEntry {
  agentName: string;
  agentPhone: string;
  totalAmount: number;
  paymentCount: number;
  earnings: number;
  rank: number;
}

export const LiveAgentLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Fetch all payments this month
      const { data: payments } = await supabase
        .from('daily_payments')
        .select('recorded_by, paid_amount')
        .gte('date', startDate)
        .lte('date', endDate)
        .not('recorded_by', 'is', null);

      // Fetch all agents
      const { data: agents } = await supabase
        .from('tenants')
        .select('agent_name, agent_phone')
        .not('agent_name', 'eq', '')
        .not('agent_phone', 'eq', '');

      // Create unique agents map
      const uniqueAgents = new Map<string, { name: string; phone: string }>();
      agents?.forEach(a => {
        if (a.agent_name && a.agent_phone) {
          uniqueAgents.set(a.agent_name, { name: a.agent_name, phone: a.agent_phone });
        }
      });

      // Calculate totals per agent
      const agentStats = new Map<string, { total: number; count: number }>();
      payments?.forEach(p => {
        if (p.recorded_by) {
          const current = agentStats.get(p.recorded_by) || { total: 0, count: 0 };
          agentStats.set(p.recorded_by, {
            total: current.total + (Number(p.paid_amount) || 0),
            count: current.count + 1
          });
        }
      });

      // Fetch earnings for each agent
      const leaderboardData: LeaderboardEntry[] = [];
      
      for (const [agentName, stats] of agentStats.entries()) {
        const agentInfo = uniqueAgents.get(agentName);
        if (!agentInfo) continue;

        const { data: earnings } = await supabase
          .from('agent_earnings')
          .select('amount')
          .eq('agent_name', agentName)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const totalEarnings = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        leaderboardData.push({
          agentName,
          agentPhone: agentInfo.phone,
          totalAmount: stats.total,
          paymentCount: stats.count,
          earnings: totalEarnings,
          rank: 0
        });
      }

      // Sort by total amount and assign ranks
      leaderboardData.sort((a, b) => b.totalAmount - a.totalAmount);
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Set up real-time updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_payments'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center">Loading leaderboard...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Live Agent Leaderboard
        </CardTitle>
        <CardDescription>Real-time rankings for {format(new Date(), 'MMMM yyyy')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.agentName}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                entry.rank <= 3 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10">
                  {getRankBadge(entry.rank)}
                </div>
                <div>
                  <p className="font-semibold">{entry.agentName}</p>
                  <p className="text-sm text-muted-foreground">{entry.agentPhone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">UGX {entry.totalAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.paymentCount} payments • UGX {entry.earnings.toLocaleString()} earned
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
