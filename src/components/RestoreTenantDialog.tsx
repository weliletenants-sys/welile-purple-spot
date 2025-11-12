import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, RotateCcw } from "lucide-react";
import { z } from "zod";

const restoreSchema = z.object({
  reason: z.string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be less than 500 characters"),
});

interface RestoreTenantDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  tenantName: string;
  isSubmitting: boolean;
}

export function RestoreTenantDialog({
  open,
  onClose,
  onConfirm,
  tenantName,
  isSubmitting,
}: RestoreTenantDialogProps) {
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ reason?: string }>({});

  const handleSubmit = () => {
    try {
      const validated = restoreSchema.parse({ reason });
      setErrors({});
      onConfirm(validated.reason);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { reason?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as "reason"] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleClose = () => {
    setReason("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <RotateCcw className="h-5 w-5" />
            Restore Tenant to Pending
          </DialogTitle>
          <DialogDescription>
            Restore <strong>{tenantName}</strong> back to pending status. Please provide a reason for restoration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Restoration Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this tenant is being restored to pending status..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className={errors.reason ? "border-destructive" : ""}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {reason.length}/500 characters
              </p>
              {errors.reason && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.reason}
                </p>
              )}
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-primary mb-1">Note</p>
              <p className="text-muted-foreground">
                This will move the tenant back to pending status. The rejection details will be preserved in the history.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? "Restoring..." : "Restore to Pending"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
