import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { TenantCard } from "@/components/TenantCard";
import { StatsCard } from "@/components/StatsCard";
import { WelileLogo } from "@/components/WelileLogo";
import { AddTenantForm } from "@/components/AddTenantForm";
import { useTenants } from "@/hooks/useTenants";
import { Search, Users, TrendingUp, MapPin, DollarSign, Menu } from "lucide-react";
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

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenants, isLoading } = useTenants();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  // Auto-refresh data every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(intervalId);
  }, [queryClient]);

  // Get unique locations
  const locations = useMemo(() => {
    const uniqueLocations = Array.from(new Set(tenants.map(t => t.address)));
    return uniqueLocations.sort();
  }, [tenants]);

  // Calculate statistics
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
      total: totalTenants,
      active: activeTenants,
      activePercentage,
      avgPerformance,
      paymentRate,
    };
  }, [tenants]);

  // Filter tenants - comprehensive search across all fields
  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        tenant.name.toLowerCase().includes(searchLower) ||
        tenant.contact.toLowerCase().includes(searchLower) ||
        tenant.address.toLowerCase().includes(searchLower) ||
        tenant.landlord.toLowerCase().includes(searchLower) ||
        tenant.landlordContact.toLowerCase().includes(searchLower) ||
        tenant.status.toLowerCase().includes(searchLower) ||
        tenant.paymentStatus.toLowerCase().includes(searchLower) ||
        (tenant.agentName && tenant.agentName.toLowerCase().includes(searchLower)) ||
        (tenant.agentPhone && tenant.agentPhone.includes(searchLower)) ||
        (tenant.guarantor1?.name && tenant.guarantor1.name.toLowerCase().includes(searchLower)) ||
        (tenant.guarantor1?.contact && tenant.guarantor1.contact.includes(searchLower)) ||
        (tenant.guarantor2?.name && tenant.guarantor2.name.toLowerCase().includes(searchLower)) ||
        (tenant.guarantor2?.contact && tenant.guarantor2.contact.includes(searchLower)) ||
        (tenant.location?.country && tenant.location.country.toLowerCase().includes(searchLower)) ||
        (tenant.location?.county && tenant.location.county.toLowerCase().includes(searchLower)) ||
        (tenant.location?.district && tenant.location.district.toLowerCase().includes(searchLower)) ||
        (tenant.location?.subcountyOrWard && tenant.location.subcountyOrWard.toLowerCase().includes(searchLower)) ||
        (tenant.location?.cellOrVillage && tenant.location.cellOrVillage.toLowerCase().includes(searchLower));
      
      const matchesLocation = locationFilter === "all" || tenant.address === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [searchTerm, locationFilter, tenants]);

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
                  <DropdownMenuItem className="cursor-pointer">
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
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <StatsCard
            title="Total Tenants"
            value={stats.total.toLocaleString()}
            icon={Users}
            description="Across Africa"
          />
          <StatsCard
            title="Active Tenants"
            value={stats.active}
            icon={TrendingUp}
            trend={`${stats.activePercentage}% of sample`}
            description="Currently active"
          />
          <StatsCard
            title="Avg Performance"
            value={`${stats.avgPerformance}%`}
            icon={TrendingUp}
            description="Overall tenant rating"
          />
          <StatsCard
            title="Payment Rate"
            value={`${stats.paymentRate}%`}
            icon={DollarSign}
            description="On-time payments"
          />
          <StatsCard
            title="Sample Size"
            value={tenants.length}
            icon={Users}
            description="Live database records"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, contact, location, landlord, agent, guarantor, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border focus:ring-primary"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className={`w-full sm:w-[200px] bg-card border-border transition-all ${locationFilter !== "all" ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/50"}`}>
              <MapPin className={`w-4 h-4 mr-2 ${locationFilter !== "all" ? "text-primary" : ""}`} />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-card border-border">
              <SelectItem value="all">All Locations ({tenants.length} total)</SelectItem>
              {locations.map(location => {
                const count = tenants.filter(t => t.address === location).length;
                return (
                  <SelectItem key={location} value={location}>
                    {location} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredTenants.length}</span> tenant{filteredTenants.length !== 1 ? 's' : ''}
            {filteredTenants.length < tenants.length && " (filtered)"}
          </p>
        </div>

        {/* Tenant Cards Grid - Fully responsive for all devices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredTenants.map(tenant => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No tenants found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
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
