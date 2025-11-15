import { useState, useMemo, useEffect } from "react";
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
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";

interface EditTenantFormProps {
  tenant: Tenant;
  children?: React.ReactNode;
}

interface TenantFormData {
  name: string;
  contact: string;
  address: string;
  status: 'active' | 'pending' | 'review' | 'cleared' | 'overdue' | 'pipeline';
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
  serviceCenter: string;
}

export const EditTenantForm = ({ tenant, children }: EditTenantFormProps) => {
  const { toast } = useToast();
  const { updateTenant } = useTenants();
  const { data: agents = [] } = useAgents();
  const { data: serviceCenters = [] } = useServiceCenters();
  const [open, setOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Character limits for text fields
  const CHARACTER_LIMITS = {
    name: 100,
    address: 200,
    landlord: 100,
    guarantor1Name: 100,
    guarantor2Name: 100,
  } as const;

  // Phone validation state
  const [phoneValidation, setPhoneValidation] = useState({
    contact: { isValid: true, message: "" },
    agentPhone: { isValid: true, message: "" },
    landlordContact: { isValid: true, message: "" },
    guarantor1Contact: { isValid: true, message: "" },
    guarantor2Contact: { isValid: true, message: "" },
  });

  // Landlord duplicate detection
  const [realtimeLandlordDuplicates, setRealtimeLandlordDuplicates] = useState<Array<{
    name: string;
    landlord: string;
    address: string;
  }>>([]);
  const [isCheckingLandlordDuplicate, setIsCheckingLandlordDuplicate] = useState(false);

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
    serviceCenter: tenant.serviceCenter || "",
    editorName: "",
  });

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

  // Phone validation function
  const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {
    if (!phone.trim()) {
      return { isValid: true, message: "" }; // Empty is ok, required validation handles this
    }
    
    if (phone.length < 10) {
      return { isValid: false, message: "Phone number must be 10 digits" };
    }
    
    if (phone.length > 10) {
      return { isValid: false, message: "Phone number cannot exceed 10 digits" };
    }
    
    if (!phone.startsWith("0")) {
      return { isValid: false, message: "Phone number must start with 0" };
    }
    
    if (!/^\d+$/.test(phone)) {
      return { isValid: false, message: "Phone number must contain only digits" };
    }
    
    return { isValid: true, message: "" };
  };

  // Check if any required phone field is invalid
  const hasInvalidPhoneNumber = () => {
    // Contact is always required
    if (!phoneValidation.contact.isValid && formData.contact.trim()) return true;
    
    // Agent phone is required
    if (!phoneValidation.agentPhone.isValid && formData.agentPhone.trim()) return true;
    
    // Landlord contact is required
    if (!phoneValidation.landlordContact.isValid && formData.landlordContact.trim()) return true;
    
    // Guarantor contacts are optional but must be valid if provided
    if (formData.guarantor1Contact.trim() && !phoneValidation.guarantor1Contact.isValid) return true;
    if (formData.guarantor2Contact.trim() && !phoneValidation.guarantor2Contact.isValid) return true;
    
    return false;
  };

  // Real-time landlord contact duplicate detection with debouncing
  useEffect(() => {
    if (!open || !formData.landlordContact.trim() || formData.landlordContact.trim().length < 10) {
      setRealtimeLandlordDuplicates([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingLandlordDuplicate(true);
      try {
        const { data: landlordMatches, error } = await supabase
          .from("tenants")
          .select("name, landlord, address")
          .eq("landlord_contact", formData.landlordContact.trim())
          .neq("id", tenant.id) // Exclude current tenant
          .limit(5);

        if (error) {
          console.error("Error checking for landlord duplicates:", error);
        } else if (landlordMatches && landlordMatches.length > 0) {
          setRealtimeLandlordDuplicates(landlordMatches);
        } else {
          setRealtimeLandlordDuplicates([]);
        }
      } catch (error) {
        console.error("Error checking for landlord duplicates:", error);
      } finally {
        setIsCheckingLandlordDuplicate(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.landlordContact, open, tenant.id]);


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

    // Validate editor name
    if (!formData.editorName.trim()) {
      toast({
        title: "Editor Name Required",
        description: "Please enter your name to save changes",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const missingFields = [];
    if (!formData.name.trim()) missingFields.push("Name");
    if (!formData.contact.trim()) missingFields.push("Contact");
    if (!formData.address.trim()) missingFields.push("Address");
    if (!formData.rentAmount || parseFloat(formData.rentAmount) <= 0) missingFields.push("Rent Amount");
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    try {
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
    } catch (error) {
      console.error("Error checking duplicates:", error);
      toast({
        title: "Warning",
        description: "Could not check for duplicates. Proceeding with caution.",
        variant: "default",
      });
    }

    try {
      console.log("Updating tenant:", tenant.id, formData);
      await updateTenant({
        id: tenant.id,
        updates: {
          name: formData.name.trim(),
          contact: formData.contact.trim(),
          address: formData.address.trim(),
          status: formData.status,
          paymentStatus: formData.paymentStatus,
          landlord: formData.landlord.trim(),
          landlordContact: formData.landlordContact.trim(),
          rentAmount: Number(formData.rentAmount),
          registrationFee: Number(formData.registrationFee),
          accessFee: Number(formData.accessFee),
          repaymentDays: Number(formData.repaymentDays) as 30 | 60 | 90,
          guarantor1: formData.guarantor1Name.trim()
            ? {
                name: formData.guarantor1Name.trim(),
                contact: formData.guarantor1Contact.trim(),
              }
            : undefined,
          guarantor2: formData.guarantor2Name.trim()
            ? {
                name: formData.guarantor2Name.trim(),
                contact: formData.guarantor2Contact.trim(),
              }
            : undefined,
          location: {
            country: formData.locationCountry.trim(),
            county: formData.locationCounty.trim(),
            district: formData.locationDistrict.trim(),
            subcountyOrWard: formData.locationSubcountyOrWard.trim(),
            cellOrVillage: formData.locationCellOrVillage.trim(),
          },
          agentName: formData.agentName.trim(),
          agentPhone: formData.agentPhone.trim(),
          serviceCenter: formData.serviceCenter.trim(),
          editedBy: formData.editorName.trim(),
          editedAt: new Date().toISOString(),
        },
      });

      toast({
        title: "✅ Success!",
        description: "Tenant updated successfully!",
      });

      setOpen(false);
      setDuplicateWarning(null);
    } catch (error: any) {
      console.error("Error updating tenant:", error);
      toast({
        title: "❌ Error Updating Tenant",
        description: error.message || "Failed to update tenant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: keyof TenantFormData, value: string) => {
    // Enforce character limits for text fields
    const limitedFields = ["name", "address", "landlord", "guarantor1Name", "guarantor2Name"] as const;
    let finalValue = value;
    
    if (limitedFields.includes(field as any)) {
      const limit = CHARACTER_LIMITS[field as keyof typeof CHARACTER_LIMITS];
      if (limit && value.length > limit) {
        finalValue = value.slice(0, limit);
      }
    }
    
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    
    // Validate phone number fields in real-time
    const phoneFields = ["contact", "agentPhone", "landlordContact", "guarantor1Contact", "guarantor2Contact"];
    if (phoneFields.includes(field)) {
      const validation = validatePhoneNumber(finalValue);
      setPhoneValidation(prev => ({
        ...prev,
        [field]: validation
      }));
    }
    
    // Clear duplicate warning when user changes contact or name
    if ((field === "contact" || field === "name") && duplicateWarning) {
      setDuplicateWarning(null);
    }
    // Clear realtime landlord duplicates when landlord contact changes
    if (field === "landlordContact" && realtimeLandlordDuplicates.length > 0) {
      setRealtimeLandlordDuplicates([]);
    }
  };

  const handleAgentChange = (agentName: string) => {
    const selectedAgent = agents.find(agent => agent.name === agentName);
    setFormData(prev => ({
      ...prev,
      agentName,
      agentPhone: selectedAgent?.phone || prev.agentPhone,
    }));
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
            />
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
                  maxLength={CHARACTER_LIMITS.name}
                />
                <p className={`text-xs ${formData.name.length >= CHARACTER_LIMITS.name ? "text-destructive" : "text-muted-foreground"}`}>
                  {CHARACTER_LIMITS.name - formData.name.length} characters remaining
                </p>
              </div>
              <div>
                <Label htmlFor="contact">Contact *</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  className={!phoneValidation.contact.isValid ? "border-destructive" : ""}
                  maxLength={10}
                />
                {!phoneValidation.contact.isValid && formData.contact.trim() && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {phoneValidation.contact.message}
                  </p>
                )}
                {phoneValidation.contact.isValid && formData.contact.trim() && formData.contact.length === 10 && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span className="text-green-600">✓</span>
                    Valid phone number
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  maxLength={CHARACTER_LIMITS.address}
                />
                <p className={`text-xs ${formData.address.length >= CHARACTER_LIMITS.address ? "text-destructive" : "text-muted-foreground"}`}>
                  {CHARACTER_LIMITS.address - formData.address.length} characters remaining
                </p>
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
                  maxLength={CHARACTER_LIMITS.landlord}
                />
                <p className={`text-xs ${formData.landlord.length >= CHARACTER_LIMITS.landlord ? "text-destructive" : "text-muted-foreground"}`}>
                  {CHARACTER_LIMITS.landlord - formData.landlord.length} characters remaining
                </p>
              </div>
              <div>
                <Label htmlFor="landlordContact">Landlord Contact *</Label>
                <Input
                  id="landlordContact"
                  value={formData.landlordContact}
                  onChange={(e) => handleChange("landlordContact", e.target.value)}
                  placeholder="e.g., 0700000000"
                  className={
                    realtimeLandlordDuplicates.length > 0 ? "border-blue-500" :
                    !phoneValidation.landlordContact.isValid ? "border-destructive" : ""
                  }
                  maxLength={10}
                />
                {!phoneValidation.landlordContact.isValid && formData.landlordContact.trim() && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {phoneValidation.landlordContact.message}
                  </p>
                )}
                {phoneValidation.landlordContact.isValid && formData.landlordContact.trim() && formData.landlordContact.length === 10 && !isCheckingLandlordDuplicate && realtimeLandlordDuplicates.length === 0 && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span className="text-green-600">✓</span>
                    Valid phone number
                  </p>
                )}
                {isCheckingLandlordDuplicate && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Checking for existing landlords...
                  </p>
                )}
                {realtimeLandlordDuplicates.length > 0 && !isCheckingLandlordDuplicate && (
                  <Alert variant="default" className="mt-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Landlord Already Registered:</strong> This landlord contact is associated with {realtimeLandlordDuplicates.length} other tenant{realtimeLandlordDuplicates.length > 1 ? 's' : ''}:
                      <ul className="mt-1 space-y-1 text-sm">
                        {realtimeLandlordDuplicates.slice(0, 3).map((duplicate, index) => (
                          <li key={index}>
                            <span className="font-semibold">{duplicate.name}</span> - Landlord: {duplicate.landlord} ({duplicate.address})
                          </li>
                        ))}
                        {realtimeLandlordDuplicates.length > 3 && (
                          <li className="text-xs italic">...and {realtimeLandlordDuplicates.length - 3} more</li>
                        )}
                      </ul>
                      <p className="mt-2 text-xs">This is informational - same landlord can have multiple tenants.</p>
                    </AlertDescription>
                  </Alert>
                )}
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
                />
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
                  maxLength={CHARACTER_LIMITS.guarantor1Name}
                />
                <p className={`text-xs ${formData.guarantor1Name.length >= CHARACTER_LIMITS.guarantor1Name ? "text-destructive" : "text-muted-foreground"}`}>
                  {CHARACTER_LIMITS.guarantor1Name - formData.guarantor1Name.length} characters remaining
                </p>
              </div>
              <div>
                <Label htmlFor="guarantor1Contact">Guarantor 1 Contact</Label>
                <Input
                  id="guarantor1Contact"
                  value={formData.guarantor1Contact}
                  onChange={(e) => handleChange("guarantor1Contact", e.target.value)}
                  placeholder="e.g., 0700000000"
                  className={!phoneValidation.guarantor1Contact.isValid ? "border-destructive" : ""}
                  maxLength={10}
                />
                {!phoneValidation.guarantor1Contact.isValid && formData.guarantor1Contact.trim() && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {phoneValidation.guarantor1Contact.message}
                  </p>
                )}
                {phoneValidation.guarantor1Contact.isValid && formData.guarantor1Contact.trim() && formData.guarantor1Contact.length === 10 && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span className="text-green-600">✓</span>
                    Valid phone number
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="guarantor2Name">Guarantor 2 Name</Label>
                <Input
                  id="guarantor2Name"
                  value={formData.guarantor2Name}
                  onChange={(e) => handleChange("guarantor2Name", e.target.value)}
                  maxLength={CHARACTER_LIMITS.guarantor2Name}
                />
                <p className={`text-xs ${formData.guarantor2Name.length >= CHARACTER_LIMITS.guarantor2Name ? "text-destructive" : "text-muted-foreground"}`}>
                  {CHARACTER_LIMITS.guarantor2Name - formData.guarantor2Name.length} characters remaining
                </p>
              </div>
              <div>
                <Label htmlFor="guarantor2Contact">Guarantor 2 Contact</Label>
                <Input
                  id="guarantor2Contact"
                  value={formData.guarantor2Contact}
                  onChange={(e) => handleChange("guarantor2Contact", e.target.value)}
                  placeholder="e.g., 0700000000"
                  className={!phoneValidation.guarantor2Contact.isValid ? "border-destructive" : ""}
                  maxLength={10}
                />
                {!phoneValidation.guarantor2Contact.isValid && formData.guarantor2Contact.trim() && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {phoneValidation.guarantor2Contact.message}
                  </p>
                )}
                {phoneValidation.guarantor2Contact.isValid && formData.guarantor2Contact.trim() && formData.guarantor2Contact.length === 10 && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span className="text-green-600">✓</span>
                    Valid phone number
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Location Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="serviceCenter">Service Center *</Label>
              <Select value={formData.serviceCenter} onValueChange={(value) => handleChange("serviceCenter", value)}>
                <SelectTrigger id="serviceCenter">
                  <SelectValue placeholder="Select service center" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {serviceCenters?.map((center) => (
                    <SelectItem key={center.id} value={center.name}>
                      {center.name} ({center.district})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Required: Select which service center registered this tenant</p>
            </div>

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
                  placeholder="e.g., 0700000000"
                  className={!phoneValidation.agentPhone.isValid ? "border-destructive" : ""}
                  maxLength={10}
                />
                {!phoneValidation.agentPhone.isValid && formData.agentPhone.trim() && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {phoneValidation.agentPhone.message}
                  </p>
                )}
                {phoneValidation.agentPhone.isValid && formData.agentPhone.trim() && formData.agentPhone.length === 10 && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span className="text-green-600">✓</span>
                    Valid phone number
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={hasInvalidPhoneNumber()}
            >
              Update Tenant
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
          {hasInvalidPhoneNumber() && (
            <p className="text-sm text-destructive text-center">
              Please fix phone number validation errors before updating
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
