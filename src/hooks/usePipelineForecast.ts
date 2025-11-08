import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ForecastFilters {
  dateFrom?: string;
  dateTo?: string;
  serviceCenter?: string;
  agentName?: string;
}

interface OverallForecast {
  expectedConversionRate: number;
  projectedConversions: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface AgentForecast {
  agentName: string;
  expectedConversions: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface ServiceCenterForecast {
  centerName: string;
  trend: 'improving' | 'stable' | 'declining';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface Insight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface PipelineForecast {
  overallForecast: OverallForecast;
  agentForecasts: AgentForecast[];
  serviceCenterForecasts: ServiceCenterForecast[];
  insights: Insight[];
}

export interface ForecastResponse {
  forecast: PipelineForecast;
  generatedAt: string;
  dataSnapshot: any;
}

export const usePipelineForecast = () => {
  return useMutation({
    mutationFn: async (filters?: ForecastFilters) => {
      const { data, error } = await supabase.functions.invoke('pipeline-forecast', {
        body: filters || {}
      });

      if (error) {
        throw error;
      }

      return data as ForecastResponse;
    },
  });
};
