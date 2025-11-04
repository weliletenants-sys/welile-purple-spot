import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, TrendingUp, Trophy, Calendar, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MonthlyRecorder {
  agentName: string;
  agentPhone: string;
  monthlyRecordingBonus: number;
  recordingCount: number;
  lastMonthBonus: number;
  lastMonthCount: number;
  bonusChange: number;
  bonusChangePercent: number;
  countChange: number;
}

export const MonthlyRecordingLeaderboard = () => {
  const navigate = useNavigate();

  const { data: monthlyRecorders, isLoading } = useQuery({
    queryKey: ["monthlyRecordingLeaderboard"],
    queryFn: async () => {
      // Get start of current month
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      thisMonthStart.setHours(0, 0, 0, 0);

      // Get start of last month
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      lastMonthStart.setHours(0, 0, 0, 0);
      
      const lastMonthEnd = new Date(thisMonthStart);
      lastMonthEnd.setMilliseconds(-1); // End of previous month

      // Fetch recording bonuses from this month
      const { data: thisMonthBonuses, error: thisMonthError } = await supabase
        .from("agent_earnings")
        .select("agent_name, agent_phone, amount")
        .eq("earning_type", "recording_bonus")
        .gte("created_at", thisMonthStart.toISOString())
        .order("created_at", { ascending: false });

      if (thisMonthError) {
        console.error("Error fetching this month's bonuses:", thisMonthError);
        throw thisMonthError;
      }

      // Fetch recording bonuses from last month
      const { data: lastMonthBonuses, error: lastMonthError } = await supabase
        .from("agent_earnings")
        .select("agent_name, agent_phone, amount")
        .eq("earning_type", "recording_bonus")
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString())
        .order("created_at", { ascending: false });

      if (lastMonthError) {
        console.error("Error fetching last month's bonuses:", lastMonthError);
        throw lastMonthError;
      }

      // Group by agent for this month
      const agentMap = new Map<string, MonthlyRecorder>();
      
      thisMonthBonuses?.forEach((bonus: any) => {
        if (!bonus.agent_name) return;
        
        const key = bonus.agent_name.trim().toUpperCase();
        
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agentName: bonus.agent_name,
            agentPhone: bonus.agent_phone || "",
            monthlyRecordingBonus: 0,
            recordingCount: 0,
            lastMonthBonus: 0,
            lastMonthCount: 0,
            bonusChange: 0,
            bonusChangePercent: 0,
            countChange: 0,
          });
        }
        
        const agent = agentMap.get(key)!;
        agent.monthlyRecordingBonus += Number(bonus.amount);
        agent.recordingCount += 1;
        
        // Use first non-empty phone
        if (bonus.agent_phone && !agent.agentPhone) {
          agent.agentPhone = bonus.agent_phone;
        }
      });

      // Add last month's data
      lastMonthBonuses?.forEach((bonus: any) => {
        if (!bonus.agent_name) return;
        
        const key = bonus.agent_name.trim().toUpperCase();
        
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agentName: bonus.agent_name,
            agentPhone: bonus.agent_phone || "",
            monthlyRecordingBonus: 0,
            recordingCount: 0,
            lastMonthBonus: 0,
            lastMonthCount: 0,
            bonusChange: 0,
            bonusChangePercent: 0,
            countChange: 0,
          });
        }
        
        const agent = agentMap.get(key)!;
        agent.lastMonthBonus += Number(bonus.amount);
        agent.lastMonthCount += 1;
        
        if (bonus.agent_phone && !agent.agentPhone) {
          agent.agentPhone = bonus.agent_phone;
        }
      });

      // Calculate changes and percentages
      agentMap.forEach((agent) => {
        agent.bonusChange = agent.monthlyRecordingBonus - agent.lastMonthBonus;
        agent.countChange = agent.recordingCount - agent.lastMonthCount;
        
        if (agent.lastMonthBonus > 0) {
          agent.bonusChangePercent = (agent.bonusChange / agent.lastMonthBonus) * 100;
        } else if (agent.monthlyRecordingBonus > 0) {
          agent.bonusChangePercent = 100; // New recorder this month
        }
      });

      // Convert to array and sort by monthly recording bonus
      const recorders = Array.from(agentMap.values())
        .filter(r => r.monthlyRecordingBonus > 0) // Only show agents with recordings this month
        .sort((a, b) => b.monthlyRecordingBonus - a.monthlyRecordingBonus)
        .slice(0, 10); // Top 10

      return recorders;
    },
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-1 rounded-full font-bold shadow-lg">
          <Star className="w-4 h-4 fill-current" />
          #1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded-full font-bold shadow-lg">
          <Star className="w-4 h-4 fill-current" />
          #2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1 rounded-full font-bold shadow-lg">
          <Star className="w-4 h-4 fill-current" />
          #3
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-bold">
        #{rank}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (!monthlyRecorders || monthlyRecorders.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No recordings this month yet</h3>
          <p className="text-muted-foreground">Recording bonuses will appear here as payments are recorded</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              This Month's Top Recorders
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Recording bonuses earned this month
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <TrendingUp className="w-4 h-4 mr-1" />
          Top 10
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthlyRecorders.map((recorder, index) => (
          <Card
            key={recorder.agentName}
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              index < 3
                ? "bg-gradient-to-br from-card to-accent/10 border-2 border-accent/30"
                : "bg-gradient-to-br from-card to-primary/5"
            }`}
            onClick={() => navigate(`/agent/${encodeURIComponent(recorder.agentName)}`)}
          >
            <div className="flex items-center gap-4">
              {getRankBadge(index + 1)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-lg text-foreground truncate">
                    {recorder.agentName}
                  </p>
                  {index < 3 && (
                    <Badge variant="default" className="bg-gradient-to-r from-accent to-primary text-primary-foreground text-xs animate-pulse">
                      <Trophy className="w-3 h-3 mr-1" />
                      Top
                    </Badge>
                  )}
                </div>
                {recorder.agentPhone && (
                  <p className="text-sm text-muted-foreground truncate">
                    {recorder.agentPhone}
                  </p>
                )}
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Recordings</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-primary">{recorder.recordingCount}</p>
                        {recorder.countChange !== 0 && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0 ${
                              recorder.countChange > 0 
                                ? "text-green-600 border-green-600" 
                                : "text-red-600 border-red-600"
                            }`}
                          >
                            {recorder.countChange > 0 ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )}
                            {Math.abs(recorder.countChange)}
                          </Badge>
                        )}
                        {recorder.countChange === 0 && recorder.lastMonthCount > 0 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                            <Minus className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Earned</p>
                      <p className="text-lg font-bold text-accent">
                        UGX {recorder.monthlyRecordingBonus.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Month-over-month comparison */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">vs Last Month</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          UGX {recorder.lastMonthBonus.toLocaleString()}
                        </span>
                        {recorder.bonusChangePercent !== 0 && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0.5 font-semibold ${
                              recorder.bonusChangePercent > 0 
                                ? "bg-green-50 text-green-700 border-green-600" 
                                : "bg-red-50 text-red-700 border-red-600"
                            }`}
                          >
                            {recorder.bonusChangePercent > 0 ? (
                              <ArrowUp className="w-3 h-3 mr-0.5" />
                            ) : (
                              <ArrowDown className="w-3 h-3 mr-0.5" />
                            )}
                            {Math.abs(recorder.bonusChangePercent).toFixed(0)}%
                          </Badge>
                        )}
                        {recorder.bonusChangePercent === 0 && recorder.lastMonthBonus > 0 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground bg-muted">
                            <Minus className="w-3 h-3 mr-0.5" />
                            0%
                          </Badge>
                        )}
                        {recorder.lastMonthBonus === 0 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-600 font-semibold">
                            NEW
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
