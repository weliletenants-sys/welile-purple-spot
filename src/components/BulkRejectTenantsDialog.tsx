import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, XCircle } from "lucide-react";
import { z } from "zod";

const rejectionSchema = z.object({
  reason: z.string().min(1, "Please select a rejection reason"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

interface BulkRejectTenantsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => void;
  tenantCount: number;
  isSubmitting: boolean;
}

const REJECTION_REASONS = [
  { value: "incomplete_info", label: "Incomplete Information" },
  { value: "failed_verification", label: "Failed Verification" },
  { value: "duplicate_entry", label: "Duplicate Entry" },
  { value: "invalid_guarantor", label: "Invalid Guarantor Details" },
  { value: "insufficient_income", label: "Insufficient Income Proof" },
  { value: "poor_credit", label: "Poor Credit History" },
  { value: "other", label: "Other (Specify in notes)" },
];

export function BulkRejectTenantsDialog({
  open,
  onClose,
  onConfirm,
  tenantCount,
  isSubmitting,
}: BulkRejectTenantsDialogProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; notes?: string }>({});

  const handleSubmit = () => {
    try {
      const validated = rejectionSchema.parse({ reason, notes });
      setErrors({});
      onConfirm(validated.reason, validated.notes || "");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { reason?: string; notes?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as "reason" | "notes"] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleClose = () => {
    setReason("");
    setNotes("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Reject {tenantCount} Tenant(s)
          </DialogTitle>
          <DialogDescription>
            This action will mark the selected tenant(s) as rejected. Please provide a reason for rejection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" className={errors.reason ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.reason}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Additional Notes
              {reason === "other" && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder="Provide additional details about the rejection..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={500}
              className={errors.notes ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/500 characters
            </p>
            {errors.notes && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.notes}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-destructive mb-1">Warning</p>
              <p className="text-muted-foreground">
                Rejecting {tenantCount} tenant(s) will mark them as rejected in the system. This action can be reversed by changing their status later.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Rejecting..." : `Reject ${tenantCount} Tenant(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
