import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkDeleteTenantsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tenantCount: number;
  isSubmitting: boolean;
}

export const BulkDeleteTenantsDialog = ({
  open,
  onClose,
  onConfirm,
  tenantCount,
  isSubmitting,
}: BulkDeleteTenantsDialogProps) => {
  const handleSubmit = async () => {
    await onConfirm();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete {tenantCount} Tenant{tenantCount !== 1 ? 's' : ''}?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the selected tenant records and all associated data including:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All payment records</li>
                <li>All earnings records</li>
                <li>All status history</li>
                <li>All comments and notes</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium">
              You are about to delete <span className="font-bold text-destructive">{tenantCount}</span> tenant record{tenantCount !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${tenantCount} Tenant${tenantCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
