import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
  criteria: any;
}

export interface UserAchievement {
  id: string;
  badge_id: string;
  earned_at: string;
  is_viewed: boolean;
  badges: Badge;
}

export const useAchievements = (userIdentifier?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("points", { ascending: false });
      
      if (error) throw error;
      return data as Badge[];
    },
  });

  const { data: userAchievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["user-achievements", userIdentifier],
    enabled: !!userIdentifier,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          badges (*)
        `)
        .eq("user_identifier", userIdentifier!)
        .order("earned_at", { ascending: false });
      
      if (error) throw error;
      return data as UserAchievement[];
    },
  });

  const checkAchievementsMutation = useMutation({
    mutationFn: async ({ action, metadata }: { action: string; metadata?: any }) => {
      if (!userIdentifier) throw new Error("User identifier required");
      
      const { data, error } = await supabase.functions.invoke("check-achievements", {
        body: { userIdentifier, action, metadata },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.newBadges && data.newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-achievements", userIdentifier] });
        
        // Show celebration toast for new badges
        data.newBadges.forEach((badgeName: string) => {
          toast({
            title: "🎉 Achievement Unlocked!",
            description: `You earned the "${badgeName}" badge!`,
            duration: 5000,
          });
        });
      }
    },
  });

  const markAsViewedMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const { error } = await supabase
        .from("user_achievements")
        .update({ is_viewed: true })
        .eq("id", achievementId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements", userIdentifier] });
    },
  });

  const totalPoints = userAchievements.reduce((sum, achievement) => {
    return sum + (achievement.badges?.points || 0);
  }, 0);

  const unviewedCount = userAchievements.filter(a => !a.is_viewed).length;

  return {
    badges,
    userAchievements,
    badgesLoading,
    achievementsLoading,
    checkAchievements: checkAchievementsMutation.mutate,
    markAsViewed: markAsViewedMutation.mutate,
    totalPoints,
    unviewedCount,
  };
};
