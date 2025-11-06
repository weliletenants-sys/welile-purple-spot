import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";
import { useServiceCenterTransfers } from "@/hooks/useServiceCenterTransfers";
import { Loader2, ArrowRight } from "lucide-react";
import { Tenant } from "@/data/tenants";

interface TransferTenantDialogProps {
  tenant: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransferTenantDialog = ({ tenant, open, onOpenChange }: TransferTenantDialogProps) => {
  const serviceCentersQuery = useServiceCenters();
  const serviceCenters = serviceCentersQuery.data || [];
  const { transferTenant, isTransferring } = useServiceCenterTransfers();
  const [toServiceCenter, setToServiceCenter] = useState("");
  const [transferredBy, setTransferredBy] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleTransfer = async () => {
    if (!toServiceCenter || !transferredBy) {
      return;
    }

    await transferTenant({
      tenantId: tenant.id,
      tenantName: tenant.name,
      fromServiceCenter: tenant.serviceCenter || null,
      toServiceCenter,
      transferredBy,
      reason: reason || undefined,
      notes: notes || undefined,
    });

    onOpenChange(false);
    setToServiceCenter("");
    setTransferredBy("");
    setReason("");
    setNotes("");
  };

  const availableCenters = serviceCenters.filter(
    (center) => center.is_active && center.name !== tenant.serviceCenter
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Tenant</DialogTitle>
          <DialogDescription>
            Transfer {tenant.name} to a different service center
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Service Center</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <span className="font-medium">{tenant.serviceCenter || "Not assigned"}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-service-center">New Service Center *</Label>
            <Select value={toServiceCenter} onValueChange={setToServiceCenter}>
              <SelectTrigger id="to-service-center">
                <SelectValue placeholder="Select service center" />
              </SelectTrigger>
              <SelectContent>
                {serviceCentersQuery.isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : availableCenters.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No other service centers available
                  </div>
                ) : (
                  availableCenters.map((center) => (
                    <SelectItem key={center.id} value={center.name}>
                      {center.name} - {center.district}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transferred-by">Transferred By *</Label>
            <Input
              id="transferred-by"
              value={transferredBy}
              onChange={(e) => setTransferredBy(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Closer to tenant location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTransferring}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!toServiceCenter || !transferredBy || isTransferring}
          >
            {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transfer Tenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
