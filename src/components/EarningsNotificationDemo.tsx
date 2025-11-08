import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Rocket, Gift, Zap, DollarSign } from "lucide-react";

interface EarningsNotificationDemoProps {
  agentName: string;
  agentPhone: string;
}

export const EarningsNotificationDemo = ({ agentName, agentPhone }: EarningsNotificationDemoProps) => {
  const testNotification = async (type: string, amount: number) => {
    try {
      // Create a test earning to trigger the notification
      const { error } = await supabase
        .from("agent_earnings")
        .insert({
          agent_name: agentName,
          agent_phone: agentPhone,
          amount: amount,
          earning_type: type,
        });

      if (error) throw error;
      
      toast.info("Test notification triggered! You should see it appear shortly.");
    } catch (error) {
      console.error("Error testing notification:", error);
      toast.error("Failed to trigger test notification");
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Real-Time Earnings Notifications
        </CardTitle>
        <CardDescription>
          Test the instant notification system for different earning types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => testNotification("pipeline_bonus", 100)}
            className="gap-2"
          >
            <Rocket className="w-4 h-4" />
            Pipeline Bonus
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testNotification("signup_bonus", 5000)}
            className="gap-2"
          >
            <Gift className="w-4 h-4" />
            Signup Bonus
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testNotification("recording_bonus", 50)}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Recording Bonus
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testNotification("commission", 2500)}
            className="gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Commission
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Click any button to test the real-time notification for that earning type.
          Notifications appear instantly with confetti effects! 🎉
        </p>
      </CardContent>
    </Card>
  );
};
