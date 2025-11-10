import { useState } from "react";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, UserPlus, ArrowLeft } from "lucide-react";
import { AddAgentDialog } from "@/components/AddAgentDialog";
import { EditAgentDialog } from "@/components/EditAgentDialog";
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
import { useNavigate } from "react-router-dom";

interface Agent {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
}

const AgentManagement = () => {
  const navigate = useNavigate();
  const { data: agents, isLoading, refetch } = useAgents();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [fullAgents, setFullAgents] = useState<Agent[]>([]);

  // Fetch full agent data including IDs
  const fetchFullAgents = async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      });
      return;
    }

    setFullAgents(data || []);
  };

  useState(() => {
    fetchFullAgents();
  });

  const handleDelete = async () => {
    if (!selectedAgent) return;

    const { error } = await supabase
      .from("agents")
      .update({ is_active: false })
      .eq("id", selectedAgent.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate agent",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Agent deactivated successfully",
    });

    setDeleteDialogOpen(false);
    setSelectedAgent(null);
    refetch();
    fetchFullAgents();
  };

  const openDeleteDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Agent Management</h1>
              <p className="text-muted-foreground">
                Manage agent profiles and contact information
              </p>
            </div>
          </div>
          <AddAgentDialog onSuccess={() => {
            refetch();
            fetchFullAgents();
          }} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading agents...</div>
            ) : fullAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No agents found. Add your first agent to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fullAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>
                        {agent.phone || (
                          <span className="text-muted-foreground italic">
                            No phone number
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={agent.is_active ? "default" : "secondary"}
                        >
                          {agent.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <EditAgentDialog
                            agent={agent}
                            onSuccess={() => {
                              refetch();
                              fetchFullAgents();
                            }}
                          />
                          {agent.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(agent)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedAgent?.name}? This
              will remove them from all dropdown lists, but their historical
              data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentManagement;
