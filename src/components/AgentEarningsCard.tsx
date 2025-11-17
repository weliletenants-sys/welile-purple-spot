import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Zap, UserCheck, Pencil, TrendingDown, Wallet, Package } from "lucide-react";

interface AgentEarningsCardProps {
  agent: any;
}

export const AgentEarningsCard = ({ agent }: AgentEarningsCardProps) => {
  return (
    <>
      {/* Pipeline Bonuses - Displayed Separately */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-blue-600/20 border-2 border-blue-500 dark:border-blue-600 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-base font-bold text-blue-900 dark:text-blue-100">PIPELINE BONUSES</span>
              <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white text-xs ml-2">
                UGX 50/tenant
              </Badge>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mt-1">✓ Withdrawable</p>
            </div>
          </div>
          <div className="text-center py-2 px-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-blue-800/20">
            <span className="text-3xl font-black text-blue-900 dark:text-blue-100">
              UGX {agent.pipelineBonuses.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="pt-4 border-t border-border">
        <p className="text-sm font-semibold text-foreground mb-3">Earnings Breakdown</p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Commission</p>
              </div>
              <p className="text-xl font-bold text-foreground">UGX {agent.commissions.toLocaleString()}</p>
              <Badge variant="secondary" className="text-xs">Withdrawable</Badge>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-medium text-muted-foreground">Recording</p>
              </div>
              <p className="text-xl font-bold text-foreground">UGX {agent.recordingBonuses.toLocaleString()}</p>
              <Badge variant="secondary" className="text-xs">Withdrawable</Badge>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-muted-foreground">Signup</p>
              </div>
              <p className="text-xl font-bold text-foreground">UGX {agent.signupBonuses.toLocaleString()}</p>
              <Badge variant="outline" className="text-xs">Non-withdrawable</Badge>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-medium text-muted-foreground">Data Entry</p>
              </div>
              <p className="text-xl font-bold text-foreground">UGX {agent.dataEntryRewards.toLocaleString()}</p>
              <Badge variant="outline" className="text-xs">Non-withdrawable</Badge>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <p className="text-xs font-medium text-muted-foreground">Withdrawn</p>
              </div>
              <p className="text-xl font-bold text-destructive">UGX {agent.withdrawnCommission.toLocaleString()}</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-primary to-accent border-2 border-primary">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary-foreground" />
                <p className="text-xs font-medium text-primary-foreground">Available</p>
              </div>
              <p className="text-xl font-bold text-primary-foreground">
                UGX {((agent.commissions || 0) + (agent.recordingBonuses || 0) + (agent.pipelineBonuses || 0) - (agent.withdrawnCommission || 0)).toLocaleString()}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
