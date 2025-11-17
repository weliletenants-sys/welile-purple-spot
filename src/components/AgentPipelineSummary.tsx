import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, DollarSign, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentPipelineSummaryProps {
  agentPhone: string;
  currentPipelineBonuses: number;
}

export const AgentPipelineSummary = ({ agentPhone, currentPipelineBonuses }: AgentPipelineSummaryProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["agentPipelineStats", agentPhone],
    queryFn: async () => {
      // Get current month pipeline tenant count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: currentMonthTenants, error: currentError } = await supabase
        .from("tenants")
        .select("id, created_at")
        .eq("agent_phone", agentPhone)
        .eq("status", "pipeline")
        .gte("created_at", startOfMonth.toISOString());

      if (currentError) throw currentError;

      // Get previous month pipeline tenant count
      const startOfPrevMonth = new Date(startOfMonth);
      startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);

      const { data: prevMonthTenants, error: prevError } = await supabase
        .from("tenants")
        .select("id")
        .eq("agent_phone", agentPhone)
        .eq("status", "pipeline")
        .gte("created_at", startOfPrevMonth.toISOString())
        .lt("created_at", startOfMonth.toISOString());

      if (prevError) throw prevError;

      // Get total pipeline tenants
      const { data: allPipelineTenants, error: allError } = await supabase
        .from("tenants")
        .select("id")
        .eq("agent_phone", agentPhone)
        .eq("status", "pipeline");

      if (allError) throw allError;

      // Get previous month bonuses
      const { data: prevMonthEarnings, error: prevEarningsError } = await supabase
        .from("agent_earnings")
        .select("amount")
        .eq("agent_phone", agentPhone)
        .eq("earning_type", "pipeline_bonus")
        .gte("created_at", startOfPrevMonth.toISOString())
        .lt("created_at", startOfMonth.toISOString());

      if (prevEarningsError) throw prevEarningsError;

      const prevMonthBonuses = prevMonthEarnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const currentMonthCount = currentMonthTenants?.length || 0;
      const prevMonthCount = prevMonthTenants?.length || 0;
      const totalPipelineCount = allPipelineTenants?.length || 0;

      return {
        totalPipelineTenants: totalPipelineCount,
        currentMonthCount,
        prevMonthCount,
        prevMonthBonuses,
        tenantTrend: currentMonthCount - prevMonthCount,
        bonusTrend: currentPipelineBonuses - prevMonthBonuses,
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendText = (trend: number) => {
    if (trend === 0) return "No change";
    const direction = trend > 0 ? "up" : "down";
    return `${direction} ${Math.abs(trend)} from last month`;
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Pipeline Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Pipeline Tenants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Total Pipeline Tenants</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">{data?.totalPipelineTenants || 0}</span>
              {data && (
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(data.tenantTrend)}
                  <span className={data.tenantTrend > 0 ? "text-green-500" : data.tenantTrend < 0 ? "text-red-500" : "text-muted-foreground"}>
                    {getTrendText(data.tenantTrend)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {data?.currentMonthCount || 0} added this month
            </div>
          </div>

          {/* Total Pipeline Bonuses */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Total Pipeline Bonuses</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">UGX {currentPipelineBonuses.toLocaleString()}</span>
              {data && (
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(data.bonusTrend)}
                  <span className={data.bonusTrend > 0 ? "text-green-500" : data.bonusTrend < 0 ? "text-red-500" : "text-muted-foreground"}>
                    {getTrendText(Math.round(data.bonusTrend))}
                  </span>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              UGX 50 per tenant
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
