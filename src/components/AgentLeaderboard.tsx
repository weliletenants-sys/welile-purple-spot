import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { ChevronLeft, ChevronRight, Trophy, Award, Medal, DollarSign, Gift, FileText, Star, Download, Zap, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { BulkEditAgentsDialog } from "@/components/BulkEditAgentsDialog";
import { BulkEditUndoHistory } from "@/components/BulkEditUndoHistory";
import { useQueryClient } from "@tanstack/react-query";
import { useAgents } from "@/hooks/useAgents";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AgentLeaderboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: agents, isLoading } = useAgentEarnings("all");
  const { data: allAgents } = useAgents();

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  // Sort agents by earned commission (descending)
  const sortedAgents = [...(agents || [])].sort((a, b) => b.earnedCommission - a.earnedCommission);
  
  const totalPages = Math.ceil(sortedAgents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAgents = sortedAgents.slice(startIndex, startIndex + pageSize);

  const getRankIcon = (index: number) => {
    const rank = startIndex + index;
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = sortedAgents.map((agent, index) => ({
        "Rank": index + 1,
        "Agent Name": agent.agentName,
        "Phone": agent.agentPhone || "-",
        "Signup Bonuses": agent.signupBonuses || 0,
        "Data Entry Rewards": agent.dataEntryRewards || 0,
        "Recording Bonuses": agent.recordingBonuses || 0,
        "Commissions": agent.commissions || 0,
        "Total Earned": agent.earnedCommission,
        "Tenants Count": agent.tenantsCount,
        "Expected Commission": agent.expectedCommission,
        "Withdrawn": agent.withdrawnCommission,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 6 },  // Rank
        { wch: 25 }, // Agent Name
        { wch: 15 }, // Phone
        { wch: 15 }, // Signup Bonuses
        { wch: 18 }, // Data Entry Rewards
        { wch: 18 }, // Recording Bonuses
        { wch: 15 }, // Commissions
        { wch: 15 }, // Total Earned
        { wch: 13 }, // Tenants Count
        { wch: 20 }, // Expected Commission
        { wch: 12 }, // Withdrawn
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Agent Earnings");

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `Agent_Earnings_Breakdown_${date}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      toast.success("Earnings report exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export earnings report");
    }
  };

  return (
    <div className="space-y-8">
      {/* Undo History */}
      <BulkEditUndoHistory />

      {/* Pagination Controls - Top */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-4 rounded-lg border border-border">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, sortedAgents.length)} of {sortedAgents.length} agents
            </div>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[140px] bg-card border-border z-50">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Top Agents by Earnings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedAgents.map((agent, index) => (
            <Card 
              key={agent.agentName}
              className="p-6 bg-gradient-to-br from-card to-primary/5 border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 relative group cursor-pointer"
              onClick={() => navigate(`/agent/${encodeURIComponent(agent.agentPhone || agent.agentName)}`)}
            >
              <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                      {startIndex + index + 1}
                    </div>
                    {getRankIcon(index)}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{agent.tenantsCount}</div>
                    <div className="text-xs text-muted-foreground">Tenants</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate" title={agent.agentName}>
                      {agent.agentName}
                    </p>
                    {agent.hasRecentRecordingActivity && (
                      <Badge variant="default" className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-2 py-0.5 text-xs animate-pulse">
                        <Zap className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  {agent.agentPhone && (
                    <p className="text-xs text-muted-foreground truncate" title={agent.agentPhone}>
                      {agent.agentPhone}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Earned Commission
                    </div>
                    <div className="text-lg font-bold text-primary">
                      UGX {agent.earnedCommission.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Expected Commission
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground">
                      UGX {agent.expectedCommission.toLocaleString()}
                    </div>
                  </div>
                </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <EditAgentDialog
                  agent={{
                    id: agent.agentPhone,
                    name: agent.agentName,
                    phone: agent.agentPhone,
                    is_active: true,
                  }}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["agent-earnings"] })}
                >
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 bg-card/80 backdrop-blur-sm hover:bg-card"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </EditAgentDialog>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Earnings Breakdown Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Detailed Earnings Breakdown
          </h2>
          <div className="flex gap-2">
            {allAgents && allAgents.length > 0 && (
              <BulkEditAgentsDialog
                agents={allAgents}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["agent-earnings"] });
                  queryClient.invalidateQueries({ queryKey: ["agents"] });
                }}
              />
            )}
            <Button
              onClick={handleExportToExcel}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
          </div>
        </div>
        
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Rank</TableHead>
                  <TableHead className="font-bold">Agent Name</TableHead>
                  <TableHead className="font-bold">Phone</TableHead>
                  <TableHead className="text-right font-bold">
                    <div className="flex items-center justify-end gap-1">
                      <Gift className="w-4 h-4" />
                      Signup Bonuses
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-bold">
                    <div className="flex items-center justify-end gap-1">
                      <FileText className="w-4 h-4" />
                      Data Entry
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-bold">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-4 h-4" />
                      Recording Bonuses
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-bold">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-4 h-4" />
                      Commissions
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-bold bg-primary/10">
                    <div className="flex items-center justify-end gap-1">
                      <Trophy className="w-4 h-4" />
                      Total Earned
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAgents.map((agent, index) => (
                  <TableRow 
                    key={agent.agentName}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/agent/${encodeURIComponent(agent.agentPhone || agent.agentName)}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{startIndex + index + 1}</span>
                        {getRankIcon(index)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {agent.agentName}
                        </span>
                        {agent.hasRecentRecordingActivity && (
                          <Badge variant="default" className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-2 py-0.5 text-xs animate-pulse">
                            <Zap className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{agent.agentPhone || '-'}</TableCell>
                    <TableCell className="text-right">
                      UGX {(agent.signupBonuses || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      UGX {(agent.dataEntryRewards || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-primary font-semibold">
                      UGX {(agent.recordingBonuses || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      UGX {(agent.commissions || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg bg-primary/5">
                      UGX {agent.earnedCommission.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Pagination Controls - Bottom */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-4 rounded-lg border border-border">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, sortedAgents.length)} of {sortedAgents.length} agents
            </div>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[140px] bg-card border-border z-50">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
