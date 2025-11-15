import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, DollarSign, Zap, TrendingUp, Award, Users, Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EarningsBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  earnings: {
    commissions: number;
    recordingBonuses: number;
    pipelineBonuses: number;
    dataEntryRewards: number;
    signupBonuses: number;
    withdrawnCommission: number;
  };
}

interface EarningTypeProps {
  icon: React.ReactNode;
  label: string;
  amount: number;
  withdrawable: boolean;
  description: string;
  color: string;
}

const EarningType = ({ icon, label, amount, withdrawable, description, color }: EarningTypeProps) => (
  <Card className="p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{label}</h4>
            {withdrawable ? (
              <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Withdrawable
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                <XCircle className="h-3 w-3 mr-1" />
                Non-withdrawable
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-foreground">
          UGX {amount.toLocaleString()}
        </p>
      </div>
    </div>
  </Card>
);

export const EarningsBreakdownModal = ({
  open,
  onOpenChange,
  agentName,
  earnings,
}: EarningsBreakdownModalProps) => {
  const totalEarned = 
    earnings.commissions + 
    earnings.recordingBonuses + 
    earnings.pipelineBonuses + 
    earnings.dataEntryRewards + 
    earnings.signupBonuses;

  const withdrawableTotal = earnings.commissions + earnings.recordingBonuses;
  const nonWithdrawableTotal = earnings.pipelineBonuses + earnings.dataEntryRewards + earnings.signupBonuses;
  const availableBalance = withdrawableTotal - earnings.withdrawnCommission;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Earnings Breakdown</DialogTitle>
          <DialogDescription>
            Detailed breakdown of earnings for <span className="font-semibold text-foreground">{agentName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-primary">
              UGX {totalEarned.toLocaleString()}
            </p>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
            <p className="text-xs text-muted-foreground mb-1">Withdrawable</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              UGX {withdrawableTotal.toLocaleString()}
            </p>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <p className="text-xs text-muted-foreground mb-1">Non-withdrawable</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              UGX {nonWithdrawableTotal.toLocaleString()}
            </p>
          </Card>
        </div>

        <Separator className="my-4" />

        {/* Non-withdrawable Earnings Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-base">Non-withdrawable Earnings</h3>
          </div>

          <EarningType
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            label="Pipeline Bonus"
            amount={earnings.pipelineBonuses}
            withdrawable={false}
            description="UGX 50 for each pipeline tenant added"
            color="bg-blue-100 dark:bg-blue-900/30"
          />

          <EarningType
            icon={<Award className="h-5 w-5 text-purple-600" />}
            label="Data Entry Rewards"
            amount={earnings.dataEntryRewards}
            withdrawable={false}
            description="Rewards for data entry tasks"
            color="bg-purple-100 dark:bg-purple-900/30"
          />

          <EarningType
            icon={<Users className="h-5 w-5 text-pink-600" />}
            label="Signup Bonuses"
            amount={earnings.signupBonuses}
            withdrawable={false}
            description="One-time bonuses for new agent signups"
            color="bg-pink-100 dark:bg-pink-900/30"
          />
        </div>

        <Separator className="my-4" />

        {/* Withdrawable Earnings Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-base">Withdrawable Earnings</h3>
          </div>

          <EarningType
            icon={<DollarSign className="h-5 w-5 text-primary" />}
            label="Commission"
            amount={earnings.commissions}
            withdrawable={true}
            description="5% commission from tenant repayments"
            color="bg-primary/10"
          />

          <Card className="p-4 hover:shadow-md transition-shadow border-2 border-amber-500 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-amber-500 dark:bg-amber-600">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">Recording Bonus ⭐</h4>
                    <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Withdrawable
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Bonuses earned from recording payments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
                  UGX {earnings.recordingBonuses.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Separator className="my-4" />

        {/* Final Balance Summary */}
        <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Withdrawable</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                UGX {withdrawableTotal.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Minus className="h-3 w-3" />
                Already Withdrawn
              </span>
              <span className="font-semibold text-destructive">
                UGX {earnings.withdrawnCommission.toLocaleString()}
              </span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center pt-2">
              <span className="font-medium text-base">Available Balance</span>
              <span className="text-2xl font-bold text-accent">
                UGX {availableBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Note:</span> Only commissions and recording bonuses can be withdrawn. 
            Pipeline bonuses, data entry rewards, and signup bonuses are credited to your account but cannot be withdrawn.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
