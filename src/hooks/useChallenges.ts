import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  points_reward: number;
  badge_reward?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_identifier: string;
  current_value: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  challenge?: Challenge;
}

export const useChallenges = () => {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_challenges")
        .select("*")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString().split("T")[0])
        .order("end_date", { ascending: true });

      if (error) throw error;
      return data as Challenge[];
    },
  });
};

export const useChallengeProgress = (userIdentifier: string) => {
  return useQuery({
    queryKey: ["challenge-progress", userIdentifier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_progress")
        .select(`
          *,
          monthly_challenges (*)
        `)
        .eq("user_identifier", userIdentifier);

      if (error) throw error;
      return data as any[];
    },
    enabled: !!userIdentifier,
  });
};

export const useUserChallenges = (userIdentifier: string) => {
  const { data: challenges = [] } = useChallenges();
  const { data: progress = [] } = useChallengeProgress(userIdentifier);

  const challengesWithProgress = challenges.map((challenge) => {
    const userProgress = progress.find(
      (p: any) => p.challenge_id === challenge.id
    );

    return {
      ...challenge,
      current_value: userProgress?.current_value || 0,
      completed: userProgress?.completed || false,
      progress_id: userProgress?.id,
      progress_percentage: Math.min(
        100,
        ((userProgress?.current_value || 0) / challenge.target_value) * 100
      ),
    };
  });

  return {
    challenges: challengesWithProgress,
    completedCount: challengesWithProgress.filter((c) => c.completed).length,
    totalPoints: challengesWithProgress
      .filter((c) => c.completed)
      .reduce((sum, c) => sum + c.points_reward, 0),
  };
};

export const useUpdateChallengeProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      userIdentifier,
      incrementBy = 1,
    }: {
      challengeId: string;
      userIdentifier: string;
      incrementBy?: number;
    }) => {
      // Get current progress
      const { data: existing } = await supabase
        .from("challenge_progress")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("user_identifier", userIdentifier)
        .single();

      const newValue = (existing?.current_value || 0) + incrementBy;

      // Get challenge to check target
      const { data: challenge } = await supabase
        .from("monthly_challenges")
        .select("target_value, points_reward")
        .eq("id", challengeId)
        .single();

      const isCompleted =
        challenge && newValue >= challenge.target_value;

      if (existing) {
        // Update existing progress
        const { data, error } = await supabase
          .from("challenge_progress")
          .update({
            current_value: newValue,
            completed: isCompleted,
            completed_at: isCompleted && !existing.completed ? new Date().toISOString() : existing.completed_at,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;

        // Award points if just completed
        if (isCompleted && !existing.completed && challenge) {
          await supabase.from("agent_points").insert({
            agent_name: userIdentifier,
            agent_phone: userIdentifier,
            points: challenge.points_reward,
            points_source: "challenge_completion",
            description: `Completed challenge: ${challengeId}`,
          });
        }

        return data;
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from("challenge_progress")
          .insert({
            challenge_id: challengeId,
            user_identifier: userIdentifier,
            current_value: newValue,
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;

        // Award points if completed on first try
        if (isCompleted && challenge) {
          await supabase.from("agent_points").insert({
            agent_name: userIdentifier,
            agent_phone: userIdentifier,
            points: challenge.points_reward,
            points_source: "challenge_completion",
            description: `Completed challenge: ${challengeId}`,
          });
        }

        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["challenge-progress", variables.userIdentifier],
      });
    },
    onError: (error: any) => {
      console.error("Failed to update challenge progress:", error);
    },
  });
};