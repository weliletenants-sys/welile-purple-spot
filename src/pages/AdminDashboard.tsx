import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWithdrawalRequests } from "@/hooks/useWithdrawalRequests";
import { ReportsSection } from "@/components/ReportsSection";
import { ReportGenerator } from "@/components/ReportGenerator";
import { ReportComparison } from "@/components/ReportComparison";
import { AgentPerformanceComparison } from "@/components/AgentPerformanceComparison";
import { AgentRankingComparison } from "@/components/AgentRankingComparison";
import { MultiAgentComparison } from "@/components/MultiAgentComparison";
import { PerformanceGoalsTracking } from "@/components/PerformanceGoalsTracking";
import { AuthorizedRecordersManager } from "@/components/AuthorizedRecordersManager";
import { RecorderPerformanceComparison } from "@/components/RecorderPerformanceComparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle, XCircle, LogOut, Clock, FileText, LineChart, GitCompare, UserCheck, Trophy, Users, Target, Home, ChevronDown } from "lucide-react";
import { format } from "date-fns";

const ADMIN_ACCESS_CODE = "Mypart@welile";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { requests, isLoading, updateRequest } = useWithdrawalRequests();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [activeSection, setActiveSection] = useState("requests");

  useEffect(() => {
    const accessCode = sessionStorage.getItem("adminAccessCode");
    if (accessCode !== ADMIN_ACCESS_CODE) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1':
            setActiveSection('requests');
            break;
          case '2':
            setActiveSection('recorders');
            break;
          case '3':
            setActiveSection('recorder-performance');
            break;
          case '4':
            setActiveSection('reports');
            break;
          case '5':
            setActiveSection('generator');
            break;
          case '6':
            setActiveSection('comparison');
            break;
          case '7':
            setActiveSection('agent-comparison');
            break;
          case '8':
            setActiveSection('rankings');
            break;
          case '9':
            setActiveSection('multi-agent');
            break;
          case '0':
            setActiveSection('goals');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleApprove = async (id: string) => {
    await updateRequest({ id, status: 'approved', notes });
    setSelectedRequest(null);
    setNotes("");
  };

  const handleReject = async (id: string) => {
    await updateRequest({ id, status: 'rejected', notes });
    setSelectedRequest(null);
    setNotes("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAccessCode");
    navigate('/admin-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Manage withdrawal requests</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/agent-portal-login')}>
                  🔐 Agent Portal
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/monthly-summary')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Monthly Summary
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {activeSection === 'requests' && <RequestsSection 
                pendingRequests={pendingRequests}
                processedRequests={processedRequests}
                selectedRequest={selectedRequest}
                setSelectedRequest={setSelectedRequest}
                notes={notes}
                setNotes={setNotes}
                handleApprove={handleApprove}
                handleReject={handleReject}
              />}
              {activeSection === 'recorders' && <AuthorizedRecordersManager />}
              {activeSection === 'recorder-performance' && <RecorderPerformanceComparison />}
              {activeSection === 'reports' && <ReportsSection />}
              {activeSection === 'generator' && <ReportGenerator />}
              {activeSection === 'comparison' && <ReportComparison />}
              {activeSection === 'agent-comparison' && <AgentPerformanceComparison />}
              {activeSection === 'rankings' && <AgentRankingComparison />}
              {activeSection === 'multi-agent' && <MultiAgentComparison />}
              {activeSection === 'goals' && <PerformanceGoalsTracking />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Sidebar Component
const AdminSidebar = ({ 
  activeSection, 
  setActiveSection 
}: { 
  activeSection: string; 
  setActiveSection: (section: string) => void;
}) => {
  const [withdrawalOpen, setWithdrawalOpen] = useState(true);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const navItems = {
    withdrawal: [
      { id: 'requests', label: 'Requests', icon: Clock, shortcut: 'Alt+1' }
    ],
    recording: [
      { id: 'recorders', label: 'Authorized Recorders', icon: UserCheck, shortcut: 'Alt+2' },
      { id: 'recorder-performance', label: 'Performance', icon: Trophy, shortcut: 'Alt+3' }
    ],
    reports: [
      { id: 'reports', label: 'Reports', icon: FileText, shortcut: 'Alt+4' },
      { id: 'generator', label: 'Generate Reports', icon: LineChart, shortcut: 'Alt+5' },
      { id: 'comparison', label: 'Report Comparison', icon: GitCompare, shortcut: 'Alt+6' },
      { id: 'agent-comparison', label: 'Agent Performance', icon: UserCheck, shortcut: 'Alt+7' },
      { id: 'rankings', label: 'Rankings', icon: Trophy, shortcut: 'Alt+8' },
      { id: 'multi-agent', label: 'Multi-Agent', icon: Users, shortcut: 'Alt+9' },
      { id: 'goals', label: 'Goals Tracking', icon: Target, shortcut: 'Alt+0' }
    ]
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        {/* Withdrawal Management Section */}
        <Collapsible open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1.5 flex items-center justify-between">
                <span>Withdrawal Management</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${withdrawalOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.withdrawal.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        tooltip={item.shortcut}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Recording Management Section */}
        <Collapsible open={recordingOpen} onOpenChange={setRecordingOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1.5 flex items-center justify-between">
                <span>Recording Management</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${recordingOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.recording.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        tooltip={item.shortcut}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Reports & Analytics Section */}
        <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1.5 flex items-center justify-between">
                <span>Reports & Analytics</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.reports.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        tooltip={item.shortcut}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
};

// Requests Section Component
const RequestsSection = ({
  pendingRequests,
  processedRequests,
  selectedRequest,
  setSelectedRequest,
  notes,
  setNotes,
  handleApprove,
  handleReject
}: {
  pendingRequests: any[];
  processedRequests: any[];
  selectedRequest: string | null;
  setSelectedRequest: (id: string | null) => void;
  notes: string;
  setNotes: (notes: string) => void;
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
}) => (
  <div className="space-y-6">
    {/* Pending Requests */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Requests ({pendingRequests.length})
        </CardTitle>
        <CardDescription>
          Review and approve agent commission withdrawal requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No pending withdrawal requests
          </p>
        ) : (
          pendingRequests.map((request) => (
            <Card key={request.id} className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{request.agent_name}</h3>
                      <p className="text-sm text-muted-foreground">{request.agent_phone}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {format(new Date(request.requested_at), 'PPp')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        UGX {request.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {request.status}
                      </Badge>
                    </div>
                  </div>

                  {selectedRequest === request.id && (
                    <div className="space-y-3 pt-2">
                      <Separator />
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Notes (optional)</label>
                        <Textarea
                          placeholder="Add any notes about this request..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {selectedRequest === request.id ? (
                      <>
                        <Button
                          onClick={() => handleApprove(request.id)}
                          className="flex-1"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Approval
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          className="flex-1"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Confirm Rejection
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(null);
                            setNotes("");
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => setSelectedRequest(request.id)}
                          className="flex-1"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => setSelectedRequest(request.id)}
                          className="flex-1"
                          variant="outline"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>

    {/* Processed Requests */}
    {processedRequests.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
          <CardDescription>Recently approved or rejected requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {processedRequests.map((request) => (
            <Card key={request.id} className="border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{request.agent_name}</h4>
                    <p className="text-sm text-muted-foreground">{request.agent_phone}</p>
                    <p className="text-xs text-muted-foreground">
                      Processed: {request.processed_at ? format(new Date(request.processed_at), 'PPp') : 'N/A'}
                    </p>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Note: {request.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xl font-semibold">
                      UGX {request.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant={request.status === 'approved' ? 'default' : 'destructive'}
                    >
                      {request.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    )}
  </div>
);

export default AdminDashboard;