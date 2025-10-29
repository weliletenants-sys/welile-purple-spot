import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import { Tenant, calculateRepaymentDetails } from "@/data/tenants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAgents } from "@/hooks/useAgents";

interface EditTenantFormProps {
  tenant: Tenant;
  children?: React.ReactNode;
}

interface TenantFormData {
  name: string;
  contact: string;
  address: string;
  status: 'active' | 'pending' | 'review' | 'cleared' | 'overdue';
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'cleared';
  landlord: string;
  landlordContact: string;
  rentAmount: string;
  registrationFee: string;
  accessFee: string;
  repaymentDays: string;
  guarantor1Name: string;
  guarantor1Contact: string;
  guarantor2Name: string;
  guarantor2Contact: string;
  locationCountry: string;
  locationCounty: string;
  locationDistrict: string;
  locationSubcountyOrWard: string;
  locationCellOrVillage: string;
  agentName: string;
  agentPhone: string;
  editorName: string;
}

export const EditTenantForm = ({ tenant, children }: EditTenantFormProps) => {
  const { toast } = useToast();
  const { updateTenant } = useTenants();
  const { data: agents = [] } = useAgents();
  const [open, setOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Check if tenant's agent is in the approved list, if not default to MUHWEZI MARTIN
  const isAgentValid = agents.some(agent => agent.name === tenant.agentName);
  const validAgentName = isAgentValid ? tenant.agentName : "MUHWEZI MARTIN";

  const [formData, setFormData] = useState<TenantFormData>({
    name: tenant.name,
    contact: tenant.contact,
    address: tenant.address,
    status: tenant.status,
    paymentStatus: tenant.paymentStatus,
    landlord: tenant.landlord,
    landlordContact: tenant.landlordContact,
    rentAmount: tenant.rentAmount.toString(),
    registrationFee: tenant.registrationFee.toString(),
    accessFee: tenant.accessFee.toString(),
    repaymentDays: tenant.repaymentDays.toString(),
    guarantor1Name: tenant.guarantor1?.name || "",
    guarantor1Contact: tenant.guarantor1?.contact || "",
    guarantor2Name: tenant.guarantor2?.name || "",
    guarantor2Contact: tenant.guarantor2?.contact || "",
    locationCountry: tenant.location?.country || "",
    locationCounty: tenant.location?.county || "",
    locationDistrict: tenant.location?.district || "",
    locationSubcountyOrWard: tenant.location?.subcountyOrWard || "",
    locationCellOrVillage: tenant.location?.cellOrVillage || "",
    agentName: validAgentName || "",
    agentPhone: tenant.agentPhone || "",
    editorName: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TenantFormData, string>>>({});

  // Calculate repayment details whenever rent amount or repayment days change
  useMemo(() => {
    const rentAmount = parseFloat(formData.rentAmount);
    const repaymentDays = parseInt(formData.repaymentDays);
    
    if (!isNaN(rentAmount) && rentAmount > 0 && repaymentDays) {
      const details = calculateRepaymentDetails(rentAmount, repaymentDays);
      // Always auto-update registration and access fees to match calculation
      setFormData(prev => ({ 
        ...prev, 
        registrationFee: details.registrationFee.toString(),
        accessFee: details.accessFees.toString()
      }));
      return details;
    }
    return null;
  }, [formData.rentAmount, formData.repaymentDays]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof TenantFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.contact.trim()) newErrors.contact = "Contact is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.landlord.trim()) newErrors.landlord = "Landlord name is required";
    if (!formData.landlordContact.trim()) newErrors.landlordContact = "Landlord contact is required";
    if (!formData.rentAmount || Number(formData.rentAmount) <= 0) {
      newErrors.rentAmount = "Valid rent amount is required";
    }
    if (!formData.editorName.trim()) newErrors.editorName = "Please enter your name";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForDuplicates = async () => {
    // Check for duplicate by contact (excluding current tenant)
    const { data: contactMatch } = await supabase
      .from("tenants")
      .select("id, name, contact, address")
      .eq("contact", formData.contact.trim())
      .neq("id", tenant.id)
      .maybeSingle();

    if (contactMatch) {
      return `Another tenant with contact number "${formData.contact}" already exists: ${contactMatch.name} at ${contactMatch.address}`;
    }

    // Check for duplicate by name (excluding current tenant)
    const { data: nameMatch } = await supabase
      .from("tenants")
      .select("id, name, contact, address")
      .ilike("name", formData.name.trim())
      .neq("id", tenant.id)
      .maybeSingle();

    if (nameMatch) {
      return `Another tenant with name "${formData.name}" already exists with contact: ${nameMatch.contact}`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    const duplicateMessage = await checkForDuplicates();
    if (duplicateMessage) {
      setDuplicateWarning(duplicateMessage);
      toast({
        title: "Duplicate Tenant Detected",
        description: duplicateMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTenant({
        id: tenant.id,
        updates: {
          name: formData.name,
          contact: formData.contact,
          address: formData.address,
          status: formData.status,
          paymentStatus: formData.paymentStatus,
          landlord: formData.landlord,
          landlordContact: formData.landlordContact,
          rentAmount: Number(formData.rentAmount),
          registrationFee: Number(formData.registrationFee),
          accessFee: Number(formData.accessFee),
          repaymentDays: Number(formData.repaymentDays) as 30 | 60 | 90,
          guarantor1: formData.guarantor1Name
            ? {
                name: formData.guarantor1Name,
                contact: formData.guarantor1Contact,
              }
            : undefined,
          guarantor2: formData.guarantor2Name
            ? {
                name: formData.guarantor2Name,
                contact: formData.guarantor2Contact,
              }
            : undefined,
          location: {
            country: formData.locationCountry,
            county: formData.locationCounty,
            district: formData.locationDistrict,
            subcountyOrWard: formData.locationSubcountyOrWard,
            cellOrVillage: formData.locationCellOrVillage,
          },
          agentName: formData.agentName,
          agentPhone: formData.agentPhone,
          editedBy: formData.editorName.trim(),
          editedAt: new Date().toISOString(),
        },
      });

      toast({
        title: "Success",
        description: "Tenant updated successfully!",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast({
        title: "Error",
        description: "Failed to update tenant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: keyof TenantFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Clear duplicate warning when user changes contact or name
    if ((field === "contact" || field === "name") && duplicateWarning) {
      setDuplicateWarning(null);
    }
  };

  const handleAgentChange = (agentName: string) => {
    const selectedAgent = agents.find(agent => agent.name === agentName);
    setFormData(prev => ({
      ...prev,
      agentName,
      agentPhone: selectedAgent?.phone || prev.agentPhone,
    }));
    if (errors.agentName) {
      setErrors(prev => ({ ...prev, agentName: undefined }));
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duplicate Warning */}
          {duplicateWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}
          
          {/* Editor Name - Required */}
          <div className="space-y-2 border-2 border-primary/30 rounded-lg p-4 bg-primary/5">
            <Label htmlFor="editorName" className="text-base font-semibold">
              Your Name * <span className="text-sm font-normal text-muted-foreground">(Required to save changes)</span>
            </Label>
            <Input
              id="editorName"
              placeholder="Enter your full name"
              value={formData.editorName}
              onChange={(e) => handleChange("editorName", e.target.value)}
              className={errors.editorName ? "border-destructive" : ""}
            />
            {errors.editorName && <p className="text-sm text-destructive mt-1">{errors.editorName}</p>}
          </div>
          
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="contact">Contact *</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  className={errors.contact ? "border-destructive" : ""}
                />
                {errors.contact && <p className="text-sm text-destructive mt-1">{errors.contact}</p>}
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={formData.paymentStatus} onValueChange={(value) => handleChange("paymentStatus", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Landlord Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Landlord Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="landlord">Landlord Name *</Label>
                <Input
                  id="landlord"
                  value={formData.landlord}
                  onChange={(e) => handleChange("landlord", e.target.value)}
                  className={errors.landlord ? "border-destructive" : ""}
                />
                {errors.landlord && <p className="text-sm text-destructive mt-1">{errors.landlord}</p>}
              </div>
              <div>
                <Label htmlFor="landlordContact">Landlord Contact *</Label>
                <Input
                  id="landlordContact"
                  value={formData.landlordContact}
                  onChange={(e) => handleChange("landlordContact", e.target.value)}
                  className={errors.landlordContact ? "border-destructive" : ""}
                />
                {errors.landlordContact && <p className="text-sm text-destructive mt-1">{errors.landlordContact}</p>}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rentAmount">Rent Amount (UGX) *</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) => handleChange("rentAmount", e.target.value)}
                  className={errors.rentAmount ? "border-destructive" : ""}
                />
                {errors.rentAmount && <p className="text-sm text-destructive mt-1">{errors.rentAmount}</p>}
              </div>
              <div>
                <Label htmlFor="repaymentDays">Repayment Days</Label>
                <Select value={formData.repaymentDays} onValueChange={(value) => handleChange("repaymentDays", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="registrationFee">Registration Fee (UGX)</Label>
                <Input
                  id="registrationFee"
                  type="number"
                  value={formData.registrationFee}
                  className="bg-muted"
                  readOnly
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-calculated based on rent amount</p>
              </div>
              <div>
                <Label htmlFor="accessFee">Access Fee (UGX)</Label>
                <Input
                  id="accessFee"
                  type="number"
                  value={formData.accessFee}
                  className="bg-muted"
                  readOnly
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-calculated with compound interest</p>
              </div>
            </div>
          </div>

          {/* Guarantor Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Guarantor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guarantor1Name">Guarantor 1 Name</Label>
                <Input
                  id="guarantor1Name"
                  value={formData.guarantor1Name}
                  onChange={(e) => handleChange("guarantor1Name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guarantor1Contact">Guarantor 1 Contact</Label>
                <Input
                  id="guarantor1Contact"
                  value={formData.guarantor1Contact}
                  onChange={(e) => handleChange("guarantor1Contact", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guarantor2Name">Guarantor 2 Name</Label>
                <Input
                  id="guarantor2Name"
                  value={formData.guarantor2Name}
                  onChange={(e) => handleChange("guarantor2Name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guarantor2Contact">Guarantor 2 Contact</Label>
                <Input
                  id="guarantor2Contact"
                  value={formData.guarantor2Contact}
                  onChange={(e) => handleChange("guarantor2Contact", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Location Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="locationCellOrVillage">Cell / Village</Label>
                <Input
                  id="locationCellOrVillage"
                  value={formData.locationCellOrVillage}
                  onChange={(e) => handleChange("locationCellOrVillage", e.target.value)}
                  placeholder="Enter cell or village name"
                />
              </div>
              <div>
                <Label htmlFor="locationSubcountyOrWard">Subcounty / Ward</Label>
                <Input
                  id="locationSubcountyOrWard"
                  value={formData.locationSubcountyOrWard}
                  onChange={(e) => handleChange("locationSubcountyOrWard", e.target.value)}
                  placeholder="Enter subcounty or ward"
                />
              </div>
              <div>
                <Label htmlFor="locationDistrict">District</Label>
                <Input
                  id="locationDistrict"
                  value={formData.locationDistrict}
                  onChange={(e) => handleChange("locationDistrict", e.target.value)}
                  placeholder="Enter district"
                />
              </div>
              <div>
                <Label htmlFor="locationCounty">County</Label>
                <Input
                  id="locationCounty"
                  value={formData.locationCounty}
                  onChange={(e) => handleChange("locationCounty", e.target.value)}
                  placeholder="Enter county"
                />
              </div>
              <div>
                <Label htmlFor="locationCountry">Country</Label>
                <Input
                  id="locationCountry"
                  value={formData.locationCountry}
                  onChange={(e) => handleChange("locationCountry", e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          {/* Agent Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Agent Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agentName">Agent Name</Label>
                <Select value={formData.agentName} onValueChange={handleAgentChange}>
                  <SelectTrigger id="agentName">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.name} value={agent.name}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="agentPhone">Agent Phone</Label>
                <Input
                  id="agentPhone"
                  value={formData.agentPhone}
                  onChange={(e) => handleChange("agentPhone", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Update Tenant
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
