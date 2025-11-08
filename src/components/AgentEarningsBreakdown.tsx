import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Zap, Gift, Database, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface AgentEarningsBreakdownProps {
  agentName: string;
  period?: string;
}

interface EarningRecord {
  id: string;
  amount: number;
  earning_type: string;
  created_at: string;
  tenant_id?: string;
  isWithdrawn: boolean;
  withdrawalDate?: string;
}

export const AgentEarningsBreakdown = ({ agentName, period = "all" }: AgentEarningsBreakdownProps) => {
  const { data: earnings, isLoading } = useQuery({
    queryKey: ["agentEarningsBreakdown", agentName, period],
    queryFn: async () => {
      let earningsQuery = supabase
        .from("agent_earnings")
        .select("*")
        .eq("agent_name", agentName)
        .neq("earning_type", "withdrawal");

      if (period && period !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case "daily":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "weekly":
            startDate.setDate(now.getDate() - 7);
            break;
          case "monthly":
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        earningsQuery = earningsQuery.gte("created_at", startDate.toISOString());
      }

      const { data: earningsData, error: earningsError } = await earningsQuery.order("created_at", { ascending: false });

      if (earningsError) {
        console.error("Error fetching earnings:", earningsError);
        throw earningsError;
      }

      // Get all withdrawals for this agent
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from("agent_earnings")
        .select("created_at, amount")
        .eq("agent_name", agentName)
        .eq("earning_type", "withdrawal")
        .order("created_at", { ascending: true });

      if (withdrawalsError) {
        console.error("Error fetching withdrawals:", withdrawalsError);
        throw withdrawalsError;
      }

      // Mark earnings as withdrawn based on chronological order
      let totalWithdrawn = 0;
      const withdrawalRecords = withdrawals || [];
      
      const processedEarnings: EarningRecord[] = (earningsData || []).map((earning: any) => {
        const earningAmount = Number(earning.amount);
        const earningDate = new Date(earning.created_at);
        
        // Find withdrawals that happened after this earning
        const applicableWithdrawals = withdrawalRecords.filter(
          (w: any) => new Date(w.created_at) > earningDate
        );
        
        const totalWithdrawalAmount = applicableWithdrawals.reduce(
          (sum: number, w: any) => sum + Number(w.amount), 
          0
        );
        
        // Check if this earning has been withdrawn
        // (Simple logic: if there are withdrawals after this earning was made)
        const isWithdrawn = applicableWithdrawals.length > 0;
        const withdrawalDate = isWithdrawn ? applicableWithdrawals[0].created_at : undefined;
        
        return {
          id: earning.id,
          amount: earningAmount,
          earning_type: earning.earning_type,
          created_at: earning.created_at,
          tenant_id: earning.tenant_id,
          isWithdrawn,
          withdrawalDate,
        };
      });

      return processedEarnings;
    },
  });

  const getEarningIcon = (type: string) => {
    switch (type) {
      case "commission":
        return <DollarSign className="w-4 h-4 text-primary" />;
      case "recording_bonus":
        return <Zap className="w-4 h-4 text-accent" />;
      case "signup_bonus":
        return <Gift className="w-4 h-4 text-green-600" />;
      case "data_entry":
        return <Database className="w-4 h-4 text-blue-600" />;
      case "pipeline_bonus":
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEarningLabel = (type: string) => {
    switch (type) {
      case "commission":
        return "Commission";
      case "recording_bonus":
        return "Recording Bonus";
      case "signup_bonus":
        return "Signup Bonus";
      case "data_entry":
        return "Data Entry";
      case "pipeline_bonus":
        return "Pipeline Bonus";
      default:
        return type;
    }
  };

  const getEarningColor = (type: string) => {
    switch (type) {
      case "commission":
        return "bg-primary/10 text-primary border-primary/20";
      case "recording_bonus":
        return "bg-accent/10 text-accent border-accent/20";
      case "signup_bonus":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "data_entry":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "pipeline_bonus":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (!earnings || earnings.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No earnings recorded yet</p>
        </div>
      </Card>
    );
  }

  const recordingBonuses = earnings.filter(e => e.earning_type === "recording_bonus");
  const totalRecordingBonus = recordingBonuses.reduce((sum, e) => sum + e.amount, 0);
  const withdrawnRecordingBonuses = recordingBonuses.filter(e => e.isWithdrawn);

  return (
    <div className="space-y-4">
      {/* Summary Card for Recording Bonuses */}
      {recordingBonuses.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/20">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Recording Bonuses</p>
                <p className="text-2xl font-bold text-accent">UGX {totalRecordingBonus.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Recordings</p>
              <p className="text-lg font-bold text-foreground">{recordingBonuses.length}</p>
              {withdrawnRecordingBonuses.length > 0 && (
                <Badge variant="outline" className="mt-1 text-xs bg-green-500/10 text-green-700 border-green-500/20">
                  {withdrawnRecordingBonuses.length} Withdrawn
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Earnings List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Earnings Breakdown
        </h3>
        <div className="space-y-3">
          {earnings.map((earning) => (
            <div
              key={earning.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                earning.isWithdrawn
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : "bg-card border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${earning.isWithdrawn ? "bg-green-200 dark:bg-green-900" : "bg-muted"}`}>
                    {getEarningIcon(earning.earning_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getEarningColor(earning.earning_type)}>
                        {getEarningLabel(earning.earning_type)}
                      </Badge>
                      {earning.isWithdrawn && (
                        <Badge className="bg-green-600 text-white border-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          WITHDRAWN
                        </Badge>
                      )}
                      {!earning.isWithdrawn && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          PENDING
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <p>Earned: {format(new Date(earning.created_at), "MMM dd, yyyy 'at' hh:mm a")}</p>
                      {earning.isWithdrawn && earning.withdrawalDate && (
                        <p className="text-green-700 dark:text-green-400 font-medium">
                          Withdrawn: {format(new Date(earning.withdrawalDate), "MMM dd, yyyy 'at' hh:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xl font-bold ${earning.isWithdrawn ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                    UGX {earning.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
