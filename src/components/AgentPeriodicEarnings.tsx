import { useState } from "react";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentPeriodicEarnings } from "@/hooks/useAgentPeriodicEarnings";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentPeriodicEarningsProps {
  agentName: string;
}

export const AgentPeriodicEarnings = ({ agentName }: AgentPeriodicEarningsProps) => {
  const [expanded, setExpanded] = useState(false);
  const { data: periodicEarnings, isLoading } = useAgentPeriodicEarnings(agentName);

  return (
    <div className="pt-3 border-t border-border">
      <Button
        variant="ghost"
        className="w-full justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          View Periodic Earnings
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : periodicEarnings && periodicEarnings.length > 0 ? (
            periodicEarnings.map((period) => (
              <div
                key={period.period}
                className="p-3 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-border space-y-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{period.period}</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-medium text-muted-foreground">
                      UGX {period.expectedCommission.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Earned:</span>
                    <span className="font-semibold text-primary">
                      UGX {period.earnedCommission.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Withdrawn:</span>
                    <span className="font-semibold text-destructive">
                      UGX {period.withdrawnCommission.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-border">
                    <span className="text-muted-foreground font-medium">Net:</span>
                    <span className="font-bold text-accent">
                      UGX {(period.earnedCommission - period.withdrawnCommission).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No periodic earnings data available
            </p>
          )}
        </div>
      )}
    </div>
  );
};
