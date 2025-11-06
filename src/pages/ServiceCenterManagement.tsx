import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Power, 
  Search,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowLeftRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schema
const serviceCenterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  district: z.string().trim().min(2, "District is required").max(100, "District must be less than 100 characters"),
  region: z.enum(["Central", "Eastern", "Northern", "Western"], {
    errorMap: () => ({ message: "Please select a valid region" })
  }),
});

type ServiceCenterFormData = z.infer<typeof serviceCenterSchema>;

interface ServiceCenter {
  id: string;
  name: string;
  district: string;
  region: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ServiceCenterManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingCenter, setEditingCenter] = useState<ServiceCenter | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState<ServiceCenterFormData>({
    name: "",
    district: "",
    region: "Central",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ServiceCenterFormData, string>>>({});

  // Fetch all service centers
  const { data: serviceCenters, isLoading } = useQuery({
    queryKey: ["serviceCentersManagement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_centers")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as ServiceCenter[];
    },
  });

  // Add service center mutation
  const addMutation = useMutation({
    mutationFn: async (data: ServiceCenterFormData) => {
      const { error } = await supabase
        .from("service_centers")
        .insert({
          name: data.name,
          district: data.district,
          region: data.region,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceCentersManagement"] });
      queryClient.invalidateQueries({ queryKey: ["serviceCenters"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Service center added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add service center",
        variant: "destructive",
      });
    },
  });

  // Update service center mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceCenterFormData> }) => {
      const { error } = await supabase
        .from("service_centers")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceCentersManagement"] });
      queryClient.invalidateQueries({ queryKey: ["serviceCenters"] });
      setIsEditDialogOpen(false);
      setEditingCenter(null);
      resetForm();
      toast({
        title: "Success",
        description: "Service center updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service center",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("service_centers")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceCentersManagement"] });
      queryClient.invalidateQueries({ queryKey: ["serviceCenters"] });
      toast({
        title: "Success",
        description: "Service center status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const validateForm = (data: ServiceCenterFormData): boolean => {
    try {
      serviceCenterSchema.parse(data);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof ServiceCenterFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof ServiceCenterFormData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleAdd = () => {
    if (!validateForm(formData)) return;
    addMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!editingCenter) return;
    if (!validateForm(formData)) return;
    updateMutation.mutate({ id: editingCenter.id, data: formData });
  };

  const handleToggleActive = (center: ServiceCenter) => {
    toggleActiveMutation.mutate({ id: center.id, isActive: center.is_active });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      district: "",
      region: "Central",
    });
    setFormErrors({});
  };

  const openEditDialog = (center: ServiceCenter) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      district: center.district,
      region: center.region as "Central" | "Eastern" | "Northern" | "Western",
    });
    setIsEditDialogOpen(true);
  };

  // Filter service centers
  const filteredCenters = serviceCenters?.filter((center) => {
    const matchesSearch = 
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = filterRegion === "all" || center.region === filterRegion;
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && center.is_active) ||
      (filterStatus === "inactive" && !center.is_active);
    
    return matchesSearch && matchesRegion && matchesStatus;
  });

  const activeCount = serviceCenters?.filter(c => c.is_active).length || 0;
  const inactiveCount = serviceCenters?.filter(c => !c.is_active).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading service centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-primary" />
                  Service Center Management
                </h1>
                <p className="text-sm text-muted-foreground">Manage service center locations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/service-center-transfer-analytics')}
                className="gap-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Transfer Analytics
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service Center
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Service Center</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new service center
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Center Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter service center name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={formErrors.name ? "border-destructive" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-destructive">{formErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Input
                      id="district"
                      placeholder="Enter district"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className={formErrors.district ? "border-destructive" : ""}
                    />
                    {formErrors.district && (
                      <p className="text-sm text-destructive">{formErrors.district}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region *</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value: any) => setFormData({ ...formData, region: value })}
                    >
                      <SelectTrigger className={formErrors.region ? "border-destructive" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Central">Central</SelectItem>
                        <SelectItem value="Eastern">Eastern</SelectItem>
                        <SelectItem value="Northern">Northern</SelectItem>
                        <SelectItem value="Western">Western</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.region && (
                      <p className="text-sm text-destructive">{formErrors.region}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={addMutation.isPending}>
                    {addMutation.isPending ? "Adding..." : "Add Service Center"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Centers</p>
                  <p className="text-2xl font-bold">{serviceCenters?.length || 0}</p>
                </div>
                <Building2 className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Centers</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive Centers</p>
                  <p className="text-2xl font-bold text-muted-foreground">{inactiveCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter service centers by region, status, or search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or district..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="Central">Central</SelectItem>
                    <SelectItem value="Eastern">Eastern</SelectItem>
                    <SelectItem value="Northern">Northern</SelectItem>
                    <SelectItem value="Western">Western</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Centers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Service Centers ({filteredCenters?.length || 0})</CardTitle>
            <CardDescription>Manage all service center locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">District</th>
                    <th className="text-left py-3 px-4 font-semibold">Region</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCenters?.map((center) => (
                    <tr key={center.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">{center.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{center.district}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{center.region}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={center.is_active ? "default" : "secondary"}>
                          {center.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(center)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={center.is_active ? "destructive" : "default"}
                            onClick={() => handleToggleActive(center)}
                            disabled={toggleActiveMutation.isPending}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCenters?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No service centers found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service Center</DialogTitle>
              <DialogDescription>
                Update the service center details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Service Center Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter service center name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-district">District *</Label>
                <Input
                  id="edit-district"
                  placeholder="Enter district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className={formErrors.district ? "border-destructive" : ""}
                />
                {formErrors.district && (
                  <p className="text-sm text-destructive">{formErrors.district}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-region">Region *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value: any) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger className={formErrors.region ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Central">Central</SelectItem>
                    <SelectItem value="Eastern">Eastern</SelectItem>
                    <SelectItem value="Northern">Northern</SelectItem>
                    <SelectItem value="Western">Western</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.region && (
                  <p className="text-sm text-destructive">{formErrors.region}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Service Center"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
