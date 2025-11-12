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
import { ArrowLeft, Activity, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [datePreset, setDatePreset] = useState<string>("all");
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLog[]>([]);

  // Fetch all activity logs for statistics (without pagination)
  const fetchAllActivityLogs = async () => {
    try {
      let query = supabase
        .from("agent_activity_log")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply same filters as main query
      if (searchQuery) {
        query = query.or(
          `agent_name.ilike.%${searchQuery}%,agent_phone.ilike.%${searchQuery}%,action_description.ilike.%${searchQuery}%`
        );
      }

      if (actionTypeFilter !== "all") {
        query = query.eq("action_type", actionTypeFilter);
      }

      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setAllActivityLogs(data || []);
    } catch (error) {
      console.error("Error fetching all activity logs:", error);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalActions = allActivityLogs.length;

    // Find most common action type
    const actionTypeCounts: Record<string, number> = {};
    allActivityLogs.forEach((log) => {
      actionTypeCounts[log.action_type] = (actionTypeCounts[log.action_type] || 0) + 1;
    });

    const mostCommonAction = Object.entries(actionTypeCounts)
      .sort(([, a], [, b]) => b - a)[0];

    // Calculate trend (compare last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = subDays(now, 7);
    const previous7Days = subDays(now, 14);

    const recentActions = allActivityLogs.filter(
      (log) => new Date(log.created_at) >= last7Days
    ).length;

    const previousActions = allActivityLogs.filter(
      (log) => {
        const date = new Date(log.created_at);
        return date >= previous7Days && date < last7Days;
      }
    ).length;

    const trend = previousActions > 0
      ? ((recentActions - previousActions) / previousActions) * 100
      : recentActions > 0 ? 100 : 0;

    return {
      totalActions,
      mostCommonAction: mostCommonAction
        ? { type: mostCommonAction[0], count: mostCommonAction[1] }
        : null,
      trend: {
        value: trend,
        direction: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
        recentCount: recentActions,
        previousCount: previousActions,
      },
    };
  };

  const stats = calculateStats();

  // Handle date preset changes
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case "today":
        setDateRange({
          from: startOfDay(now),
          to: endOfDay(now),
        });
        break;
      case "last7days":
        setDateRange({
          from: startOfDay(subDays(now, 7)),
          to: endOfDay(now),
        });
        break;
      case "last30days":
        setDateRange({
          from: startOfDay(subDays(now, 30)),
          to: endOfDay(now),
        });
        break;
      case "all":
        setDateRange(undefined);
        break;
      default:
        break;
    }
    setCurrentPage(1);
  };

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

      // Apply date range filter
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
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
    fetchAllActivityLogs();
  }, [currentPage, searchQuery, actionTypeFilter, dateRange]);

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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions}</div>
              <p className="text-xs text-muted-foreground">
                {dateRange?.from && dateRange?.to
                  ? `In selected date range`
                  : "All time activity"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Common Action</CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {stats.mostCommonAction ? (
                <>
                  <div className="text-2xl font-bold capitalize">
                    {stats.mostCommonAction.type.replace(/_/g, " ")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.mostCommonAction.count} occurrences
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity Trend</CardTitle>
              {stats.trend.direction === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : stats.trend.direction === "down" ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Activity className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span
                  className={
                    stats.trend.direction === "up"
                      ? "text-green-600"
                      : stats.trend.direction === "down"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }
                >
                  {stats.trend.value > 0 ? "+" : ""}
                  {stats.trend.value.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days vs previous 7 days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.trend.recentCount} vs {stats.trend.previousCount} actions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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

              {/* Date Range Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <Select
                  value={datePreset}
                  onValueChange={handleDatePresetChange}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {datePreset === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full md:w-[300px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          setCurrentPage(1);
                        }}
                        numberOfMonths={2}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {dateRange && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDateRange(undefined);
                      setDatePreset("all");
                      setCurrentPage(1);
                    }}
                    title="Clear date range"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {activityLogs.length} of {totalCount} results
                  {dateRange?.from && dateRange?.to && (
                    <span className="ml-2">
                      from {format(dateRange.from, "MMM dd")} to {format(dateRange.to, "MMM dd, yyyy")}
                    </span>
                  )}
                </p>
              </div>
            </div>
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
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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
