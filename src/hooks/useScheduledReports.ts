import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduledReport {
  id: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useScheduledReports = () => {
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('report_type');
      
      if (error) throw error;
      return (data || []) as ScheduledReport[];
    },
  });

  const toggleSchedule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success("Schedule updated successfully");
    },
    onError: () => {
      toast.error("Failed to update schedule");
    },
  });

  const createSchedule = useMutation({
    mutationFn: async (report_type: 'daily' | 'weekly' | 'monthly') => {
      const { error } = await supabase
        .from('scheduled_reports')
        .insert({ report_type, is_active: true });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success("Schedule created successfully");
    },
    onError: () => {
      toast.error("Failed to create schedule");
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success("Schedule deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete schedule");
    },
  });

  const generateNow = useMutation({
    mutationFn: async (reportType: 'daily' | 'weekly' | 'monthly') => {
      const { data, error } = await supabase.functions.invoke('generate-reports', {
        body: { reportType }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success("Report generated successfully");
    },
    onError: () => {
      toast.error("Failed to generate report");
    },
  });

  return {
    schedules,
    isLoading,
    toggleSchedule,
    createSchedule,
    deleteSchedule,
    generateNow,
  };
};