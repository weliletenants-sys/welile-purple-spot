import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

interface DailyRecording {
  date: string;
  [agentName: string]: string | number;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const RecordingActivityChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["recordingActivityChart"],
    queryFn: async () => {
      // Get last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      // Fetch all recording bonuses from last 30 days
      const { data: bonuses, error } = await supabase
        .from("agent_earnings")
        .select("agent_name, amount, created_at")
        .eq("earning_type", "recording_bonus")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching recording activity:", error);
        throw error;
      }

      if (!bonuses || bonuses.length === 0) {
        return { chartData: [], topAgents: [] };
      }

      // Calculate total bonuses per agent to find top 5
      const agentTotals = new Map<string, number>();
      bonuses.forEach((bonus: any) => {
        if (!bonus.agent_name) return;
        const key = bonus.agent_name.trim().toUpperCase();
        const currentTotal = agentTotals.get(key) || 0;
        agentTotals.set(key, currentTotal + Number(bonus.amount));
      });

      // Get top 5 agents
      const topAgents = Array.from(agentTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([agentKey]) => {
          // Find the original agent name (with proper casing)
          const originalName = bonuses.find(
            (b: any) => b.agent_name?.trim().toUpperCase() === agentKey
          )?.agent_name;
          return originalName || agentKey;
        });

      // Group data by date and agent
      const dateMap = new Map<string, Map<string, number>>();
      
      bonuses.forEach((bonus: any) => {
        if (!bonus.agent_name) return;
        
        const agentName = bonus.agent_name;
        if (!topAgents.includes(agentName)) return; // Only include top 5
        
        const date = new Date(bonus.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        if (!dateMap.has(date)) {
          dateMap.set(date, new Map());
        }
        
        const agentMap = dateMap.get(date)!;
        const currentAmount = agentMap.get(agentName) || 0;
        agentMap.set(agentName, currentAmount + Number(bonus.amount));
      });

      // Convert to chart format
      const chartData: DailyRecording[] = Array.from(dateMap.entries()).map(([date, agentMap]) => {
        const dataPoint: DailyRecording = { date };
        topAgents.forEach(agent => {
          dataPoint[agent] = agentMap.get(agent) || 0;
        });
        return dataPoint;
      });

      return { chartData, topAgents };
    },
  });

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (!chartData || chartData.chartData.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No recording activity data</h3>
          <p className="text-muted-foreground">Recording activity trends will appear here as payments are recorded</p>
        </div>
      </Card>
    );
  }

  const { chartData: data, topAgents } = chartData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Recording Activity Trends
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Daily recording bonuses - Last 30 days
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Top 5 Performers
        </Badge>
      </div>

      <Card className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: 'Bonus Amount (UGX)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [`UGX ${value.toLocaleString()}`, '']}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                color: 'hsl(var(--foreground))'
              }}
            />
            {topAgents.map((agent, index) => (
              <Line
                key={agent}
                type="monotone"
                dataKey={agent}
                stroke={CHART_COLORS[index]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[index], r: 4 }}
                activeDot={{ r: 6 }}
                name={agent}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
