import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { TenantCard } from "@/components/TenantCard";
import { StatsCard } from "@/components/StatsCard";
import { tenants } from "@/data/tenants";
import { Search, Users, TrendingUp, MapPin, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  // Get unique locations
  const locations = useMemo(() => {
    const uniqueLocations = Array.from(new Set(tenants.map(t => t.address)));
    return uniqueLocations.sort();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const avgPerformance = Math.round(
      tenants.reduce((acc, t) => acc + t.performance, 0) / tenants.length
    );
    const paidTenants = tenants.filter(t => t.paymentStatus === 'paid').length;
    const paymentRate = Math.round((paidTenants / totalTenants) * 100);

    return {
      total: totalTenants,
      active: activeTenants,
      avgPerformance,
      paymentRate,
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Welile Tenants Hub
              </h1>
              <p className="text-muted-foreground mt-1">Monitor and manage tenant performance</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent">
              <Users className="w-5 h-5 text-primary-foreground" />
              <span className="font-bold text-primary-foreground">{stats.total} Tenants</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Tenants"
            value={stats.total}
            icon={Users}
            description="Registered in the system"
          />
          <StatsCard
            title="Active Tenants"
            value={stats.active}
            icon={TrendingUp}
            trend={`${Math.round((stats.active / stats.total) * 100)}% of total`}
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
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, or landlord..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border focus:ring-primary"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
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

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredTenants.length}</span> of{" "}
            <span className="font-semibold text-foreground">{stats.total}</span> tenants
          </p>
        </div>

        {/* Tenant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        </div>
      </footer>
    </div>
  );
};

export default Index;
