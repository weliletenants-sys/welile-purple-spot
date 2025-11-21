import { useState } from "react";
import { useWithdrawalRequests } from "@/hooks/useWithdrawalRequests";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function AdminWithdrawalDialog() {
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const { createRequest } = useWithdrawalRequests();
  const { data: agentEarnings = [] } = useAgentEarnings("all");

  // Sort agents by available balance (earned - withdrawn)
  const sortedAgents = [...agentEarnings].sort(
    (a, b) => (b.earnedCommission - b.withdrawnCommission) - (a.earnedCommission - a.withdrawnCommission)
  );

  const selectedAgentData = agentEarnings.find(
    (agent) => agent.agentPhone === selectedAgent
  );

  const availableBalance = selectedAgentData
    ? selectedAgentData.earnedCommission - selectedAgentData.withdrawnCommission
    : 0;

  const handleSubmit = async () => {
    if (!selectedAgent || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid input",
        description: "Please select an agent and enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    const withdrawalAmount = parseFloat(amount);

    if (withdrawalAmount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: `Agent only has UGX ${availableBalance.toLocaleString()} available.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await createRequest({
        agent_name: selectedAgentData!.agentName,
        agent_phone: selectedAgent,
        amount: withdrawalAmount,
      });

      setOpen(false);
      setSelectedAgent("");
      setAmount("");
    } catch (error) {
      console.error("Error creating withdrawal:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <DollarSign className="h-4 w-4" />
          Create Withdrawal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Agent Withdrawal</DialogTitle>
          <DialogDescription>
            Select an agent and enter the withdrawal amount from their commission balance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agent">Select Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger id="agent">
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {sortedAgents.map((agent) => {
                  const balance = agent.earnedCommission - agent.withdrawnCommission;
                  return (
                    <SelectItem key={agent.agentPhone} value={agent.agentPhone}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{agent.agentName}</span>
                        <span className="text-sm text-muted-foreground">
                          UGX {balance.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedAgentData && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Earned Commission:</span>
                <span className="font-medium">
                  UGX {selectedAgentData.earnedCommission.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Already Withdrawn:</span>
                <span className="font-medium text-destructive">
                  UGX {selectedAgentData.withdrawnCommission.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-semibold">Available Balance:</span>
                <span className="font-bold text-primary">
                  UGX {availableBalance.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (UGX)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1000"
            />
            {selectedAgentData && parseFloat(amount) > availableBalance && (
              <p className="text-sm text-destructive">
                Amount exceeds available balance
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedAgent ||
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > availableBalance
            }
          >
            Create Withdrawal Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
