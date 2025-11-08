import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_identifier: string;
  total_points: number;
  badge_count: number;
  rank: number;
  recent_badges: string[];
  agent_name?: string;
}

export const useLeaderboard = (period: "all" | "monthly" | "weekly" = "all") => {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      // Calculate date range based on period
      const now = new Date();
      let startDate: string | null = null;

      if (period === "monthly") {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = firstDayOfMonth.toISOString();
      } else if (period === "weekly") {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        startDate = firstDayOfWeek.toISOString();
      }

      // Query for achievements with badge points
      let query = supabase
        .from("user_achievements")
        .select(`
          user_identifier,
          badge_id,
          earned_at,
          badges (
            name,
            points,
            icon,
            rarity
          )
        `);

      if (startDate) {
        query = query.gte("earned_at", startDate);
      }

      const { data: achievements, error } = await query;

      if (error) throw error;

      // Aggregate data by user
      const userMap = new Map<string, {
        total_points: number;
        badge_count: number;
        recent_badges: string[];
        agent_name?: string;
      }>();

      achievements?.forEach((achievement: any) => {
        const userId = achievement.user_identifier;
        const points = achievement.badges?.points || 0;
        const badgeName = achievement.badges?.name || "";

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            total_points: 0,
            badge_count: 0,
            recent_badges: [],
            agent_name: userId,
          });
        }

        const userData = userMap.get(userId)!;
        userData.total_points += points;
        userData.badge_count += 1;
        
        if (userData.recent_badges.length < 3) {
          userData.recent_badges.push(badgeName);
        }
      });

      // Convert to array and sort
      const leaderboard: LeaderboardEntry[] = Array.from(userMap.entries())
        .map(([user_identifier, data]) => ({
          user_identifier,
          ...data,
          rank: 0, // Will be set after sorting
        }))
        .sort((a, b) => {
          // Sort by points first, then by badge count
          if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points;
          }
          return b.badge_count - a.badge_count;
        })
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return leaderboard;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useUserRank = (userIdentifier: string, period: "all" | "monthly" | "weekly" = "all") => {
  const { data: leaderboard } = useLeaderboard(period);
  
  const userEntry = leaderboard?.find(entry => entry.user_identifier === userIdentifier);
  
  return {
    rank: userEntry?.rank,
    totalPoints: userEntry?.total_points || 0,
    badgeCount: userEntry?.badge_count || 0,
    totalParticipants: leaderboard?.length || 0,
  };
};
