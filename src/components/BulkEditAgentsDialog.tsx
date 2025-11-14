import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface Agent {
  id: string;
  name: string;
  phone: string;
}

interface AgentEdit {
  id: string;
  originalName: string;
  originalPhone: string;
  newName: string;
  newPhone: string;
}

interface ValidationError {
  agentId: string;
  agentName: string;
  errors: string[];
}

interface BulkEditAgentsDialogProps {
  agents: Agent[];
  onSuccess?: () => void;
}

export const BulkEditAgentsDialog = ({ agents, onSuccess }: BulkEditAgentsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, AgentEdit>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleToggleAgent = (agentId: string) => {
    setSelectedAgents((prev) => {
      const newSelected = prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId];
      
      // Initialize edits for newly selected agents
      if (!prev.includes(agentId)) {
        const agent = agents.find((a) => a.id === agentId);
        if (agent) {
          setEdits((prevEdits) => ({
            ...prevEdits,
            [agentId]: {
              id: agentId,
              originalName: agent.name,
              originalPhone: agent.phone,
              newName: agent.name,
              newPhone: agent.phone,
            },
          }));
        }
      }
      
      return newSelected;
    });
  };

  const handleEditChange = (agentId: string, field: "newName" | "newPhone", value: string) => {
    setEdits((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [field]: value,
      },
    }));
    // Clear validation errors when user makes changes
    setValidationErrors([]);
  };

  const validateEdits = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    const nameMap = new Map<string, string[]>();
    const phoneMap = new Map<string, string[]>();

    // Check each edit
    Object.values(edits).forEach((edit) => {
      const agentErrors: string[] = [];

      // Required field validation
      if (!edit.newName.trim()) {
        agentErrors.push("Name is required");
      }
      if (!edit.newPhone.trim()) {
        agentErrors.push("Phone is required");
      }

      // Phone format validation
      if (edit.newPhone.trim() && !/^[0-9+\s\-()]+$/.test(edit.newPhone)) {
        agentErrors.push("Invalid phone format");
      }

      // Track duplicates within the batch
      if (edit.newName.trim()) {
        const upperName = edit.newName.toUpperCase();
        if (!nameMap.has(upperName)) {
          nameMap.set(upperName, []);
        }
        nameMap.get(upperName)!.push(edit.id);
      }

      if (edit.newPhone.trim()) {
        if (!phoneMap.has(edit.newPhone)) {
          phoneMap.set(edit.newPhone, []);
        }
        phoneMap.get(edit.newPhone)!.push(edit.id);
      }

      if (agentErrors.length > 0) {
        errors.push({
          agentId: edit.id,
          agentName: edit.originalName,
          errors: agentErrors,
        });
      }
    });

    // Check for duplicate names within batch
    nameMap.forEach((agentIds, name) => {
      if (agentIds.length > 1) {
        agentIds.forEach((agentId) => {
          const edit = edits[agentId];
          const existingError = errors.find((e) => e.agentId === agentId);
          const error = `Duplicate name "${name}" in batch`;
          
          if (existingError) {
            if (!existingError.errors.includes(error)) {
              existingError.errors.push(error);
            }
          } else {
            errors.push({
              agentId,
              agentName: edit.originalName,
              errors: [error],
            });
          }
        });
      }
    });

    // Check for duplicate phones within batch
    phoneMap.forEach((agentIds, phone) => {
      if (agentIds.length > 1) {
        agentIds.forEach((agentId) => {
          const edit = edits[agentId];
          const existingError = errors.find((e) => e.agentId === agentId);
          const error = `Duplicate phone "${phone}" in batch`;
          
          if (existingError) {
            if (!existingError.errors.includes(error)) {
              existingError.errors.push(error);
            }
          } else {
            errors.push({
              agentId,
              agentName: edit.originalName,
              errors: [error],
            });
          }
        });
      }
    });

    return errors;
  };

  const checkExistingConflicts = async (editsToCheck: AgentEdit[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];

    // Check for conflicts with existing agents not in the edit batch
    for (const edit of editsToCheck) {
      const nameChanged = edit.newName.toUpperCase() !== edit.originalName.toUpperCase();
      const phoneChanged = edit.newPhone !== edit.originalPhone;

      if (nameChanged) {
        const { data: existingByName } = await supabase
          .from("agents")
          .select("id, name")
          .eq("name", edit.newName.toUpperCase())
          .neq("id", edit.id)
          .maybeSingle();

        if (existingByName) {
          const existingError = errors.find((e) => e.agentId === edit.id);
          const error = `Agent with name "${edit.newName}" already exists`;
          
          if (existingError) {
            existingError.errors.push(error);
          } else {
            errors.push({
              agentId: edit.id,
              agentName: edit.originalName,
              errors: [error],
            });
          }
        }
      }

      if (phoneChanged) {
        const { data: existingByPhone } = await supabase
          .from("agents")
          .select("id, name, phone")
          .eq("phone", edit.newPhone)
          .neq("id", edit.id)
          .maybeSingle();

        if (existingByPhone) {
          const existingError = errors.find((e) => e.agentId === edit.id);
          const error = `Agent with phone "${edit.newPhone}" already exists (${existingByPhone.name})`;
          
          if (existingError) {
            existingError.errors.push(error);
          } else {
            errors.push({
              agentId: edit.id,
              agentName: edit.originalName,
              errors: [error],
            });
          }
        }
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    setValidationErrors([]);

    const editsToApply = Object.values(edits).filter((edit) =>
      selectedAgents.includes(edit.id) &&
      (edit.newName !== edit.originalName || edit.newPhone !== edit.originalPhone)
    );

    if (editsToApply.length === 0) {
      toast({
        title: "No Changes",
        description: "No agents were modified",
        variant: "default",
      });
      return;
    }

    // Validate all edits
    const localErrors = validateEdits();
    if (localErrors.length > 0) {
      setValidationErrors(localErrors);
      return;
    }

    setIsSubmitting(true);
    setProgress(0);

    try {
      // Check for conflicts with existing agents
      const conflictErrors = await checkExistingConflicts(editsToApply);
      if (conflictErrors.length > 0) {
        setValidationErrors(conflictErrors);
        setIsSubmitting(false);
        return;
      }

      let completed = 0;
      const total = editsToApply.length;
      
      // Generate a unique batch ID for this edit operation
      const editBatchId = crypto.randomUUID();

      // Apply updates one by one with progress tracking
      for (const edit of editsToApply) {
        // Save edit history first
        const { error: historyError } = await supabase
          .from("agent_edit_history")
          .insert({
            edit_batch_id: editBatchId,
            agent_id: edit.id,
            old_name: edit.originalName,
            old_phone: edit.originalPhone,
            new_name: edit.newName.toUpperCase(),
            new_phone: edit.newPhone,
            edited_by: "Admin", // You can replace this with actual user info
          });

        if (historyError) throw historyError;

        // Update agents table
        const { error: agentError } = await supabase
          .from("agents")
          .update({
            name: edit.newName.toUpperCase(),
            phone: edit.newPhone,
          })
          .eq("id", edit.id);

        if (agentError) throw agentError;

        // Update tenants table
        const { error: tenantsError } = await supabase
          .from("tenants")
          .update({
            agent_name: edit.newName.toUpperCase(),
            agent_phone: edit.newPhone,
          })
          .eq("agent_phone", edit.originalPhone);

        if (tenantsError) throw tenantsError;

        // Update agent_earnings table
        const { error: earningsError } = await supabase
          .from("agent_earnings")
          .update({
            agent_name: edit.newName.toUpperCase(),
            agent_phone: edit.newPhone,
          })
          .eq("agent_phone", edit.originalPhone);

        if (earningsError) throw earningsError;

        // Update agent_activity_log table
        const { error: activityError } = await supabase
          .from("agent_activity_log")
          .update({
            agent_name: edit.newName.toUpperCase(),
            agent_phone: edit.newPhone,
          })
          .eq("agent_phone", edit.originalPhone);

        if (activityError) throw activityError;

        completed++;
        setProgress((completed / total) * 100);
      }

      toast({
        title: "Success",
        description: `Successfully updated ${editsToApply.length} agent${editsToApply.length > 1 ? "s" : ""}. Changes can be undone within 24 hours.`,
      });

      setOpen(false);
      setSelectedAgents([]);
      setEdits({});
      onSuccess?.();
    } catch (error) {
      console.error("Bulk edit error:", error);
      toast({
        title: "Error",
        description: "Failed to update agents. Some changes may not have been saved.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  const selectedCount = selectedAgents.length;
  const hasChanges = Object.values(edits).some(
    (edit) =>
      selectedAgents.includes(edit.id) &&
      (edit.newName !== edit.originalName || edit.newPhone !== edit.originalPhone)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Bulk Edit Agents
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Agents</DialogTitle>
          <DialogDescription>
            Select agents and update their information. Changes are validated and applied to all related records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedCount} selected</Badge>
              {hasChanges && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Has changes
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAgents(agents.map((a) => a.id))}
                disabled={selectedCount === agents.length}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAgents([]);
                  setEdits({});
                }}
                disabled={selectedCount === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">
                  Found {validationErrors.length} validation error{validationErrors.length > 1 ? "s" : ""}:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error) => (
                    <li key={error.agentId}>
                      <span className="font-medium">{error.agentName}:</span>{" "}
                      {error.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {isSubmitting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Updating agents...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Agents List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {agents.map((agent) => {
                const isSelected = selectedAgents.includes(agent.id);
                const edit = edits[agent.id];

                return (
                  <div
                    key={agent.id}
                    className={`p-4 border rounded-lg space-y-3 transition-colors ${
                      isSelected ? "bg-primary/5 border-primary" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleAgent(agent.id)}
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.phone}</p>
                      </div>
                    </div>

                    {isSelected && edit && (
                      <div className="grid grid-cols-2 gap-3 pl-7">
                        <div className="space-y-1">
                          <Label htmlFor={`name-${agent.id}`} className="text-xs">
                            New Name
                          </Label>
                          <Input
                            id={`name-${agent.id}`}
                            value={edit.newName}
                            onChange={(e) => handleEditChange(agent.id, "newName", e.target.value)}
                            placeholder="Agent name"
                            disabled={isSubmitting}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`phone-${agent.id}`} className="text-xs">
                            New Phone
                          </Label>
                          <Input
                            id={`phone-${agent.id}`}
                            value={edit.newPhone}
                            onChange={(e) => handleEditChange(agent.id, "newPhone", e.target.value)}
                            placeholder="Phone number"
                            disabled={isSubmitting}
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedAgents([]);
              setEdits({});
              setValidationErrors([]);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              `Update ${selectedCount} Agent${selectedCount !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
