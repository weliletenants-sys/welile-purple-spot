import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";

interface PipelineStatsByCenter {
  service_center: string;
  total_tenants: number;
  converted_tenants: number;
  conversion_rate: number;
}

interface AgentPipelineStats {
  agent_name: string;
  agent_phone: string;
  pipeline_added: number;
  pipeline_converted: number;
  conversion_rate: number;
  total_earnings: number;
}

interface WeeklyPipelineTrend {
  week_start: string;
  week_end: string;
  tenants_added: number;
  tenants_converted: number;
}

export const usePipelineStats = () => {
  // Pipeline tenants by service center
  const { data: statsByCenter = [], isLoading: loadingByCenter } = useQuery({
    queryKey: ["pipeline-stats-by-center"],
    queryFn: async () => {
      // Get all pipeline tenants with service center
      const { data: pipelineTenants, error: pipelineError } = await supabase
        .from("tenants")
        .select("id, service_center, status, created_at")
        .eq("status", "pipeline");

      if (pipelineError) throw pipelineError;

      // Get converted tenants (originally pipeline, now active)
      const { data: allTenants, error: allError } = await supabase
        .from("tenants")
        .select("id, service_center, status, created_at");

      if (allError) throw allError;

      // Group by service center
      const centerStats = new Map<string, { total: number; converted: number }>();

      pipelineTenants?.forEach((tenant) => {
        const center = tenant.service_center || "Unassigned";
        const stats = centerStats.get(center) || { total: 0, converted: 0 };
        stats.total++;
        centerStats.set(center, stats);
      });

      // Count converted tenants per service center
      allTenants?.forEach((tenant) => {
        if (tenant.status === "active") {
          const center = tenant.service_center || "Unassigned";
          const stats = centerStats.get(center);
          if (stats) {
            stats.converted++;
          }
        }
      });

      const result: PipelineStatsByCenter[] = Array.from(centerStats.entries()).map(
        ([center, stats]) => ({
          service_center: center,
          total_tenants: stats.total,
          converted_tenants: stats.converted,
          conversion_rate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
        })
      );

      return result.sort((a, b) => b.total_tenants - a.total_tenants);
    },
  });

  // Agent pipeline performance
  const { data: agentStats = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["pipeline-agent-stats"],
    queryFn: async () => {
      // Get all pipeline tenants
      const { data: pipelineTenants, error: pipelineError } = await supabase
        .from("tenants")
        .select("id, agent_name, agent_phone, status, created_at")
        .eq("status", "pipeline");

      if (pipelineError) throw pipelineError;

      // Get all active tenants that were converted from pipeline
      const { data: allTenants, error: allError } = await supabase
        .from("tenants")
        .select("id, agent_name, agent_phone, status");

      if (allError) throw allError;

      // Get pipeline earnings
      const { data: earnings, error: earningsError } = await supabase
        .from("agent_earnings")
        .select("agent_name, agent_phone, amount")
        .eq("earning_type", "pipeline_bonus");

      if (earningsError) throw earningsError;

      // Group by agent
      const agentMap = new Map<
        string,
        {
          agent_name: string;
          agent_phone: string;
          pipeline_added: number;
          pipeline_converted: number;
          total_earnings: number;
        }
      >();

      pipelineTenants?.forEach((tenant) => {
        const key = `${tenant.agent_name}-${tenant.agent_phone}`;
        const stats = agentMap.get(key) || {
          agent_name: tenant.agent_name,
          agent_phone: tenant.agent_phone,
          pipeline_added: 0,
          pipeline_converted: 0,
          total_earnings: 0,
        };
        stats.pipeline_added++;
        agentMap.set(key, stats);
      });

      allTenants?.forEach((tenant) => {
        if (tenant.status === "active") {
          const key = `${tenant.agent_name}-${tenant.agent_phone}`;
          const stats = agentMap.get(key);
          if (stats) {
            stats.pipeline_converted++;
          }
        }
      });

      earnings?.forEach((earning) => {
        const key = `${earning.agent_name}-${earning.agent_phone}`;
        const stats = agentMap.get(key);
        if (stats) {
          stats.total_earnings += Number(earning.amount);
        }
      });

      const result: AgentPipelineStats[] = Array.from(agentMap.values()).map((stats) => ({
        ...stats,
        conversion_rate:
          stats.pipeline_added > 0
            ? (stats.pipeline_converted / stats.pipeline_added) * 100
            : 0,
      }));

      return result.sort((a, b) => b.pipeline_added - a.pipeline_added);
    },
  });

  // Weekly pipeline trends (last 8 weeks)
  const { data: weeklyTrends = [], isLoading: loadingTrends } = useQuery({
    queryKey: ["pipeline-weekly-trends"],
    queryFn: async () => {
      const weeks: WeeklyPipelineTrend[] = [];
      const today = new Date();

      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 });

        // Get pipeline tenants added this week
        const { data: added, error: addedError } = await supabase
          .from("tenants")
          .select("id")
          .eq("status", "pipeline")
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString());

        if (addedError) throw addedError;

        // Get tenants converted this week (updated_at changed to active)
        const { data: converted, error: convertedError } = await supabase
          .from("tenants")
          .select("id")
          .eq("status", "active")
          .gte("updated_at", weekStart.toISOString())
          .lte("updated_at", weekEnd.toISOString());

        if (convertedError) throw convertedError;

        weeks.push({
          week_start: format(weekStart, "MMM dd"),
          week_end: format(weekEnd, "MMM dd"),
          tenants_added: added?.length || 0,
          tenants_converted: converted?.length || 0,
        });
      }

      return weeks;
    },
  });

  // Total pipeline summary
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["pipeline-summary"],
    queryFn: async () => {
      const { data: pipeline, error: pipelineError } = await supabase
        .from("tenants")
        .select("id, created_at")
        .eq("status", "pipeline");

      if (pipelineError) throw pipelineError;

      const { data: earnings, error: earningsError } = await supabase
        .from("agent_earnings")
        .select("amount")
        .eq("earning_type", "pipeline_bonus");

      if (earningsError) throw earningsError;

      const totalEarnings = earnings?.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      ) || 0;

      // Calculate this week's additions
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const thisWeek = pipeline?.filter(
        (t) => new Date(t.created_at) >= weekStart
      ).length || 0;

      return {
        total_pipeline: pipeline?.length || 0,
        total_earnings: totalEarnings,
        this_week: thisWeek,
      };
    },
  });

  return {
    statsByCenter,
    agentStats,
    weeklyTrends,
    summary,
    isLoading: loadingByCenter || loadingAgents || loadingTrends || loadingSummary,
  };
};
