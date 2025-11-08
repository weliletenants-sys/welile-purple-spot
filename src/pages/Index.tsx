import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { TenantCard } from "@/components/TenantCard";
import { WelileLogo } from "@/components/WelileLogo";
import { ShareButton } from "@/components/ShareButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import { BulkUploadTenants } from "@/components/BulkUploadTenants";
import { useTenants } from "@/hooks/useTenants";
import { Search, Users, TrendingUp, MapPin, DollarSign, Menu, Award, Zap, AlertTriangle, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load heavy components
const AddTenantForm = lazy(() => import("@/components/AddTenantForm").then(m => ({ default: m.AddTenantForm })));
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <InstallPrompt />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <DropdownMenuItem 
                    className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90 font-extrabold text-lg py-4 border-4 border-destructive mb-3 animate-pulse"
                    onClick={() => navigate("/missed-payments")}
                  >
                    <AlertTriangle className="w-6 h-6 mr-2 animate-bounce" />
                    🚨 MISSED PAYMENTS
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/executive-dashboard")}
                  >
                    EXECUTIVE DASHBOARD
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/admin-login")}>
                    ADMIN DASHBOARD
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/withdrawal-history")}
                  >
                    💰 WITHDRAWAL HISTORY
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/agent-dashboard")}
                  >
                    AGENT DASHBOARD
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/agent-portal-login")}
                  >
                    🔐 AGENT PORTAL
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/top-performers")}
                  >
                    TOP PERFORMERS
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/recording-activity")}
                  >
                    ⭐ RECORDING ACTIVITY
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/recently-added")}
                  >
                    📋 RECENTLY ADDED
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold"
                    onClick={() => navigate("/risk-dashboard")}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    🚨 RISK DASHBOARD
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 font-semibold"
                    onClick={() => navigate("/pipeline-tenants")}
                  >
                    <Hourglass className="w-4 h-4 mr-2" />
                    ⏳ PIPELINE CONVERSION
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="p-0"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <BulkUploadTenants />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Suspense fallback={<Button variant="outline">Add Tenant</Button>}>
                <AddTenantForm />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* PROMINENT SEARCH SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-accent to-primary p-6 md:p-12 shadow-xl border-2 border-primary/30">
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

        {/* Stats Section */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 bg-card/80 rounded-xl px-6 py-3 border border-border">
            <Zap className="w-6 h-6 text-primary" />
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-card/80 rounded-xl px-6 py-3 border border-border">
            <TrendingUp className="w-6 h-6 text-primary" />
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-card/80 rounded-xl px-6 py-3 border border-border">
            <Award className="w-6 h-6 text-primary" />
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.paymentRate}%</div>
              <div className="text-xs text-muted-foreground">Paid</div>
            </div>
          </div>
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
    </div>
  );
};

export default Index;
