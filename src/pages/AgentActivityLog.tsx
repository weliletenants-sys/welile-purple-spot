import { useState, useEffect } from "react";
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
import { ArrowLeft, Activity, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityLog {
  id: string;
  agent_name: string;
  agent_phone: string;
  action_type: string;
  action_description: string | null;
  metadata: any;
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

const AgentActivityLog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [actionTypes, setActionTypes] = useState<string[]>([]);

  // Fetch activity logs with pagination
  const fetchActivityLogs = async () => {
    setIsLoading(true);
    try {
      // Build query
      let query = supabase
        .from("agent_activity_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (searchQuery) {
        query = query.or(
          `agent_name.ilike.%${searchQuery}%,agent_phone.ilike.%${searchQuery}%,action_description.ilike.%${searchQuery}%`
        );
      }

      if (actionTypeFilter !== "all") {
        query = query.eq("action_type", actionTypeFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setActivityLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unique action types for filter
  const fetchActionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_activity_log")
        .select("action_type")
        .order("action_type");

      if (error) throw error;

      const uniqueTypes = Array.from(
        new Set(data?.map((item) => item.action_type) || [])
      ).sort();
      setActionTypes(uniqueTypes);
    } catch (error) {
      console.error("Error fetching action types:", error);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [currentPage, searchQuery, actionTypeFilter]);

  useEffect(() => {
    fetchActionTypes();

    // Setup realtime subscription
    const channel = supabase
      .channel("agent-activity-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_activity_log",
        },
        () => {
          fetchActivityLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case "login":
        return "default";
      case "tenant_added":
        return "default";
      case "payment_recorded":
        return "default";
      case "tenant_updated":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-6">
      <BackToHome />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/agent-management")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-2">
                <Activity className="h-8 w-8" />
                Agent Activity Log
              </h1>
              <p className="text-muted-foreground text-lg">
                Complete history of all agent actions
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search by agent name, phone, or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="flex-1"
              />
              <Select
                value={actionTypeFilter}
                onValueChange={(value) => {
                  setActionTypeFilter(value);
                  setCurrentPage(1); // Reset to first page on filter
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="capitalize">{type.replace(/_/g, " ")}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Showing {activityLogs.length} of {totalCount} results
            </p>
          </CardContent>
        </Card>

        {/* Activity Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading activity logs...</div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found matching your criteria.
              </div>
            ) : (
              <>
                <ScrollArea className="h-[600px] w-full rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Action Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Metadata</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {format(new Date(log.created_at), "MMM dd, yyyy")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(log.created_at), "HH:mm:ss")}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.agent_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.agent_phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action_type)}>
                              <span className="capitalize">
                                {log.action_type.replace(/_/g, " ")}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.action_description || (
                              <span className="text-muted-foreground italic">
                                No description
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.metadata && Object.keys(log.metadata).length > 0 ? (
                              <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-muted-foreground italic">
                                No metadata
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentActivityLog;
