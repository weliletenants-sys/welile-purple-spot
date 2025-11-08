import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ManualAlertCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const handleCheckAlerts = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-pipeline-alerts', {
        body: { time: new Date().toISOString() }
      });

      if (error) throw error;

      toast({
        title: "Alert Check Complete",
        description: data?.message || "Successfully checked for pipeline alerts",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check alerts",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCheckAlerts}
      disabled={isChecking}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
      {isChecking ? "Checking..." : "Check for Alerts"}
    </Button>
  );
};
