import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Play, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";

interface AgentRanking {
  agentName: string;
  totalAmount: number;
  paymentsCount: number;
  rank: number;
}

export const AgentRankingComparison = () => {
  const [isComparing, setIsComparing] = useState(false);
  const [period1, setPeriod1] = useState<DateRange | undefined>();
  const [period2, setPeriod2] = useState<DateRange | undefined>();
  const [period1Rankings, setPeriod1Rankings] = useState<AgentRanking[]>([]);
  const [period2Rankings, setPeriod2Rankings] = useState<AgentRanking[]>([]);

  const fetchPeriodRankings = async (dateRange: DateRange): Promise<AgentRanking[]> => {
    if (!dateRange.from || !dateRange.to) {
      throw new Error('Invalid date range');
    }

    const startDate = format(dateRange.from, 'yyyy-MM-dd');
    const endDate = format(dateRange.to, 'yyyy-MM-dd');

    // Fetch all tenants and payments
    const { data: tenants } = await supabase.from('tenants').select('*');
    const { data: payments } = await supabase
      .from('daily_payments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    // Calculate agent statistics
    const agentStats: Record<string, { totalAmount: number; paymentsCount: number }> = {};
    
    for (const payment of payments || []) {
      const tenant = tenants?.find(t => t.id === payment.tenant_id);
      if (tenant?.agent_name) {
        if (!agentStats[tenant.agent_name]) {
          agentStats[tenant.agent_name] = { totalAmount: 0, paymentsCount: 0 };
        }
        agentStats[tenant.agent_name].totalAmount += Number(payment.paid_amount) || 0;
        agentStats[tenant.agent_name].paymentsCount += 1;
      }
    }

    // Convert to rankings
    const rankings = Object.entries(agentStats)
      .map(([agentName, stats]) => ({
        agentName,
        totalAmount: stats.totalAmount,
        paymentsCount: stats.paymentsCount,
        rank: 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((agent, index) => ({ ...agent, rank: index + 1 }));

    return rankings;
  };

  const compareRankings = async () => {
    if (!period1?.from || !period1?.to || !period2?.from || !period2?.to) {
      toast.error('Please select both date ranges');
      return;
    }

    setIsComparing(true);
    try {
      const [rankings1, rankings2] = await Promise.all([
        fetchPeriodRankings(period1),
        fetchPeriodRankings(period2)
      ]);

      setPeriod1Rankings(rankings1);
      setPeriod2Rankings(rankings2);
      toast.success('Rankings comparison generated!');
    } catch (error) {
      console.error('Error comparing rankings:', error);
      toast.error('Failed to generate comparison');
    } finally {
      setIsComparing(false);
    }
  };

  const getRankChange = (agentName: string) => {
    const period1Rank = period1Rankings.find(r => r.agentName === agentName)?.rank;
    const period2Rank = period2Rankings.find(r => r.agentName === agentName)?.rank;

    if (!period1Rank || !period2Rank) return null;

    const change = period1Rank - period2Rank; // Positive = moved up
    return { change, period1Rank, period2Rank };
  };

  const renderRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const renderRankChange = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{change}</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">{change}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">0</span>
      </div>
    );
  };

  // Combine agents from both periods
  const allAgents = Array.from(
    new Set([
      ...period1Rankings.map(r => r.agentName),
      ...period2Rankings.map(r => r.agentName)
    ])
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Ranking Comparison</CardTitle>
          <CardDescription>Track agent ranking changes between two time periods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period 1 (Earlier)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !period1 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {period1?.from ? (
                      period1.to ? (
                        <>
                          {format(period1.from, "LLL dd, y")} - {format(period1.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(period1.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick earlier period</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={period1?.from}
                    selected={period1}
                    onSelect={setPeriod1}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period 2 (Later)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !period2 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {period2?.from ? (
                      period2.to ? (
                        <>
                          {format(period2.from, "LLL dd, y")} - {format(period2.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(period2.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick later period</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={period2?.from}
                    selected={period2}
                    onSelect={setPeriod2}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={compareRankings} disabled={isComparing} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isComparing ? 'Comparing...' : 'Compare Rankings'}
          </Button>
        </CardContent>
      </Card>

      {period1Rankings.length > 0 && period2Rankings.length > 0 && (
        <>
          {/* Top 3 Highlight */}
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((position) => {
              const period1Agent = period1Rankings.find(r => r.rank === position);
              const period2Agent = period2Rankings.find(r => r.rank === position);
              
              return (
                <Card key={position} className={cn(
                  "border-2",
                  position === 1 && "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20",
                  position === 2 && "border-gray-400/50 bg-gray-50/50 dark:bg-gray-950/20",
                  position === 3 && "border-amber-600/50 bg-amber-50/50 dark:bg-amber-950/20"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Position #{position}</CardTitle>
                      {renderRankBadge(position)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Period 1</p>
                      <p className="font-semibold truncate">{period1Agent?.agentName || 'N/A'}</p>
                      {period1Agent && (
                        <p className="text-sm text-muted-foreground">
                          UGX {period1Agent.totalAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Period 2</p>
                      <p className="font-semibold truncate">{period2Agent?.agentName || 'N/A'}</p>
                      {period2Agent && (
                        <p className="text-sm text-muted-foreground">
                          UGX {period2Agent.totalAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Full Rankings Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Rankings</CardTitle>
              <CardDescription>All agents ranked by performance with position changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allAgents.map((agentName) => {
                  const period1Data = period1Rankings.find(r => r.agentName === agentName);
                  const period2Data = period2Rankings.find(r => r.agentName === agentName);
                  const rankChange = getRankChange(agentName);

                  return (
                    <div
                      key={agentName}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          {period2Data && renderRankBadge(period2Data.rank)}
                          {rankChange && renderRankChange(rankChange.change)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{agentName}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span>Period 1: {period1Data ? `#${period1Data.rank}` : 'Not ranked'}</span>
                            <span>Period 2: {period2Data ? `#${period2Data.rank}` : 'Not ranked'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {period2Data && `UGX ${period2Data.totalAmount.toLocaleString()}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {period2Data && `${period2Data.paymentsCount} payments`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
