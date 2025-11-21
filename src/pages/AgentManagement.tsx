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
import { Pencil, Trash2, UserPlus, ArrowLeft, Lock, Search, Download, FileSpreadsheet, TrendingUp, DollarSign, Target, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
import { Users, UserCheck, UserPlus2, Activity, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Agent {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  last_action_at?: string;
  last_action_type?: string;
  last_login_at?: string;
}

interface AgentPerformance {
  totalTenants: number;
  activeTenants: number;
  pipelineTenants: number;
  totalEarnings: number;
  conversionRate: number;
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
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [agentPerformance, setAgentPerformance] = useState<Record<string, AgentPerformance>>({});
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
      .order("name", { ascending: true });

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

  useEffect(() => {
    fetchFullAgents();
  }, []);

  // Fetch performance metrics for all agents
  const fetchAgentPerformance = async () => {
    try {
      // Fetch all tenants with agent_id
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("agent_id, status");

      if (tenantsError) throw tenantsError;

      // Fetch all earnings with agent_phone for matching
      const { data: earnings, error: earningsError } = await supabase
        .from("agent_earnings")
        .select("agent_phone, amount");

      if (earningsError) throw earningsError;

      // Calculate performance metrics for each agent
      const performance: Record<string, AgentPerformance> = {};

      fullAgents.forEach((agent) => {
        // Match tenants by agent_id (proper FK relationship)
        const agentTenants = tenants?.filter(t => t.agent_id === agent.id) || [];
        const activeTenants = agentTenants.filter(t => t.status === "active").length;
        const pipelineTenants = agentTenants.filter(t => t.status === "pipeline").length;
        const totalTenants = agentTenants.length;
        
        // Match earnings by agent_phone
        const agentEarnings = earnings?.filter(e => e.agent_phone === agent.phone) || [];
        const totalEarnings = agentEarnings.reduce((sum, e) => sum + (e.amount || 0), 0);
        const conversionRate = totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0;

        performance[agent.id] = {
          totalTenants,
          activeTenants,
          pipelineTenants,
          totalEarnings,
          conversionRate,
        };
      });

      setAgentPerformance(performance);
    } catch (error) {
      console.error("Error fetching agent performance:", error);
    }
  };

  useEffect(() => {
    if (fullAgents.length > 0) {
      fetchAgentPerformance();
    }
  }, [fullAgents]);

  // Subscribe to realtime changes
  useEffect(() => {
    const agentsChannel = supabase
      .channel('agents-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents'
        },
        () => {
          fetchFullAgents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants'
        },
        () => {
          if (fullAgents.length > 0) {
            fetchAgentPerformance();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_earnings'
        },
        () => {
          if (fullAgents.length > 0) {
            fetchAgentPerformance();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentsChannel);
    };
  }, [fullAgents]);

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

  // Calculate statistics
  const totalAgents = fullAgents.length;
  const activeAgents = fullAgents.filter(agent => agent.is_active).length;
  const recentlyAddedAgents = fullAgents.filter(agent => {
    const agentDate = new Date(agent.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return agentDate >= thirtyDaysAgo;
  }).length;

  // Get recently active agents (sorted by last action)
  const recentlyActiveAgents = [...fullAgents]
    .filter(agent => {
      if (!agent.last_action_at) return false;
      if (activityTypeFilter === "all") return true;
      return agent.last_action_type === activityTypeFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.last_action_at!).getTime();
      const dateB = new Date(b.last_action_at!).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  // Get unique activity types for filter
  const activityTypes = Array.from(
    new Set(
      fullAgents
        .filter(agent => agent.last_action_type)
        .map(agent => agent.last_action_type!)
    )
  ).sort();

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
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
  }).sort((a, b) => {
    const perfA = agentPerformance[a.id] || {
      totalTenants: 0,
      activeTenants: 0,
      pipelineTenants: 0,
      totalEarnings: 0,
      conversionRate: 0,
    };
    const perfB = agentPerformance[b.id] || {
      totalTenants: 0,
      activeTenants: 0,
      pipelineTenants: 0,
      totalEarnings: 0,
      conversionRate: 0,
    };

    let compareValue = 0;

    switch (sortColumn) {
      case "name":
        compareValue = a.name.localeCompare(b.name);
        break;
      case "phone":
        compareValue = (a.phone || "").localeCompare(b.phone || "");
        break;
      case "status":
        compareValue = (a.is_active === b.is_active) ? 0 : a.is_active ? -1 : 1;
        break;
      case "totalTenants":
        compareValue = perfA.totalTenants - perfB.totalTenants;
        break;
      case "activeTenants":
        compareValue = perfA.activeTenants - perfB.activeTenants;
        break;
      case "pipelineTenants":
        compareValue = perfA.pipelineTenants - perfB.pipelineTenants;
        break;
      case "earnings":
        compareValue = perfA.totalEarnings - perfB.totalEarnings;
        break;
      case "conversionRate":
        compareValue = perfA.conversionRate - perfB.conversionRate;
        break;
      default:
        compareValue = 0;
    }

    return sortDirection === "asc" ? compareValue : -compareValue;
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                All registered agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgents}</div>
              <p className="text-xs text-muted-foreground">
                Currently active agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
              <UserPlus2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentlyAddedAgents}</div>
              <p className="text-xs text-muted-foreground">
                Added in last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={activityTypeFilter}
                  onValueChange={setActivityTypeFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {activityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => navigate("/agent-activity-log")}
                >
                  View Full Log
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recentlyActiveAgents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {activityTypeFilter === "all" 
                  ? "No recent activity" 
                  : `No recent ${activityTypeFilter.replace(/_/g, ' ')} activity`}
              </p>
            ) : (
              <div className="space-y-4">
                {recentlyActiveAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.last_action_type && (
                            <span className="capitalize">{agent.last_action_type.replace(/_/g, ' ')}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {agent.last_action_at && formatDistanceToNow(new Date(agent.last_action_at), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("name")}
                            className="flex items-center hover:bg-transparent p-0 h-auto font-medium"
                          >
                            Name
                            {getSortIcon("name")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("phone")}
                            className="flex items-center hover:bg-transparent p-0 h-auto font-medium"
                          >
                            Phone
                            {getSortIcon("phone")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("status")}
                            className="flex items-center hover:bg-transparent p-0 h-auto font-medium"
                          >
                            Status
                            {getSortIcon("status")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("totalTenants")}
                                className="flex items-center gap-1 ml-auto hover:bg-transparent p-0 h-auto font-medium"
                              >
                                <Users className="h-4 w-4" />
                                <span>Total</span>
                                {getSortIcon("totalTenants")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Total Tenants - Click to sort</TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("activeTenants")}
                                className="flex items-center gap-1 ml-auto hover:bg-transparent p-0 h-auto font-medium"
                              >
                                <UserCheck className="h-4 w-4" />
                                <span>Active</span>
                                {getSortIcon("activeTenants")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Active Tenants - Click to sort</TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("pipelineTenants")}
                                className="flex items-center gap-1 ml-auto hover:bg-transparent p-0 h-auto font-medium"
                              >
                                <Target className="h-4 w-4" />
                                <span>Pipeline</span>
                                {getSortIcon("pipelineTenants")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pipeline Tenants - Click to sort</TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("earnings")}
                                className="flex items-center gap-1 ml-auto hover:bg-transparent p-0 h-auto font-medium"
                              >
                                <DollarSign className="h-4 w-4" />
                                <span>Earnings</span>
                                {getSortIcon("earnings")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Total Earnings (UGX) - Click to sort</TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("conversionRate")}
                                className="flex items-center gap-1 ml-auto hover:bg-transparent p-0 h-auto font-medium"
                              >
                                <TrendingUp className="h-4 w-4" />
                                <span>Conv. Rate</span>
                                {getSortIcon("conversionRate")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Conversion Rate (Active/Total) - Click to sort</TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgents.map((agent) => {
                        const performance = agentPerformance[agent.id] || {
                          totalTenants: 0,
                          activeTenants: 0,
                          pipelineTenants: 0,
                          totalEarnings: 0,
                          conversionRate: 0,
                        };

                        return (
                          <TableRow key={agent.id}>
                            <TableCell className="font-medium">{agent.name}</TableCell>
                            <TableCell>
                              {agent.phone || (
                                <span className="text-muted-foreground italic">
                                  No phone
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
                            <TableCell className="text-right font-semibold">
                              {performance.totalTenants}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-green-600 font-medium">
                                {performance.activeTenants}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-blue-600 font-medium">
                                {performance.pipelineTenants}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {performance.totalEarnings.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={performance.conversionRate >= 50 ? "default" : "secondary"}
                                className={
                                  performance.conversionRate >= 70 
                                    ? "bg-green-500" 
                                    : performance.conversionRate >= 50 
                                    ? "bg-blue-500" 
                                    : ""
                                }
                              >
                                {performance.conversionRate.toFixed(1)}%
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
                                    title="Deactivate agent"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
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
