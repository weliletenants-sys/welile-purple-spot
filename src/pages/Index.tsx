import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { TenantCard } from "@/components/TenantCard";
import { WelileLogo } from "@/components/WelileLogo";
import { AgentLeaderboard } from "@/components/AgentLeaderboard";
import { AddTenantForm } from "@/components/AddTenantForm";
import { ShareButton } from "@/components/ShareButton";
import { useTenants } from "@/hooks/useTenants";
import { Search, Users, TrendingUp, MapPin, DollarSign, Menu, Target, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const pageSize = 10;

  // Handle URL parameters for filtering
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get("filter");
    if (filter === "registration") {
      setFeeFilter("registration");
    }
  }, []);

  // Debounce search term to avoid too many queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
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
                <span className="font-bold text-primary-foreground">{stats.total.toLocaleString()} Tenants</span>
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
                    className="cursor-pointer"
                    onClick={() => navigate("/executive-dashboard")}
                  >
                    EXECUTIVE DASHBOARD
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    ADMIN DASHBOARD
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/agent-dashboard")}
                  >
                    AGENT DASHBOARD
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <AddTenantForm />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* PROMINENT SEARCH SECTION - FIRST THING USERS SEE */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/95 via-accent/95 to-primary/95 p-6 md:p-10 shadow-2xl border-4 border-primary/30 animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Search className="w-10 h-10 text-primary-foreground animate-pulse" />
                <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">
                  Find Any Tenant Instantly
                </h2>
                <Search className="w-10 h-10 text-primary-foreground animate-pulse" />
              </div>
              <p className="text-lg md:text-xl text-primary-foreground/95 font-semibold">
                Search by name, location, agent, phone number, or any detail
              </p>
            </div>
            
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Main Search Bar */}
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-primary z-10 group-focus-within:scale-110 transition-transform" />
                <Input
                  placeholder="🔍 Start typing to search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-20 pl-20 pr-8 text-xl bg-card/95 backdrop-blur-sm border-4 border-white/40 focus:border-white focus:ring-4 focus:ring-white/30 rounded-2xl shadow-2xl font-medium placeholder:text-muted-foreground/70 transition-all"
                />
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className={`h-14 bg-card/95 backdrop-blur-sm border-2 border-white/40 hover:border-white transition-all text-base font-medium ${locationFilter !== "all" ? "ring-4 ring-white/30 border-white bg-primary/20 scale-105" : ""}`}>
                    <MapPin className={`w-5 h-5 mr-2 ${locationFilter !== "all" ? "text-primary" : ""}`} />
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
                  <SelectTrigger className={`h-14 bg-card/95 backdrop-blur-sm border-2 border-white/40 hover:border-white transition-all text-base font-medium ${feeFilter !== "all" ? "ring-4 ring-white/30 border-white bg-primary/20 scale-105" : ""}`}>
                    <DollarSign className={`w-5 h-5 mr-2 ${feeFilter !== "all" ? "text-primary" : ""}`} />
                    <SelectValue placeholder="All Fees" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="registration">With Registration Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {debouncedSearchTerm && (
              <div className="text-center">
                <p className="text-primary-foreground/90 font-semibold text-sm">
                  Searching for: <span className="text-white bg-white/20 px-3 py-1 rounded-full">{debouncedSearchTerm}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hero Section - Motivational */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 via-accent/80 to-primary/80 p-8 md:p-12 mb-8 shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          
          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Target className="w-12 h-12 text-primary-foreground animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
                Your Success Starts Here
              </h2>
              <Award className="w-12 h-12 text-primary-foreground animate-pulse" />
            </div>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-3xl mx-auto font-medium">
              Every tenant you bring is a step towards financial freedom. Track your earnings, 
              compete with top performers, and watch your commission grow!
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30 hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 text-yellow-300" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-primary-foreground">{stats.total}</div>
                  <div className="text-xs text-primary-foreground/80">Total Tenants</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30 hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-300" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-primary-foreground">{stats.active}</div>
                  <div className="text-xs text-primary-foreground/80">Active & Earning</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30 hover:scale-105 transition-transform">
                <Award className="w-6 h-6 text-amber-300" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-primary-foreground">{stats.paymentRate}%</div>
                  <div className="text-xs text-primary-foreground/80">Payment Rate</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-2xl mx-auto">
              <p className="text-primary-foreground/90 font-semibold text-lg italic">
                "Success is not final, failure is not fatal: it is the courage to continue that counts."
              </p>
              <p className="text-primary-foreground/70 text-sm mt-2">— Keep pushing forward, Agent!</p>
            </div>
          </div>
        </div>

        {/* Agent Leaderboard */}
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">🏆 Top Performers</h3>
            <p className="text-muted-foreground">These agents are leading the way. Will you join them?</p>
          </div>
          <AgentLeaderboard />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {tenants.map(tenant => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>

        {tenants.length === 0 && (
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
