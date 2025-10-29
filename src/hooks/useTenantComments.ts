import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TenantComment {
  id: string;
  tenant_id: string;
  comment_text: string;
  commenter_name: string;
  created_at: string;
  updated_at: string;
}

export const useTenantComments = (tenantId: string) => {
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["tenant-comments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_comments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TenantComment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ commentText, commenterName }: { commentText: string; commenterName: string }) => {
      const { data, error } = await supabase
        .from("tenant_comments")
        .insert({
          tenant_id: tenantId,
          comment_text: commentText,
          commenter_name: commenterName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-comments", tenantId] });
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add comment");
      console.error("Error adding comment:", error);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("tenant_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-comments", tenantId] });
      toast.success("Comment deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete comment");
      console.error("Error deleting comment:", error);
    },
  });

  return {
    comments: comments || [],
    isLoading,
    addComment,
    deleteComment,
  };
};
