import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WelileLogo } from "@/components/WelileLogo";
import { LandlordGroupedExport } from "@/components/LandlordGroupedExport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Building2, Users, DollarSign, TrendingUp, Phone, MapPin, CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface LandlordData {
  landlordName: string;
  landlordContact: string;
  totalProperties: number;
  activeTenants: number;
  pendingTenants: number;
  pipelineTenants: number;
  overdueOrReviewTenants: number;
  totalMonthlyRent: number;
  serviceCenters: string[];
  tenantDetails: Array<{
    name: string;
    contact: string;
    address: string;
    status: string;
    rentAmount: number;
    serviceCenter: string;
  }>;
}

export default function LandlordManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLandlord, setExpandedLandlord] = useState<string | null>(null);

  // Fetch all tenants
  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants-for-landlords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("name, contact, address, landlord, landlord_contact, rent_amount, status, service_center")
        .order("landlord_contact");

      if (error) throw error;
      return data || [];
    },
  });

  // Group tenants by landlord
  const landlordData = useMemo<LandlordData[]>(() => {
    if (!tenants) return [];

    const landlordMap = new Map<string, LandlordData>();

    tenants.forEach((tenant) => {
      const key = tenant.landlord_contact || "No Contact";
      
      if (!landlordMap.has(key)) {
        landlordMap.set(key, {
          landlordName: tenant.landlord || "Unknown Landlord",
          landlordContact: tenant.landlord_contact || "No Contact",
          totalProperties: 0,
          activeTenants: 0,
          pendingTenants: 0,
          pipelineTenants: 0,
          overdueOrReviewTenants: 0,
          totalMonthlyRent: 0,
          serviceCenters: [],
          tenantDetails: [],
        });
      }

      const landlord = landlordMap.get(key)!;
      landlord.totalProperties++;
      landlord.totalMonthlyRent += Number(tenant.rent_amount) || 0;

      // Count by status
      if (tenant.status === "active") landlord.activeTenants++;
      else if (tenant.status === "pending") landlord.pendingTenants++;
      else if (tenant.status === "pipeline") landlord.pipelineTenants++;
      else if (tenant.status === "overdue" || tenant.status === "review") landlord.overdueOrReviewTenants++;

      // Track service centers
      if (tenant.service_center && !landlord.serviceCenters.includes(tenant.service_center)) {
        landlord.serviceCenters.push(tenant.service_center);
      }

      // Add tenant details
      landlord.tenantDetails.push({
        name: tenant.name,
        contact: tenant.contact,
        address: tenant.address,
        status: tenant.status,
        rentAmount: Number(tenant.rent_amount) || 0,
        serviceCenter: tenant.service_center || "N/A",
      });
    });

    // Convert to array and sort by property count
    return Array.from(landlordMap.values()).sort(
      (a, b) => b.totalProperties - a.totalProperties
    );
  }, [tenants]);

  // Filter landlords by search term
  const filteredLandlords = useMemo(() => {
    if (!searchTerm.trim()) return landlordData;

    const term = searchTerm.toLowerCase();
    return landlordData.filter(
      (landlord) =>
        landlord.landlordName.toLowerCase().includes(term) ||
        landlord.landlordContact.includes(term) ||
        landlord.serviceCenters.some((sc) => sc.toLowerCase().includes(term))
    );
  }, [landlordData, searchTerm]);

  // Calculate summary stats
  const stats = useMemo(() => {
    return {
      totalLandlords: landlordData.length,
      totalProperties: landlordData.reduce((sum, l) => sum + l.totalProperties, 0),
      avgPropertiesPerLandlord: landlordData.length > 0 
        ? (landlordData.reduce((sum, l) => sum + l.totalProperties, 0) / landlordData.length).toFixed(1)
        : 0,
      totalMonthlyRent: landlordData.reduce((sum, l) => sum + l.totalMonthlyRent, 0),
      landlordsWithMultipleProperties: landlordData.filter((l) => l.totalProperties > 1).length,
    };
  }, [landlordData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <WelileLogo />
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Building2 className="h-8 w-8 text-primary" />
                  Landlord Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage and monitor landlord portfolios
                </p>
              </div>
            </div>
          </div>
          <LandlordGroupedExport />
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Total Landlords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLandlords}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Total Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Avg Properties/Landlord
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgPropertiesPerLandlord}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Total Monthly Rent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                UGX {stats.totalMonthlyRent.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Multiple Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.landlordsWithMultipleProperties}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Landlords</CardTitle>
            <CardDescription>
              Search by landlord name, contact number, or service center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search landlords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-muted-foreground">
                Found {filteredLandlords.length} landlord(s) matching "{searchTerm}"
              </p>
            )}
          </CardContent>
        </Card>

        {/* Landlords Table */}
        <Card>
          <CardHeader>
            <CardTitle>Landlords Overview</CardTitle>
            <CardDescription>
              Click on any row to view detailed tenant information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Landlord Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Properties</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Pipeline</TableHead>
                    <TableHead className="text-center">At Risk</TableHead>
                    <TableHead className="text-right">Monthly Rent</TableHead>
                    <TableHead>Service Centers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLandlords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No landlords found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLandlords.map((landlord) => (
                      <>
                        <TableRow
                          key={landlord.landlordContact}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            setExpandedLandlord(
                              expandedLandlord === landlord.landlordContact
                                ? null
                                : landlord.landlordContact
                            )
                          }
                        >
                          <TableCell className="font-medium">
                            {landlord.landlordName}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {landlord.landlordContact}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-bold">
                              {landlord.totalProperties}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default" className="bg-green-600">
                              {landlord.activeTenants}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {landlord.pendingTenants}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              {landlord.pipelineTenants}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {landlord.overdueOrReviewTenants > 0 ? (
                              <Badge variant="destructive">
                                {landlord.overdueOrReviewTenants}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                0
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            UGX {landlord.totalMonthlyRent.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {landlord.serviceCenters.slice(0, 2).map((sc) => (
                                <Badge key={sc} variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {sc}
                                </Badge>
                              ))}
                              {landlord.serviceCenters.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{landlord.serviceCenters.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedLandlord === landlord.landlordContact && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/30">
                              <div className="p-4 space-y-3">
                                <h4 className="font-semibold text-sm mb-3">
                                  Tenant Details for {landlord.landlordName}
                                </h4>
                                <div className="grid gap-2">
                                  {landlord.tenantDetails.map((tenant, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3 bg-card rounded-lg border text-sm"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">{tenant.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {tenant.address}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-xs text-muted-foreground">
                                          {tenant.contact}
                                        </div>
                                        <Badge
                                          variant={
                                            tenant.status === "active"
                                              ? "default"
                                              : tenant.status === "pipeline"
                                              ? "outline"
                                              : "secondary"
                                          }
                                        >
                                          {tenant.status}
                                        </Badge>
                                        <div className="font-bold min-w-[120px] text-right">
                                          UGX {tenant.rentAmount.toLocaleString()}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {tenant.serviceCenter}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
