import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, TrendingUp, Users, DollarSign, Award, Download, Target, Trophy, History, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowRightLeft } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useEarningsNotifications } from "@/hooks/useEarningsNotifications";
import { EarningsNotificationDemo } from "@/components/EarningsNotificationDemo";
import { AgentTransferTenantDialog } from "@/components/AgentTransferTenantDialog";
import { AgentTransferHistory } from "@/components/AgentTransferHistory";

interface AgentStats {
  tenantsManaged: number;
  paymentsThisMonth: number;
  totalAmountThisMonth: number;
  earningsThisMonth: number;
  rank: number;
  totalAgents: number;
}

interface Certificate {
  month: string;
  rank: number;
  totalAmount: number;
}

const AgentPortal = () => {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [showTenants, setShowTenants] = useState(false);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const tenantsPerPage = 10;
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  // Enable real-time earnings notifications
  useEarningsNotifications({
    agentName,
    enabled: !!agentName,
  });

  useEffect(() => {
    // Check if agent is logged in
    const storedAgentName = sessionStorage.getItem('agentName');
    const storedAgentPhone = sessionStorage.getItem('agentPhone');

    if (!storedAgentName || !storedAgentPhone) {
      navigate('/agent-portal-login');
      return;
    }

    setAgentName(storedAgentName);
    fetchAgentData(storedAgentName);
    fetchTenantsList(storedAgentName);
  }, [navigate]);

  const fetchTenantsList = async (name: string) => {
    try {
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      
      if (!agentData) return;

      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name, contact, address, rent_amount, status, payment_status')
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      setTenantsList(tenants || []);
    } catch (error) {
      console.error('Error fetching tenants list:', error);
    }
  };

  const fetchAgentData = async (name: string) => {
    setLoading(true);
    try {
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Get agent by name first
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      
      if (!agentData) {
        throw new Error('Agent not found');
      }

      // Fetch tenants managed by this agent using agent_id
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('agent_id', agentData.id);

      const tenantIds = tenants?.map(t => t.id) || [];

      // Fetch payments this month
      const { data: payments } = await supabase
        .from('daily_payments')
        .select('*')
        .in('tenant_id', tenantIds)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('recorded_by', name);

      // Fetch earnings this month
      const { data: earnings } = await supabase
        .from('agent_earnings')
        .select('amount')
        .eq('agent_name', name)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Calculate rank among all agents
      const { data: allPayments } = await supabase
        .from('daily_payments')
        .select('recorded_by, paid_amount')
        .gte('date', startDate)
        .lte('date', endDate);

      const agentTotals: Record<string, number> = {};
      allPayments?.forEach(p => {
        if (p.recorded_by) {
          agentTotals[p.recorded_by] = (agentTotals[p.recorded_by] || 0) + (Number(p.paid_amount) || 0);
        }
      });

      const sortedAgents = Object.entries(agentTotals)
        .sort(([, a], [, b]) => b - a);
      
      const myRank = sortedAgents.findIndex(([agent]) => agent === name) + 1;

      setStats({
        tenantsManaged: tenants?.length || 0,
        paymentsThisMonth: payments?.length || 0,
        totalAmountThisMonth: payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0,
        earningsThisMonth: earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        rank: myRank || 0,
        totalAgents: sortedAgents.length
      });

      // Check if agent has earned certificates (top 3 in any month)
      if (myRank <= 3) {
        setCertificates([{
          month: format(new Date(), 'MMMM yyyy'),
          rank: myRank,
          totalAmount: agentTotals[name] || 0
        }]);
      }

      // Mock goals for demo (in real app, fetch from database)
      setGoals([
        {
          title: 'Monthly Payments',
          target: 50,
          current: payments?.length || 0,
          metric: 'payments'
        },
        {
          title: 'Monthly Revenue',
          target: 5000000,
          current: payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0,
          metric: 'amount'
        }
      ]);

      // Fetch payment history (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: historyData } = await supabase
        .from('agent_earnings')
        .select('*')
        .eq('agent_name', name)
        .gte('created_at', format(sixMonthsAgo, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      setPaymentHistory(historyData || []);

    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('agentName');
    sessionStorage.removeItem('agentPhone');
    navigate('/agent-portal-login');
    toast.success('Logged out successfully');
  };

  const downloadCertificate = (cert: Certificate) => {
    toast.success('Certificate download started!');
    // In a real implementation, this would generate a PDF certificate
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <button 
                  onClick={() => setShowTenants(!showTenants)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <CardTitle className="text-2xl">Welcome, {agentName}! 👋</CardTitle>
                  {showTenants ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                <CardDescription className="text-primary-foreground/80 mt-2">
                  {showTenants ? "Your Tenants" : "Your Performance Dashboard"}
                </CardDescription>
              </div>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>
          {showTenants && (
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {tenantsList.length === 0 ? (
                    <p className="text-primary-foreground/70">No tenants found</p>
                  ) : (
                    tenantsList
                      .slice((currentPage - 1) * tenantsPerPage, currentPage * tenantsPerPage)
                      .map((tenant) => (
                        <div key={tenant.id} className="bg-background/10 backdrop-blur p-3 rounded-lg border border-primary-foreground/20">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-primary-foreground">{tenant.name}</p>
                              <p className="text-sm text-primary-foreground/70">{tenant.contact}</p>
                              <p className="text-xs text-primary-foreground/60 mt-1">{tenant.address}</p>
                            </div>
                            <div className="text-right space-y-2">
                              <p className="font-semibold text-primary-foreground">UGX {Number(tenant.rent_amount).toLocaleString()}</p>
                              <div className="flex gap-1">
                                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                  {tenant.status}
                                </Badge>
                                <Badge variant={tenant.payment_status === 'paid' ? 'default' : 'destructive'} className="text-xs">
                                  {tenant.payment_status}
                                </Badge>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setTransferDialogOpen(true);
                                }}
                              >
                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                Transfer
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                
                {tenantsList.length > tenantsPerPage && (
                  <div className="flex items-center justify-between pt-2 border-t border-primary-foreground/20">
                    <p className="text-sm text-primary-foreground/70">
                      Showing {((currentPage - 1) * tenantsPerPage) + 1} - {Math.min(currentPage * tenantsPerPage, tenantsList.length)} of {tenantsList.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="flex items-center px-3 text-sm font-medium text-primary-foreground">
                        {currentPage} / {Math.ceil(tenantsList.length / tenantsPerPage)}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(tenantsList.length / tenantsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(tenantsList.length / tenantsPerPage)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Main Content */}
        {stats && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Total Tenants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">{stats.tenantsManaged}</p>
                  <p className="text-xs text-muted-foreground mt-1">All tenants under your management</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Payments This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.paymentsThisMonth}</p>
                  <p className="text-xs text-muted-foreground mt-1">Recorded payments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Total Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">UGX {stats.totalAmountThisMonth.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    Your Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">UGX {stats.earningsThisMonth.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Commission earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Ranking Card */}
            <Card className={stats.rank <= 3 ? "border-2 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className={stats.rank === 1 ? "h-6 w-6 text-yellow-500" : "h-6 w-6 text-primary"} />
                  Your Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold">#{stats.rank}</p>
                    <p className="text-muted-foreground mt-1">out of {stats.totalAgents} agents</p>
                  </div>
                  {stats.rank <= 3 && (
                    <Badge variant="default" className="text-lg py-2 px-4">
                      Top {stats.rank === 1 ? '🥇' : stats.rank === 2 ? '🥈' : '🥉'} Performer
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Goals Progress */}
            {goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Your Goals
                  </CardTitle>
                  <CardDescription>Track your progress towards monthly targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notification Demo for testing */}
                  {agentName && (
                    <EarningsNotificationDemo
                      agentName={agentName}
                      agentPhone={sessionStorage.getItem('agentPhone') || ''}
                    />
                  )}
                  
                  {goals.map((goal, index) => {
                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{goal.title}</span>
                          <span className="text-sm font-bold">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            {goal.metric === 'amount' 
                              ? `UGX ${goal.current.toLocaleString()}`
                              : goal.current
                            } / {goal.metric === 'amount' 
                              ? `UGX ${goal.target.toLocaleString()}`
                              : goal.target
                            }
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Transfer History */}
            <AgentTransferHistory agentName={agentName} />

            {/* Certificates */}
            {certificates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Your Certificates
                  </CardTitle>
                  <CardDescription>Recognition for outstanding performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {certificates.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg border-2 border-yellow-500/50"
                      >
                        <div>
                          <p className="font-bold text-lg">
                            {cert.rank === 1 ? '🥇 First Place' : cert.rank === 2 ? '🥈 Second Place' : '🥉 Third Place'}
                          </p>
                          <p className="text-sm text-muted-foreground">{cert.month}</p>
                          <p className="text-sm font-medium mt-1">
                            Total: UGX {cert.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <Button onClick={() => downloadCertificate(cert)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      {selectedTenant && (
        <AgentTransferTenantDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          tenant={selectedTenant}
          currentAgentName={agentName}
          onTransferComplete={() => {
            fetchTenantsList(agentName);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};

export default AgentPortal;
