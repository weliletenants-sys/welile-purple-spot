import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Report {
  id: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  report_date: string;
  data: {
    period: { startDate: string; endDate: string };
    totalTenants: number;
    totalPayments: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    topAgents: Array<{ name: string; amount: number }>;
    generatedAt: string;
  };
  created_at: string;
}

export const useReports = (reportType?: 'daily' | 'weekly' | 'monthly') => {
  const query = useQuery({
    queryKey: ['reports', reportType],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(30);

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as unknown as Report[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return query;
};
