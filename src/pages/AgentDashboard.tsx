import { useEffect } from "react";
import { WelileLogo } from "@/components/WelileLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UserCheck, DollarSign, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactButtons } from "@/components/ContactButtons";

const AgentDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: agents, isLoading } = useAgentEarnings();

  // Auto-refresh data every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [queryClient]);

  const totalCommissions = agents?.reduce((sum, agent) => sum + agent.totalCommission, 0) || 0;
  const totalEarnings = agents?.reduce((sum, agent) => sum + agent.earningsCount, 0) || 0;

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
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                <p className="text-3xl font-bold text-foreground">{agents?.length || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                <UserCheck className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
                <p className="text-3xl font-bold text-foreground">UGX {totalCommissions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-3xl font-bold text-foreground">{totalEarnings.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
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
                      <h3 className="text-lg font-bold text-foreground truncate">{agent.agentName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{agent.agentPhone}</p>
                        <ContactButtons phoneNumber={agent.agentPhone} iconOnly />
                      </div>
                    </div>
                  </div>

                  {/* Commission Stats */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Commission</span>
                      <span className="text-xl font-bold text-primary">
                        UGX {agent.totalCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transactions</span>
                      <span className="text-lg font-semibold text-foreground">
                        {agent.earningsCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg. per Transaction</span>
                      <span className="text-sm font-medium text-accent">
                        UGX {Math.round(agent.totalCommission / agent.earningsCount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Commission Badge */}
                  <div className="pt-3 border-t border-border">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">5% Commission Rate</span>
                    </div>
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
