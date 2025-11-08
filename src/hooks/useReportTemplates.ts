import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  metrics: string[];
  filters: Record<string, any>;
  view_options: Record<string, any>;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useReportTemplates = (reportType?: string) => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['report-templates', reportType],
    queryFn: async () => {
      let query = supabase
        .from('report_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as ReportTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          ...template,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success("Template created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create template");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReportTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success("Template updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update template");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success("Template deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates?.find(t => t.id === templateId);
      if (!template) throw new Error("Template not found");

      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: `${template.name} (Copy)`,
          description: template.description,
          report_type: template.report_type,
          metrics: template.metrics,
          filters: template.filters,
          view_options: template.view_options,
          is_default: false,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success("Template duplicated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to duplicate template");
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
};