import { useEffect, useState } from "react";
import { WelileLogo } from "@/components/WelileLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UserCheck, DollarSign, TrendingUp, TrendingDown, Pencil, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactButtons } from "@/components/ContactButtons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const AgentDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<string>("all");
  const [withdrawingAgent, setWithdrawingAgent] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>("");
  const [editedPhone, setEditedPhone] = useState<string>("");
  const { data: agents, isLoading } = useAgentEarnings(period);

  // Auto-refresh data every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [queryClient]);

  const handleEdit = (agentPhone: string, agentName: string) => {
    setEditingAgent(agentPhone);
    setEditedName(agentName);
    setEditedPhone(agentPhone);
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
    setEditedName("");
    setEditedPhone("");
  };

  const handleSaveEdit = async (oldPhone: string) => {
    if (!editedName.trim()) {
      toast.error("Agent name is required");
      return;
    }

    if (!editedPhone.trim()) {
      toast.error("Agent phone is required");
      return;
    }

    if (!/^[0-9+\s-()]+$/.test(editedPhone)) {
      toast.error("Invalid phone format");
      return;
    }

    try {
      // Update tenants table
      const { error: tenantsError } = await supabase
        .from("tenants")
        .update({
          agent_name: editedName,
          agent_phone: editedPhone,
        })
        .eq("agent_phone", oldPhone);

      if (tenantsError) throw tenantsError;

      // Update agent_earnings table
      const { error: earningsError } = await supabase
        .from("agent_earnings")
        .update({
          agent_name: editedName,
          agent_phone: editedPhone,
        })
        .eq("agent_phone", oldPhone);

      if (earningsError) throw earningsError;

      toast.success("Agent information updated successfully");
      queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Failed to update agent information");
    }
  };

  const handleWithdraw = async (agentPhone: string, agentName: string, amount: number) => {
    if (amount <= 0) {
      toast.error("No commission available to withdraw");
      return;
    }

    setWithdrawingAgent(agentPhone);
    
    try {
      const { error } = await supabase
        .from("agent_earnings")
        .insert({
          agent_phone: agentPhone,
          agent_name: agentName,
          amount: amount,
          earning_type: "withdrawal",
        });

      if (error) throw error;

      toast.success(`Withdrawal of UGX ${amount.toLocaleString()} recorded for ${agentName}`);
      queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
    } catch (error) {
      console.error("Error recording withdrawal:", error);
      toast.error("Failed to record withdrawal");
    } finally {
      setWithdrawingAgent(null);
    }
  };

  const totalEarnedCommissions = agents?.reduce((sum, agent) => sum + agent.earnedCommission, 0) || 0;
  const totalExpectedCommissions = agents?.reduce((sum, agent) => sum + agent.expectedCommission, 0) || 0;
  const totalWithdrawnCommissions = agents?.reduce((sum, agent) => sum + agent.withdrawnCommission, 0) || 0;
  const totalAvailableCommissions = totalEarnedCommissions - totalWithdrawnCommissions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <WelileLogo />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Agent Dashboard</h1>
                <p className="text-sm text-muted-foreground">Commission tracking and earnings</p>
              </div>
            </div>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">Last 7 Days</SelectItem>
              <SelectItem value="monthly">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Expected Commission</p>
                <p className="text-3xl font-bold text-foreground">UGX {totalExpectedCommissions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Earned Commission</p>
                <p className="text-3xl font-bold text-foreground">UGX {totalEarnedCommissions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Withdrawn</p>
                <p className="text-3xl font-bold text-foreground">UGX {totalWithdrawnCommissions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-3xl font-bold text-foreground">UGX {totalAvailableCommissions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                <UserCheck className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        )}

        {/* Agent Cards */}
        {!isLoading && agents && agents.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card
                key={agent.agentPhone}
                className="p-6 bg-gradient-to-br from-card to-primary/5 border-border hover:shadow-[var(--shadow-card)] transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Agent Info */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                      <UserCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingAgent === agent.agentPhone ? (
                        <div className="space-y-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Agent name"
                            className="h-8"
                          />
                          <Input
                            value={editedPhone}
                            onChange={(e) => setEditedPhone(e.target.value)}
                            placeholder="Phone number"
                            className="h-8"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSaveEdit(agent.agentPhone)}
                              className="flex-1"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="flex-1"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-foreground truncate">{agent.agentName}</h3>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(agent.agentPhone, agent.agentName)}
                              className="h-8 w-8"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">{agent.agentPhone}</p>
                            <ContactButtons phoneNumber={agent.agentPhone} iconOnly />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Commission Stats */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expected</span>
                      <span className="text-lg font-bold text-muted-foreground">
                        UGX {agent.expectedCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Earned</span>
                      <span className="text-xl font-bold text-primary">
                        UGX {agent.earnedCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Withdrawn</span>
                      <span className="text-lg font-semibold text-destructive">
                        UGX {agent.withdrawnCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm font-medium text-muted-foreground">Available</span>
                      <span className="text-xl font-bold text-accent">
                        UGX {(agent.earnedCommission - agent.withdrawnCommission).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tenants</span>
                      <span className="text-sm font-semibold text-foreground">
                        {agent.tenantsCount}
                      </span>
                    </div>
                  </div>

                  {/* Withdraw Button */}
                  <div className="pt-3 border-t border-border">
                    <Button
                      className="w-full"
                      onClick={() => handleWithdraw(agent.agentPhone, agent.agentName, agent.earnedCommission - agent.withdrawnCommission)}
                      disabled={withdrawingAgent === agent.agentPhone || (agent.earnedCommission - agent.withdrawnCommission) <= 0}
                    >
                      {withdrawingAgent === agent.agentPhone ? "Processing..." : "Withdraw Commission"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!agents || agents.length === 0) && (
          <Card className="p-12 text-center bg-gradient-to-br from-card to-primary/5 border-border">
            <UserCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Agent Earnings Yet</h3>
            <p className="text-muted-foreground">
              Agent commissions will appear here once tenants make rent payments
            </p>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2024 Welile Tenants Hub. All rights reserved.</p>
          <p className="mt-1">Commission rate: 5% of rent repayments</p>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
