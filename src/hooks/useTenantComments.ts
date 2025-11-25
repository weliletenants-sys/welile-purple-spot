import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export interface TenantComment {
  id: string;
  tenant_id: string;
  comment_text: string;
  commenter_name: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

const COMMENTS_PER_PAGE = 3;

export const useTenantComments = (tenantId: string) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: allComments, isLoading } = useQuery({
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

  const comments = allComments?.slice(0, page * COMMENTS_PER_PAGE) || [];
  const hasMore = allComments && allComments.length > page * COMMENTS_PER_PAGE;
  const totalComments = allComments?.length || 0;

  const addComment = useMutation({
    mutationFn: async ({ commentText, commenterName, category }: { commentText: string; commenterName: string; category?: string }) => {
      const { data, error } = await supabase
        .from("tenant_comments")
        .insert({
          tenant_id: tenantId,
          comment_text: commentText,
          commenter_name: commenterName,
          category: category || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-comments", tenantId] });
      setPage(1); // Reset to first page on new comment
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

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  const resetPage = () => {
    setPage(1);
  };

  return {
    comments,
    totalComments,
    isLoading,
    addComment,
    deleteComment,
    hasMore,
    loadMore,
    resetPage,
  };
};
