import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { TenantCard } from "@/components/TenantCard";
import { WelileLogo } from "@/components/WelileLogo";
import { ShareButton } from "@/components/ShareButton";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAgents } from "@/hooks/useAgents";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AddAgentDialog } from "@/components/AddAgentDialog";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { BulkUploadTenants } from "@/components/BulkUploadTenants";
import { FloatingQuickActionsPanel } from "@/components/FloatingQuickActionsPanel";
import { AchievementsModal } from "@/components/AchievementsModal";
import { LeaderboardModal } from "@/components/LeaderboardModal";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import { LandlordGroupedExport } from "@/components/LandlordGroupedExport";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTenants } from "@/hooks/useTenants";
import { Search, Users, TrendingUp, MapPin, DollarSign, Menu, Award, Zap, AlertTriangle, Hourglass, BarChart3, Clock, Plus, UserPlus, FileText, LayoutDashboard, Building2, Phone, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

import { AddTenantForm } from "@/components/AddTenantForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showTour, completeTour, skipTour } = useOnboardingTour();
  const { isAdmin } = useAdminRole();
  const { data: agents, refetch: refetchAgents } = useAgents();
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [feeFilter, setFeeFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const pageSize = 10;

  // Handle URL parameters for filtering
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get("filter");
    const agent = params.get("agent");
    if (filter === "registration") {
      setFeeFilter("registration");
    }
    if (agent) {
      setAgentFilter(decodeURIComponent(agent));
      setSearchTerm(decodeURIComponent(agent)); // Also set search term to show the agent name
    }
  }, []);

  // Debounce search term to avoid too many queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300); // Reduced from 500ms to 300ms
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when location filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [locationFilter]);

  const { tenants, totalCount, locations, isLoading } = useTenants({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    locationFilter,
    feeFilter,
    agentFilter,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  // Auto-refresh data every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-locations"] });
      queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(intervalId);
  }, [queryClient]);

  // Calculate statistics for current page
  const stats = useMemo(() => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const activePercentage = totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0;
    const avgPerformance = totalTenants > 0 ? Math.round(
      tenants.reduce((acc, t) => acc + t.performance, 0) / tenants.length
    ) : 0;
    const paidTenants = tenants.filter(t => t.paymentStatus === 'paid' || t.paymentStatus === 'cleared').length;
    const paymentRate = totalTenants > 0 ? Math.round((paidTenants / tenants.length) * 100) : 0;

    return {
      total: totalCount,
      active: activeTenants,
      activePercentage,
      avgPerformance,
      paymentRate,
    };
  }, [tenants, totalCount]);

  const tourSteps = [
    {
      target: '[data-tour="stats"]',
      title: 'Key Metrics at a Glance',
      description: 'View your most important statistics here. Color-coded for quick understanding.',
      position: 'bottom' as const,
      icon: <BarChart3 className="h-5 w-5 text-primary" />
    },
    {
      target: '[data-tour="navigation"]',
      title: 'Main Navigation',
      description: 'All major sections are accessible here. Click to explore different areas of the app.',
      position: 'bottom' as const,
      icon: <Menu className="h-5 w-5 text-primary" />
    },
    {
      target: '[data-tour="search"]',
      title: 'Search & Filter',
      description: 'Quickly find any tenant using search and filters. Real-time results as you type.',
      position: 'bottom' as const,
      icon: <Search className="h-5 w-5 text-primary" />
    },
    {
      target: '[data-tour="quick-actions"]',
      title: 'Quick Actions Panel',
      description: 'Access common features instantly from this floating panel. Always available while you browse.',
      position: 'left' as const,
      icon: <LayoutDashboard className="h-5 w-5 text-primary" />
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <FloatingQuickActionsPanel 
        onAchievementsClick={() => setShowAchievements(true)}
        onLeaderboardClick={() => setShowLeaderboard(true)}
      />
      <InstallPrompt />
      
      {showTour && (
        <OnboardingTour
          steps={tourSteps}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}

      <AchievementsModal
        open={showAchievements}
        onClose={() => setShowAchievements(false)}
        userIdentifier={agentFilter || undefined}
      />

      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        userIdentifier={agentFilter || undefined}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <WelileLogo />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Tenants Hub
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Monitor and manage tenant performance</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent">
                <Users className="w-5 h-5 text-primary-foreground" />
                <span className="font-bold text-primary-foreground">{stats.total.toLocaleString()} Total Tenants</span>
              </div>
              <ShareButton />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="hover-scale" data-tour="navigation">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-card">
                  <DropdownMenuItem 
                    className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold text-base py-4 mb-2 rounded-md animate-fade-in flex items-center gap-2"
                    onClick={() => navigate("/missed-payments")}
                  >
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                    <span>🚨 Missed Payments</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2 py-3"
                    onClick={() => navigate("/executive-dashboard")}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Executive Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2 py-3" 
                    onClick={() => navigate("/admin-login")}
                  >
                    <Users className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2 py-3"
                    onClick={() => navigate("/withdrawal-history")}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>💰 Withdrawal History</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2 py-3"
                    onClick={() => navigate("/agent-dashboard")}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Agent Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2 py-3"
                    onClick={() => navigate("/agent-portal-login")}
                  >
                    <Users className="w-4 h-4" />
                    <span>🔐 Agent Portal</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2 py-3"
                    onClick={() => navigate("/top-performers")}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Top Performers</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2 py-3"
                    onClick={() => navigate("/recording-activity")}
                  >
                    <Clock className="w-4 h-4" />
                    <span>⭐ Recording Activity</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2 py-3"
                    onClick={() => navigate("/recently-added")}
                  >
                    <Plus className="w-4 w-4" />
                    <span>📋 Recently Added</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/30 font-semibold py-3 rounded-md mt-2 flex items-center gap-2"
                    onClick={() => navigate("/risk-dashboard")}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>🚨 Risk Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/30 font-semibold py-3 rounded-md mt-1 flex items-center gap-2"
                    onClick={() => navigate("/pipeline-tenants")}
                  >
                    <Clock className="w-4 h-4" />
                    <span>⏳ Pipeline Conversion</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/30 font-semibold py-3 rounded-md mt-1 flex items-center gap-2"
                    onClick={() => navigate("/pipeline-analytics")}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>📊 Pipeline Analytics</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/30 font-semibold py-3 rounded-md mt-1 flex items-center gap-2"
                    onClick={() => navigate("/agent-management")}
                  >
                    <Users className="w-4 h-4" />
                    <span>👥 Agent Management</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30 font-semibold py-3 rounded-md mt-1 flex items-center gap-2"
                    onClick={() => navigate("/landlord-management")}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>🏢 Landlord Management</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="p-0 mt-2"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="w-full px-2">
                      <LandlordGroupedExport />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="p-0 mt-2"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <BulkUploadTenants />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <AddTenantForm />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* PROMINENT SEARCH SECTION */}
        <div data-tour="search" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-accent to-primary p-6 md:p-12 shadow-xl border-2 border-primary/30">
          <div className="absolute inset-0 opacity-10 bg-card"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground">
                🔍 Find Your Tenant
              </h2>
            </div>
            
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Main Search Bar */}
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-primary z-10" />
                <Input
                  placeholder="Search by name, location, agent, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-20 pl-20 pr-8 text-xl bg-card border-2 border-white/50 focus:border-white rounded-2xl shadow-lg font-semibold placeholder:text-muted-foreground/60"
                />
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className={`h-12 bg-card border border-white/50 text-base font-semibold ${locationFilter !== "all" ? "border-white bg-primary/20" : ""}`}>
                    <MapPin className="w-5 h-5 mr-2" />
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-card border-border">
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={feeFilter} onValueChange={setFeeFilter}>
                  <SelectTrigger className={`h-12 bg-card border border-white/50 text-base font-semibold ${feeFilter !== "all" ? "border-white bg-primary/20" : ""}`}>
                    <DollarSign className="w-5 h-5 mr-2" />
                    <SelectValue placeholder="All Fees" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="registration">With Registration Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Agent Management Section */}
        {isAdmin && (
          <div className="space-y-6 animate-fade-in">
            {/* Prominent Add Agent Section */}
            <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 border-primary shadow-2xl">
              <CardContent className="pt-8 pb-8 text-center">
                <h2 className="text-3xl font-bold text-primary-foreground mb-6">
                  Agent Management Center
                </h2>
                <AddAgentDialog onSuccess={refetchAgents} />
              </CardContent>
            </Card>

            {/* Agent Cards Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserCog className="h-6 w-6" />
                    Active Agents ({agents?.length || 0})
                  </span>
                  <Link to="/agent-management">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents && agents.length > 0 ? (
                    agents.slice(0, 9).map((agent) => (
                      <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{agent.name}</h3>
                              {agent.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>{agent.phone}</span>
                                </div>
                              )}
                            </div>
                            <EditAgentDialog 
                              agent={{ 
                                id: agent.id, 
                                name: agent.name, 
                                phone: agent.phone, 
                                is_active: true 
                              }} 
                              onSuccess={refetchAgents} 
                            />
                          </div>
                          <Link to={`/agent/${agent.phone}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Performance
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No agents found. Add your first agent above!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Other Admin Actions */}
            <Card className="bg-gradient-to-br from-secondary/30 via-secondary/20 to-background">
              <CardHeader>
                <CardTitle className="text-2xl">Other Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/agent-performance">
                  <Button size="lg" variant="outline" className="w-full text-lg py-6">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Agent Performance Dashboard
                  </Button>
                </Link>
                <Link to="/agent-management">
                  <Button size="lg" variant="outline" className="w-full text-lg py-6">
                    <Users className="mr-2 h-5 w-5" />
                    Full Agent List
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Section with enhanced visuals */}
        <div data-tour="stats" className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl px-6 py-4 border-2 border-blue-200 dark:border-blue-800 hover-scale cursor-help shadow-md">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Tenants</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>All tenants in the system</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-xl px-6 py-4 border-2 border-green-200 dark:border-green-800 hover-scale cursor-help shadow-md">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.active}</div>
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Active ({stats.activePercentage}%)</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tenants with active status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-xl px-6 py-4 border-2 border-purple-200 dark:border-purple-800 hover-scale cursor-help shadow-md">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.paymentRate}%</div>
                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Payment Rate</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Percentage of tenants who have paid</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> tenant{totalCount !== 1 ? 's' : ''}
          </p>
          {totalPages > 1 && (
            <p className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{currentPage}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
            </p>
          )}
        </div>

        {/* Tenant Cards Grid - Fully responsive for all devices */}
        <div className="relative">
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm font-medium text-foreground">Searching...</span>
            </div>
          )}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 transition-opacity duration-200 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
            {tenants.map((tenant, index) => (
              <TenantCard 
                key={tenant.id} 
                tenant={tenant} 
                tenantNumber={((currentPage - 1) * pageSize) + index + 1}
                isFiltered={debouncedSearchTerm.length > 0} 
              />
            ))}
          </div>
        </div>

        {!isLoading && tenants.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No tenants found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {/* Pages around current */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  if (currentPage > 3 && pageNum === 1) return null;
                  if (currentPage < totalPages - 2 && pageNum === totalPages) return null;
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Welile Tenants Hub - Performance Monitoring Platform</p>
          <p className="text-sm mt-2">Powered by Lovable Cloud</p>
        </div>
      </footer>

      {/* Floating Quick Actions Panel */}
      <FloatingQuickActionsPanel />
    </div>
  );
};

export default Index;
