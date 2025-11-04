import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface WithdrawalRequest {
  id: string;
  agent_name: string;
  agent_phone: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useWithdrawalRequests = () => {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['withdrawalRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as WithdrawalRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (request: { agent_name: string; agent_phone: string; amount: number }) => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert([request])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request has been sent to admin for approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit withdrawal request: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: string; 
      status: 'approved' | 'rejected'; 
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get the withdrawal request details
      const { data: request, error: fetchError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update the withdrawal request status
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .update({
          status,
          notes,
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If approved, create a withdrawal record in agent_earnings
      if (status === 'approved' && request) {
        const { error: earningsError } = await supabase
          .from('agent_earnings')
          .insert({
            agent_phone: request.agent_phone,
            agent_name: request.agent_name,
            amount: request.amount,
            earning_type: 'withdrawal',
            payment_id: null,
            tenant_id: null,
          });

        if (earningsError) throw earningsError;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['agentEarnings'] });
      toast({
        title: "Request updated",
        description: `Withdrawal request ${variables.status}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update request: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    requests,
    isLoading,
    createRequest: createRequest.mutateAsync,
    updateRequest: updateRequest.mutateAsync,
  };
};