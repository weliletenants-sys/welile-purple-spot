import { useState, useEffect } from "react";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { BackToHome } from "@/components/BackToHome";
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
import { Pencil, Trash2, UserPlus, ArrowLeft, Lock, Search, Download, FileSpreadsheet } from "lucide-react";
import { AddAgentDialog } from "@/components/AddAgentDialog";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import * as XLSX from "xlsx";

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessName, setAccessName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Check if user is already authorized
  useEffect(() => {
    const authorized = sessionStorage.getItem("agentManagementAccess");
    if (authorized) {
      setIsAuthorized(true);
    }
  }, []);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const authorizedNames = ["BENJAMIN", "MERCY", "GLORIA MUTUNGI", "MARTIN", "SHARIMA", "ADMIN"];
    const inputName = accessName.trim().toUpperCase();
    
    if (authorizedNames.includes(inputName)) {
      sessionStorage.setItem("agentManagementAccess", "true");
      setIsAuthorized(true);
      toast({
        title: "Access Granted",
        description: "Welcome to Agent Management",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid access credentials",
        variant: "destructive",
      });
    }
  };

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

  // Filter agents based on search and status
  const filteredAgents = fullAgents.filter((agent) => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.phone && agent.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && agent.is_active) ||
      (statusFilter === "inactive" && !agent.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredAgents.map((agent) => ({
      Name: agent.name,
      "Phone Number": agent.phone || "N/A",
      Status: agent.is_active ? "Active" : "Inactive",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents");
    
    const fileName = `agents_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredAgents.length} agents to Excel`,
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const exportData = filteredAgents.map((agent) => ({
      Name: agent.name,
      "Phone Number": agent.phone || "N/A",
      Status: agent.is_active ? "Active" : "Inactive",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `agents_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredAgents.length} agents to CSV`,
    });
  };

  // Show access control screen if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              Agent Management Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-name">Enter Your Name</Label>
                <Input
                  id="access-name"
                  placeholder="Enter authorized name"
                  value={accessName}
                  onChange={(e) => setAccessName(e.target.value)}
                  className="text-center"
                />
              </div>
              <Button type="submit" className="w-full">
                Access Agent Management
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-6">
      <BackToHome />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with prominent Add Agent button */}
        <div className="flex flex-col gap-4">
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
                <h1 className="text-4xl font-bold">Agent Management</h1>
                <p className="text-muted-foreground text-lg">
                  Manage agent profiles and contact information
                </p>
              </div>
            </div>
          </div>

          {/* Prominent Add Agent Section */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 shadow-lg border-2 border-primary/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                  <UserPlus className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary-foreground">Add New Agent</h2>
                  <p className="text-primary-foreground/90">Create new agent profiles quickly and easily</p>
                </div>
              </div>
              <AddAgentDialog onSuccess={() => {
                refetch();
                fetchFullAgents();
              }} />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle>All Agents</CardTitle>
              
              {/* Search and Filter Section */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportToExcel}
                    title="Export to Excel"
                    disabled={filteredAgents.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportToCSV}
                    title="Export to CSV"
                    disabled={filteredAgents.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredAgents.length} of {fullAgents.length} agents
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading agents...</div>
            ) : fullAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No agents found. Add your first agent to get started.
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No agents match your search criteria.
              </div>
            ) : (
              <ScrollArea className="h-[600px] w-full rounded-md">
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
                    {filteredAgents.map((agent) => (
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
              </ScrollArea>
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
