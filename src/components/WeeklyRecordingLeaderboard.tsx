import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, TrendingUp, Zap, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WeeklyRecorder {
  agentName: string;
  agentPhone: string;
  weeklyRecordingBonus: number;
  recordingCount: number;
}

export const WeeklyRecordingLeaderboard = () => {
  const navigate = useNavigate();

  const { data: weeklyRecorders, isLoading } = useQuery({
    queryKey: ["weeklyRecordingLeaderboard"],
    queryFn: async () => {
      // Get start of current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      // Fetch recording bonuses from this week
      const { data: bonuses, error } = await supabase
        .from("agent_earnings")
        .select("agent_name, agent_phone, amount")
        .eq("earning_type", "recording_bonus")
        .gte("created_at", weekStart.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching weekly recording bonuses:", error);
        throw error;
      }

      // Group by agent and sum bonuses
      const agentMap = new Map<string, WeeklyRecorder>();
      
      bonuses?.forEach((bonus: any) => {
        if (!bonus.agent_name) return;
        
        const key = bonus.agent_name.trim().toUpperCase();
        
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agentName: bonus.agent_name,
            agentPhone: bonus.agent_phone || "",
            weeklyRecordingBonus: 0,
            recordingCount: 0,
          });
        }
        
        const agent = agentMap.get(key)!;
        agent.weeklyRecordingBonus += Number(bonus.amount);
        agent.recordingCount += 1;
        
        // Use first non-empty phone
        if (bonus.agent_phone && !agent.agentPhone) {
          agent.agentPhone = bonus.agent_phone;
        }
      });

      // Convert to array and sort by weekly recording bonus
      const recorders = Array.from(agentMap.values())
        .sort((a, b) => b.weeklyRecordingBonus - a.weeklyRecordingBonus)
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

  if (!weeklyRecorders || weeklyRecorders.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No recordings this week yet</h3>
          <p className="text-muted-foreground">Recording bonuses will appear here as payments are recorded</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              This Week's Top Recorders
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Recording bonuses earned this week
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <TrendingUp className="w-4 h-4 mr-1" />
          Top 10
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weeklyRecorders.map((recorder, index) => (
          <Card
            key={recorder.agentName}
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              index < 3
                ? "bg-gradient-to-br from-card to-primary/10 border-2 border-primary/30"
                : "bg-gradient-to-br from-card to-accent/5"
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
                    <Badge variant="default" className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs animate-pulse">
                      <Zap className="w-3 h-3 mr-1" />
                      Hot
                    </Badge>
                  )}
                </div>
                {recorder.agentPhone && (
                  <p className="text-sm text-muted-foreground truncate">
                    {recorder.agentPhone}
                  </p>
                )}
                
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Recordings</p>
                    <p className="text-lg font-bold text-primary">{recorder.recordingCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Earned</p>
                    <p className="text-lg font-bold text-accent">
                      UGX {recorder.weeklyRecordingBonus.toLocaleString()}
                    </p>
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
