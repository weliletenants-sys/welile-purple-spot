import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Star, Award, TrendingUp } from "lucide-react";

interface PointsData {
  totalPoints: number;
  recentActivities: Array<{
    points: number;
    source: string;
    description: string;
    date: string;
  }>;
}

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  icon: any;
}

const AVAILABLE_REWARDS: Reward[] = [
  {
    id: 'bonus_100k',
    name: 'UGX 100,000 Bonus',
    pointsCost: 1000,
    description: 'Cash bonus credited to your account',
    icon: Gift
  },
  {
    id: 'bonus_50k',
    name: 'UGX 50,000 Bonus',
    pointsCost: 500,
    description: 'Cash bonus credited to your account',
    icon: Star
  },
  {
    id: 'certificate',
    name: 'Achievement Certificate',
    pointsCost: 300,
    description: 'Official recognition certificate',
    icon: Award
  },
  {
    id: 'bonus_20k',
    name: 'UGX 20,000 Bonus',
    pointsCost: 200,
    description: 'Cash bonus credited to your account',
    icon: TrendingUp
  }
];

interface AgentRewardsSystemProps {
  agentName: string;
  agentPhone: string;
}

export const AgentRewardsSystem = ({ agentName, agentPhone }: AgentRewardsSystemProps) => {
  const [pointsData, setPointsData] = useState<PointsData>({ totalPoints: 0, recentActivities: [] });
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const fetchPoints = async () => {
    try {
      const { data: points } = await supabase
        .from('agent_points')
        .select('*')
        .eq('agent_name', agentName)
        .order('created_at', { ascending: false });

      const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;
      const recentActivities = (points || []).slice(0, 5).map(p => ({
        points: p.points,
        source: p.points_source,
        description: p.description || '',
        date: new Date(p.created_at).toLocaleDateString()
      }));

      setPointsData({ totalPoints, recentActivities });
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();

    const channel = supabase
      .channel('points-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_points'
        },
        () => {
          fetchPoints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentName]);

  const handleRedeem = async (reward: Reward) => {
    if (pointsData.totalPoints < reward.pointsCost) {
      toast.error('Not enough points for this reward');
      return;
    }

    setRedeeming(reward.id);
    try {
      // Create reward claim
      const { error: claimError } = await supabase
        .from('agent_rewards')
        .insert({
          agent_name: agentName,
          agent_phone: agentPhone,
          reward_name: reward.name,
          points_cost: reward.pointsCost,
          status: 'pending'
        });

      if (claimError) throw claimError;

      // Deduct points
      const { error: pointsError } = await supabase
        .from('agent_points')
        .insert({
          agent_name: agentName,
          agent_phone: agentPhone,
          points: -reward.pointsCost,
          points_source: 'reward_redemption',
          description: `Redeemed: ${reward.name}`
        });

      if (pointsError) throw pointsError;

      toast.success('Reward claimed successfully! Processing...');
      fetchPoints();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center">Loading rewards...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Your Reward Points
          </CardTitle>
          <CardDescription>Earn points for great performance and redeem rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-5xl font-bold text-primary">{pointsData.totalPoints}</p>
            <p className="text-muted-foreground mt-2">Total Points Available</p>
          </div>

          {pointsData.recentActivities.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-sm">Recent Activity</h4>
              {pointsData.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{activity.source.replace(/_/g, ' ').toUpperCase()}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={activity.points > 0 ? "default" : "secondary"}>
                      {activity.points > 0 ? '+' : ''}{activity.points} pts
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Available Rewards
          </CardTitle>
          <CardDescription>Redeem your points for exciting rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {AVAILABLE_REWARDS.map((reward) => {
              const canAfford = pointsData.totalPoints >= reward.pointsCost;
              const Icon = reward.icon;
              return (
                <div
                  key={reward.id}
                  className={`p-4 border rounded-lg ${canAfford ? 'border-primary/30' : 'border-muted'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{reward.name}</h4>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{reward.pointsCost} points</span>
                          <span className="text-sm text-muted-foreground">
                            {canAfford ? 'Available' : 'Need more points'}
                          </span>
                        </div>
                        <Progress
                          value={Math.min((pointsData.totalPoints / reward.pointsCost) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford || redeeming === reward.id}
                        className="w-full mt-3"
                        size="sm"
                      >
                        {redeeming === reward.id ? 'Redeeming...' : 'Redeem'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
