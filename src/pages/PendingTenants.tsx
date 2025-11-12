import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackToHome } from "@/components/BackToHome";
import { WelileLogo } from "@/components/WelileLogo";
import { usePendingTenants } from "@/hooks/usePendingTenants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Search,
  Phone,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

const PendingTenants = () => {
  const navigate = useNavigate();
  const { data: tenants, isLoading } = usePendingTenants();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingTenant, setUpdatingTenant] = useState<string | null>(null);

  const filteredTenants = tenants?.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contact.includes(searchTerm)
  );

  const handleStatusUpdate = async (tenantId: string, newStatus: string) => {
    setUpdatingTenant(tenantId);

    try {
      const { error } = await supabase
        .from("tenants")
        .update({ 
          status: newStatus,
          edited_at: new Date().toISOString(),
          edited_by: "Admin"
        })
        .eq("id", tenantId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Tenant status changed to ${newStatus}`,
      });

      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["pending-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tenants-count"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update tenant status",
        variant: "destructive",
      });
    } finally {
      setUpdatingTenant(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "under_review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <BackToHome />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <WelileLogo />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
            <Clock className="h-10 w-10 text-orange-600" />
            Pending Tenants
          </h1>
          <p className="text-lg text-muted-foreground">
            Review and update tenant statuses
          </p>
        </div>

        {/* Stats Card */}
        <Card className="mb-6 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pending Tenants</p>
                <p className="text-4xl font-bold text-orange-600">
                  {tenants?.length || 0}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Tenants List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Tenants Awaiting Review
            </CardTitle>
            <CardDescription>
              Click on status dropdown to approve, review, or keep as pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredTenants && filteredTenants.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead className="text-center">Change Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <Link 
                            to={`/tenant/${tenant.id}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group"
                          >
                            <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-medium underline-offset-4 group-hover:underline">{tenant.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {tenant.contact}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {tenant.location_district || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{tenant.agent_name || "Unassigned"}</div>
                            {tenant.agent_phone && (
                              <div className="text-xs text-muted-foreground">{tenant.agent_phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tenant.created_at), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(tenant.status)}>
                            {tenant.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {tenant.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tenant.status}
                            onValueChange={(value) => handleStatusUpdate(tenant.id, value)}
                            disabled={updatingTenant === tenant.id}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                  <span>Keep Pending</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="under_review">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  <span>Under Review</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span>Approve → Active</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/tenant/${tenant.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                <p className="text-muted-foreground mb-6">
                  No pending tenants at the moment. All tenants have been reviewed.
                </p>
                <Button onClick={() => navigate("/")}>
                  Back to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Status Definitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-600">Pending</p>
                  <p className="text-muted-foreground">
                    Newly added, awaiting initial review
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-600">Under Review</p>
                  <p className="text-muted-foreground">
                    Being verified, requires additional checks
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-600">Active</p>
                  <p className="text-muted-foreground">
                    Approved and fully operational
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingTenants;
