import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { TenantCard } from "@/components/TenantCard";
import { StatsCard } from "@/components/StatsCard";
import { WelileLogo } from "@/components/WelileLogo";
import { AddTenantForm } from "@/components/AddTenantForm";
import { tenants, TOTAL_TENANT_COUNT } from "@/data/tenants";
import { Search, Users, TrendingUp, MapPin, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 20;

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get unique locations
  const locations = useMemo(() => {
    const uniqueLocations = Array.from(new Set(tenants.map(t => t.address)));
    return uniqueLocations.sort();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTenants = TOTAL_TENANT_COUNT;
    const sampleSize = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const activePercentage = Math.round((activeTenants / sampleSize) * 100);
    const avgPerformance = Math.round(
      tenants.reduce((acc, t) => acc + t.performance, 0) / tenants.length
    );
    const paidTenants = tenants.filter(t => t.paymentStatus === 'paid' || t.paymentStatus === 'cleared').length;
    const paymentRate = Math.round((paidTenants / tenants.length) * 100);

    return {
      total: totalTenants,
      active: activeTenants,
      activePercentage,
      avgPerformance,
      paymentRate,
    };
  }, [refreshKey]);

  // Filter tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.landlord.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === "all" || tenant.address === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [searchTerm, locationFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
              <AddTenantForm onTenantAdded={() => setRefreshKey(k => k + 1)} />
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
            description="Live data records"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, or landlord..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-card border-border focus:ring-primary"
            />
          </div>
          <Select value={locationFilter} onValueChange={(value) => {
            setLocationFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-[200px] bg-card border-border">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count & Pagination Info */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{startIndex + 1}-{Math.min(endIndex, filteredTenants.length)}</span> of{" "}
            <span className="font-semibold text-foreground">{filteredTenants.length}</span> tenants
            {filteredTenants.length < tenants.length && " (filtered)"}
          </p>
          <div className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </div>
        </div>

        {/* Tenant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedTenants.map(tenant => (
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-border"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* Page Numbers */}
            <div className="flex gap-2">
              {currentPage > 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)}
                    className="border-border"
                  >
                    1
                  </Button>
                  {currentPage > 3 && <span className="px-2 py-1 text-muted-foreground">...</span>}
                </>
              )}
              
              {currentPage > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  className="border-border"
                >
                  {currentPage - 1}
                </Button>
              )}
              
              <Button
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-primary to-accent"
              >
                {currentPage}
              </Button>
              
              {currentPage < totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  className="border-border"
                >
                  {currentPage + 1}
                </Button>
              )}
              
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && <span className="px-2 py-1 text-muted-foreground">...</span>}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    className="border-border"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-border"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Welile Tenants Hub - Performance Monitoring Platform</p>
          <p className="text-sm mt-2">Scalable to 40M+ tenants across Africa</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
