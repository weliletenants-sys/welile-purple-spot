import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { ChevronLeft, ChevronRight, Trophy, Award, Medal, DollarSign, Gift, FileText, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const AgentLeaderboard = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;
  const { data: agents, isLoading } = useAgentEarnings("all");

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

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Top Agents by Earnings
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
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
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedAgents.map((agent, index) => (
            <Card 
              key={agent.agentName}
              className="p-6 bg-gradient-to-br from-card to-primary/5 border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/agent/${encodeURIComponent(agent.agentName)}`)}
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
                <p className="font-semibold text-foreground truncate" title={agent.agentName}>
                  {agent.agentName}
                </p>
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
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Earnings Breakdown Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Detailed Earnings Breakdown
        </h2>
        
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
                    onClick={() => navigate(`/agent/${encodeURIComponent(agent.agentName)}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{startIndex + index + 1}</span>
                        {getRankIcon(index)}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{agent.agentName}</TableCell>
                    <TableCell className="text-muted-foreground">{agent.agentPhone || '-'}</TableCell>
                    <TableCell className="text-right">
                      UGX {agent.signupBonuses.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      UGX {agent.dataEntryRewards.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-primary font-semibold">
                      UGX {agent.recordingBonuses.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      UGX {agent.commissions.toLocaleString()}
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
    </div>
  );
};
