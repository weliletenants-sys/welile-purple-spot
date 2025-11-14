import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Undo2, Clock, AlertCircle, Loader2, Download } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";

interface EditBatch {
  edit_batch_id: string;
  edited_at: string;
  agent_count: number;
  edits: Array<{
    id: string;
    agent_id: string;
    old_name: string;
    old_phone: string;
    new_name: string;
    new_phone: string;
  }>;
}

const UNDO_WINDOW_HOURS = 24;

export const BulkEditUndoHistory = () => {
  const [editBatches, setEditBatches] = useState<EditBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoingBatchId, setUndoingBatchId] = useState<string | null>(null);
  const [confirmBatchId, setConfirmBatchId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const fetchEditHistory = async () => {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - UNDO_WINDOW_HOURS);

      const { data, error } = await supabase
        .from("agent_edit_history" as any)
        .select("*")
        .is("undone_at", null)
        .gte("edited_at", cutoffTime.toISOString())
        .order("edited_at", { ascending: false });

      if (error) throw error;

      // Group by batch ID
      const batches = (data as any[]).reduce((acc: any, edit: any) => {
        if (!acc[edit.edit_batch_id]) {
          acc[edit.edit_batch_id] = {
            edit_batch_id: edit.edit_batch_id,
            edited_at: edit.edited_at,
            agent_count: 0,
            edits: [],
          };
        }
        acc[edit.edit_batch_id].agent_count++;
        acc[edit.edit_batch_id].edits.push(edit);
        return acc;
      }, {} as Record<string, EditBatch>);

      setEditBatches(Object.values(batches));
    } catch (error) {
      console.error("Error fetching edit history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditHistory();

    // Subscribe to changes
    const channel = supabase
      .channel("agent-edit-history-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_edit_history",
        },
        () => {
          fetchEditHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUndo = async (batch: EditBatch) => {
    setUndoingBatchId(batch.edit_batch_id);
    setConfirmBatchId(null);

    try {
      // Revert changes for each edit in the batch
      for (const edit of batch.edits) {
        // Revert agents table
        const { error: agentError } = await supabase
          .from("agents")
          .update({
            name: edit.old_name,
            phone: edit.old_phone,
          })
          .eq("id", edit.agent_id);

        if (agentError) throw agentError;

        // Revert tenants table
        const { error: tenantsError } = await supabase
          .from("tenants")
          .update({
            agent_name: edit.old_name,
            agent_phone: edit.old_phone,
          })
          .eq("agent_phone", edit.new_phone);

        if (tenantsError) throw tenantsError;

        // Revert agent_earnings table
        const { error: earningsError } = await supabase
          .from("agent_earnings")
          .update({
            agent_name: edit.old_name,
            agent_phone: edit.old_phone,
          })
          .eq("agent_phone", edit.new_phone);

        if (earningsError) throw earningsError;

        // Revert agent_activity_log table
        const { error: activityError } = await supabase
          .from("agent_activity_log")
          .update({
            agent_name: edit.old_name,
            agent_phone: edit.old_phone,
          })
          .eq("agent_phone", edit.new_phone);

        if (activityError) throw activityError;
      }

      // Mark all edits in this batch as undone
      const { error: markError } = await supabase
        .from("agent_edit_history" as any)
        .update({ undone_at: new Date().toISOString() } as any)
        .eq("edit_batch_id", batch.edit_batch_id);

      if (markError) throw markError;

      toast({
        title: "Changes Reverted",
        description: `Successfully undid changes for ${batch.agent_count} agent${
          batch.agent_count > 1 ? "s" : ""
        }`,
      });

      fetchEditHistory();
    } catch (error) {
      console.error("Undo error:", error);
      toast({
        title: "Error",
        description: "Failed to undo changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUndoingBatchId(null);
    }
  };

  const isExpired = (editedAt: string) => {
    const editTime = new Date(editedAt);
    const expiryTime = new Date(editTime.getTime() + UNDO_WINDOW_HOURS * 60 * 60 * 1000);
    return new Date() > expiryTime;
  };

  const getTimeRemaining = (editedAt: string) => {
    const editTime = new Date(editedAt);
    const expiryTime = new Date(editTime.getTime() + UNDO_WINDOW_HOURS * 60 * 60 * 1000);
    const now = new Date();
    const hoursRemaining = Math.max(0, (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    return Math.ceil(hoursRemaining);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all edit history (including undone records for complete audit trail)
      const { data: allHistory, error } = await supabase
        .from("agent_edit_history" as any)
        .select("*")
        .order("edited_at", { ascending: false });

      if (error) throw error;

      // Prepare data for export
      const exportData = (allHistory as any[]).map((edit: any) => ({
        "Batch ID": edit.edit_batch_id,
        "Edit Date": format(new Date(edit.edited_at), "yyyy-MM-dd HH:mm:ss"),
        "Agent Name (Old)": edit.old_name,
        "Agent Phone (Old)": edit.old_phone,
        "Agent Name (New)": edit.new_name,
        "Agent Phone (New)": edit.new_phone,
        "Edited By": edit.edited_by || "N/A",
        "Status": edit.undone_at ? "Undone" : "Active",
        "Undone Date": edit.undone_at ? format(new Date(edit.undone_at), "yyyy-MM-dd HH:mm:ss") : "N/A",
        "Hours Until Expiry": edit.undone_at ? "N/A" : getTimeRemaining(edit.edited_at).toString() + "h",
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      ws["!cols"] = [
        { wch: 38 }, // Batch ID
        { wch: 20 }, // Edit Date
        { wch: 25 }, // Agent Name (Old)
        { wch: 18 }, // Agent Phone (Old)
        { wch: 25 }, // Agent Name (New)
        { wch: 18 }, // Agent Phone (New)
        { wch: 15 }, // Edited By
        { wch: 10 }, // Status
        { wch: 20 }, // Undone Date
        { wch: 18 }, // Hours Until Expiry
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Edit History");

      // Generate filename with current date
      const date = new Date().toISOString().split("T")[0];
      const filename = `Agent_Edit_History_${date}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Successful",
        description: `Edit history exported to ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export edit history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (editBatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Edits
          </CardTitle>
          <CardDescription>
            Undo bulk edits within {UNDO_WINDOW_HOURS} hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent bulk edits to undo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Edits
              </CardTitle>
              <CardDescription>
                Undo bulk edits within {UNDO_WINDOW_HOURS} hours of making them
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export History
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {editBatches.map((batch) => {
                const expired = isExpired(batch.edited_at);
                const hoursRemaining = getTimeRemaining(batch.edited_at);

                return (
                  <div
                    key={batch.edit_batch_id}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Edited {batch.agent_count} agent{batch.agent_count > 1 ? "s" : ""}
                          </span>
                          {expired ? (
                            <Badge variant="secondary">Expired</Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {hoursRemaining}h remaining
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(batch.edited_at), { addSuffix: true })}
                        </div>
                        <div className="space-y-1">
                          {batch.edits.slice(0, 3).map((edit) => (
                            <div key={edit.id} className="text-xs text-muted-foreground">
                              {edit.old_name} → {edit.new_name}
                            </div>
                          ))}
                          {batch.edits.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              and {batch.edits.length - 3} more...
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmBatchId(batch.edit_batch_id)}
                        disabled={expired || undoingBatchId === batch.edit_batch_id}
                        className="gap-2"
                      >
                        {undoingBatchId === batch.edit_batch_id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Undoing...
                          </>
                        ) : (
                          <>
                            <Undo2 className="h-4 w-4" />
                            Undo
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmBatchId} onOpenChange={() => setConfirmBatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo Bulk Edit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert all changes made in this bulk edit operation. All affected agents,
              tenants, earnings, and activity logs will be restored to their previous values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const batch = editBatches.find((b) => b.edit_batch_id === confirmBatchId);
                if (batch) handleUndo(batch);
              }}
            >
              Undo Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
