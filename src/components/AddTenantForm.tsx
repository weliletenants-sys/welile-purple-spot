import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import { calculateRepaymentDetails } from "@/data/tenants";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAgents } from "@/hooks/useAgents";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TenantFormData {
  name: string;
  contact: string;
  address: string;
  landlord: string;
  landlordContact: string;
  rentAmount: string;
  registrationFee: string;
  accessFee: string;
  repaymentDays: "30" | "60" | "90";
  status: "active" | "pending" | "review" | "pipeline";
  paymentStatus: "paid" | "pending";
  guarantor1Name: string;
  guarantor1Contact: string;
  guarantor2Name: string;
  guarantor2Contact: string;
  country: string;
  county: string;
  district: string;
  subcountyOrWard: string;
  cellOrVillage: string;
  agentName: string;
  agentPhone: string;
  serviceCenter: string;
}

const AUTOSAVE_KEY = "addTenantFormData";

export const AddTenantForm = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addTenant } = useTenants();
  const { data: agents = [] } = useAgents();
  const { data: serviceCenters = [] } = useServiceCenters();
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [realtimeDuplicate, setRealtimeDuplicate] = useState<{
    name: string;
    contact: string;
    address: string;
  } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [realtimeNameDuplicates, setRealtimeNameDuplicates] = useState<Array<{
    name: string;
    contact: string;
    address: string;
  }>>([]);
  const [isCheckingNameDuplicate, setIsCheckingNameDuplicate] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [phoneValidation, setPhoneValidation] = useState({
    contact: { isValid: true, message: "" },
    agentPhone: { isValid: true, message: "" },
    landlordContact: { isValid: true, message: "" },
    guarantor1Contact: { isValid: true, message: "" },
    guarantor2Contact: { isValid: true, message: "" },
  });
  
  const [formData, setFormData] = useState<TenantFormData>(() => {
    // Load saved data from localStorage on initial load
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved form data:", e);
      }
    }
    return {
      name: "",
      contact: "",
      address: "",
      landlord: "",
      landlordContact: "",
      rentAmount: "",
      registrationFee: "",
      accessFee: "",
      repaymentDays: "60",
      status: "pipeline",
      paymentStatus: "pending",
      guarantor1Name: "",
      guarantor1Contact: "",
      guarantor2Name: "",
      guarantor2Contact: "",
      country: "Uganda",
      county: "",
      district: "",
      subcountyOrWard: "",
      cellOrVillage: "",
      agentName: "MUHWEZI MARTIN",
      agentPhone: "",
      serviceCenter: "",
    };
  });

  // Auto-save form data whenever it changes
  useEffect(() => {
    if (open) {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
      setLastSaved(new Date());
    }
  }, [formData, open]);

  // Real-time duplicate detection with debouncing
  useEffect(() => {
    if (!open || !formData.contact.trim() || formData.contact.trim().length < 10) {
      setRealtimeDuplicate(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const { data: contactMatch, error } = await supabase
          .from("tenants")
          .select("name, contact, address")
          .eq("contact", formData.contact.trim())
          .maybeSingle();

        if (error) {
          console.error("Error checking for duplicates:", error);
        } else if (contactMatch) {
          setRealtimeDuplicate(contactMatch);
        } else {
          setRealtimeDuplicate(null);
        }
      } catch (error) {
        console.error("Error checking for duplicates:", error);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.contact, open]);

  // Real-time name duplicate detection with debouncing
  useEffect(() => {
    if (!open || !formData.name.trim() || formData.name.trim().length < 3) {
      setRealtimeNameDuplicates([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingNameDuplicate(true);
      try {
        const { data: nameMatches, error } = await supabase
          .from("tenants")
          .select("name, contact, address")
          .ilike("name", `%${formData.name.trim()}%`)
          .limit(3);

        if (error) {
          console.error("Error checking for name duplicates:", error);
        } else if (nameMatches && nameMatches.length > 0) {
          setRealtimeNameDuplicates(nameMatches);
        } else {
          setRealtimeNameDuplicates([]);
        }
      } catch (error) {
        console.error("Error checking for name duplicates:", error);
      } finally {
        setIsCheckingNameDuplicate(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.name, open]);

  // Calculate repayment details whenever rent amount or repayment days change
  const repaymentDetails = useMemo(() => {
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
    // Contact and agent phone are always required
    if (!phoneValidation.contact.isValid && formData.contact.trim()) return true;
    if (!phoneValidation.agentPhone.isValid && formData.agentPhone.trim()) return true;
    
    // Landlord contact is required if not pipeline
    if (formData.status !== "pipeline" && !phoneValidation.landlordContact.isValid && formData.landlordContact.trim()) {
      return true;
    }
    
    // Guarantor contacts are optional but must be valid if provided
    if (formData.guarantor1Contact.trim() && !phoneValidation.guarantor1Contact.isValid) return true;
    if (formData.guarantor2Contact.trim() && !phoneValidation.guarantor2Contact.isValid) return true;
    
    return false;
  };


  const checkForDuplicates = async () => {
    // Check for duplicate by contact
    const { data: contactMatch } = await supabase
      .from("tenants")
      .select("name, contact, address")
      .eq("contact", formData.contact.trim())
      .maybeSingle();

    if (contactMatch) {
      return `A tenant with contact number "${formData.contact}" already exists: ${contactMatch.name} at ${contactMatch.address}`;
    }

    // Check for duplicate by name (exact match)
    const { data: nameMatch } = await supabase
      .from("tenants")
      .select("name, contact, address")
      .ilike("name", formData.name.trim())
      .maybeSingle();

    if (nameMatch) {
      return `A tenant with name "${formData.name}" already exists with contact: ${nameMatch.contact}`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous warnings
    setDuplicateWarning(null);

    // Validate required fields
    const missingFields = [];
    if (!formData.name.trim()) missingFields.push("Name");
    if (!formData.contact.trim()) missingFields.push("Contact");
    if (!formData.address.trim()) missingFields.push("Address");
    if (!formData.rentAmount || parseFloat(formData.rentAmount) <= 0) missingFields.push("Rent Amount");
    if (!formData.agentName.trim()) missingFields.push("Agent Name");
    if (!formData.agentPhone.trim()) missingFields.push("Agent Phone");
    if (!formData.serviceCenter.trim()) missingFields.push("Service Center");
    
    if (formData.status !== "pipeline") {
      if (!formData.landlord.trim()) missingFields.push("Landlord Name");
      if (!formData.landlordContact.trim()) missingFields.push("Landlord Contact");
    }

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

    const isPipeline = formData.status === "pipeline";

    try {
      const tenantData = {
        name: formData.name.trim().toUpperCase(),
        contact: formData.contact.trim(),
        address: formData.address.trim(),
        landlord: isPipeline ? "TBD" : formData.landlord.trim(),
        landlordContact: isPipeline ? "TBD" : formData.landlordContact.trim(),
        rentAmount: parseFloat(formData.rentAmount),
        registrationFee: isPipeline ? 0 : parseFloat(formData.registrationFee || "0"),
        accessFee: isPipeline ? 0 : parseFloat(formData.accessFee || "0"),
        repaymentDays: isPipeline ? 60 : (parseInt(formData.repaymentDays) as 30 | 60 | 90),
        status: formData.status as any,
        paymentStatus: formData.paymentStatus,
        performance: 80,
        guarantor1: (!isPipeline && formData.guarantor1Name.trim()) ? {
          name: formData.guarantor1Name.trim(),
          contact: formData.guarantor1Contact.trim(),
        } : undefined,
        guarantor2: (!isPipeline && formData.guarantor2Name.trim()) ? {
          name: formData.guarantor2Name.trim(),
          contact: formData.guarantor2Contact.trim(),
        } : undefined,
        location: {
          country: isPipeline ? "" : formData.country.trim(),
          county: isPipeline ? "" : formData.county.trim(),
          district: isPipeline ? "" : formData.district.trim(),
          subcountyOrWard: isPipeline ? "" : formData.subcountyOrWard.trim(),
          cellOrVillage: isPipeline ? "" : formData.cellOrVillage.trim(),
        },
        agentName: formData.agentName.trim(),
        agentPhone: formData.agentPhone.trim(),
        serviceCenter: formData.serviceCenter.trim(),
      };

      console.log("Adding tenant:", tenantData);
      await addTenant(tenantData);

      toast({
        title: "✅ Success!",
        description: `${formData.name} has been added to the system successfully`,
      });

      // Reset form and clear auto-saved data
      const resetData: TenantFormData = {
        name: "",
        contact: "",
        address: "",
        landlord: "",
        landlordContact: "",
        rentAmount: "",
        registrationFee: "",
        accessFee: "",
        repaymentDays: "60",
        status: "pipeline",
        paymentStatus: "pending",
        guarantor1Name: "",
        guarantor1Contact: "",
        guarantor2Name: "",
        guarantor2Contact: "",
        country: "Uganda",
        county: "",
        district: "",
        subcountyOrWard: "",
        cellOrVillage: "",
        agentName: "MUHWEZI MARTIN",
        agentPhone: "",
        serviceCenter: "",
      };
      setFormData(resetData);
      localStorage.removeItem(AUTOSAVE_KEY);
      setDuplicateWarning(null);
      setLastSaved(null);
      setOpen(false);
    } catch (error: any) {
      console.error("Error adding tenant:", error);
      toast({
        title: "❌ Error Adding Tenant",
        description: error.message || "Failed to add tenant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate phone number fields in real-time
    const phoneFields = ["contact", "agentPhone", "landlordContact", "guarantor1Contact", "guarantor2Contact"];
    if (phoneFields.includes(field)) {
      const validation = validatePhoneNumber(value);
      setPhoneValidation(prev => ({
        ...prev,
        [field]: validation
      }));
    }
    
    // Clear duplicate warning when user changes contact or name
    if ((field === "contact" || field === "name") && duplicateWarning) {
      setDuplicateWarning(null);
    }
    // Clear realtime duplicate when contact changes
    if (field === "contact" && realtimeDuplicate) {
      setRealtimeDuplicate(null);
    }
    // Clear realtime name duplicates when name changes
    if (field === "name" && realtimeNameDuplicates.length > 0) {
      setRealtimeNameDuplicates([]);
    }
  };

  const handleAgentChange = (agentName: string) => {
    const selectedAgent = agents.find(agent => agent.name === agentName);
    setFormData(prev => ({
      ...prev,
      agentName,
      agentPhone: selectedAgent?.phone || "",
    }));
  };

  const handleClearForm = () => {
    const resetData: TenantFormData = {
      name: "",
      contact: "",
      address: "",
      landlord: "",
      landlordContact: "",
      rentAmount: "",
      registrationFee: "",
      accessFee: "",
      repaymentDays: "60",
      status: "pipeline",
      paymentStatus: "pending",
      guarantor1Name: "",
      guarantor1Contact: "",
      guarantor2Name: "",
      guarantor2Contact: "",
      country: "Uganda",
      county: "",
      district: "",
      subcountyOrWard: "",
      cellOrVillage: "",
      agentName: "MUHWEZI MARTIN",
      agentPhone: "",
      serviceCenter: "",
    };
    setFormData(resetData);
    localStorage.removeItem(AUTOSAVE_KEY);
    setDuplicateWarning(null);
    setRealtimeDuplicate(null);
    setRealtimeNameDuplicates([]);
    setPhoneValidation({
      contact: { isValid: true, message: "" },
      agentPhone: { isValid: true, message: "" },
      landlordContact: { isValid: true, message: "" },
      guarantor1Contact: { isValid: true, message: "" },
      guarantor2Contact: { isValid: true, message: "" },
    });
    setLastSaved(null);
    toast({
      title: "Form Cleared",
      description: "All form data has been cleared and auto-save removed.",
    });
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="w-5 h-5" />
          Add New Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-2xl font-bold text-primary">
            <span>Add New Tenant</span>
            {lastSaved && (
              <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <Save className="w-4 h-4" />
                Auto-saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Duplicate Warning */}
          {duplicateWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}

          {/* Tenant Status Selection */}
          <div className="space-y-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <Label htmlFor="status" className="text-base font-semibold">Tenant Status *</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger id="status" className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pipeline">Pipeline (Minimal Info)</SelectItem>
                <SelectItem value="active">Active (Full Details)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formData.status === "pipeline" 
                ? "Pipeline: Basic info required (name, contact, address, rent, agent, service center)" 
                : "Active: Full tenant details required"}
            </p>
          </div>

          {/* Agent & Service Center Information - Required for all statuses */}
          <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Agent & Service Center *</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name *</Label>
                <Select value={formData.agentName} onValueChange={handleAgentChange}>
                  <SelectTrigger id="agentName">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {agents.map((agent) => (
                      <SelectItem key={agent.name} value={agent.name}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agentPhone">Agent Phone *</Label>
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
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Personal Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter tenant's full name"
                className={realtimeNameDuplicates.length > 0 ? "border-yellow-500" : ""}
              />
              {isCheckingNameDuplicate && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  Checking for similar names...
                </p>
              )}
              {realtimeNameDuplicates.length > 0 && !isCheckingNameDuplicate && (
                <Alert variant="default" className="mt-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    <strong>Similar names found:</strong>
                    <ul className="mt-1 space-y-1 text-sm">
                      {realtimeNameDuplicates.map((duplicate, index) => (
                        <li key={index}>
                          <span className="font-semibold">{duplicate.name}</span> - {duplicate.contact} ({duplicate.address})
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs">Please verify this is a new tenant.</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                placeholder="e.g., 0700000000"
                className={
                  realtimeDuplicate ? "border-destructive" : 
                  !phoneValidation.contact.isValid ? "border-destructive" : ""
                }
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
              {isCheckingDuplicate && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  Checking for duplicates...
                </p>
              )}
              {realtimeDuplicate && !isCheckingDuplicate && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Duplicate Found!</strong> This contact number already exists:
                    <br />
                    <span className="font-semibold">{realtimeDuplicate.name}</span> at {realtimeDuplicate.address}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter tenant's address"
              />
            </div>
          </div>

          {/* Landlord Information - Hidden for Pipeline */}
          {formData.status !== "pipeline" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Landlord Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="landlord">Landlord Name *</Label>
              <Input
                id="landlord"
                value={formData.landlord}
                onChange={(e) => handleChange("landlord", e.target.value)}
                placeholder="Enter landlord's name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landlordContact">Landlord Contact *</Label>
              <Input
                id="landlordContact"
                value={formData.landlordContact}
                onChange={(e) => handleChange("landlordContact", e.target.value)}
                placeholder="e.g., 0700000000"
                className={!phoneValidation.landlordContact.isValid ? "border-destructive" : ""}
                maxLength={10}
              />
              {!phoneValidation.landlordContact.isValid && formData.landlordContact.trim() && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {phoneValidation.landlordContact.message}
                </p>
              )}
              {phoneValidation.landlordContact.isValid && formData.landlordContact.trim() && formData.landlordContact.length === 10 && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  Valid phone number
                </p>
              )}
            </div>
          </div>
          )}

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Payment Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="rentAmount">Rent Amount (UGX) *</Label>
              <Input
                id="rentAmount"
                type="number"
                value={formData.rentAmount}
                onChange={(e) => handleChange("rentAmount", e.target.value)}
                placeholder="Enter rent amount"
              />
            </div>

            {formData.status !== "pipeline" && (
            <>
            <div className="space-y-2">
              <Label htmlFor="repaymentDays">Repayment Period *</Label>
              <Select value={formData.repaymentDays} onValueChange={(value) => handleChange("repaymentDays", value)}>
                <SelectTrigger id="repaymentDays">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationFee">Registration Fee (UGX) *</Label>
                <Input
                  id="registrationFee"
                  type="number"
                  value={formData.registrationFee}
                  placeholder="Auto-calculated"
                  className="bg-muted"
                  readOnly
                />
                <p className="text-xs text-muted-foreground">Automatically calculated based on rent amount</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessFee">Access Fee (UGX) *</Label>
                <Input
                  id="accessFee"
                  type="number"
                  value={formData.accessFee}
                  placeholder="Auto-calculated"
                  className="bg-muted"
                  readOnly
                />
                <p className="text-xs text-muted-foreground">Automatically calculated with compound interest</p>
              </div>
            </div>

            {/* Repayment Details Display */}
            {repaymentDetails && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
                <h4 className="font-semibold text-sm text-primary mb-3">Repayment Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Rent Amount:</div>
                  <div className="font-medium text-right">UGX {repaymentDetails.rentAmount.toLocaleString()}</div>
                  
                  <div className="text-muted-foreground">Registration Fee:</div>
                  <div className="font-medium text-right">UGX {repaymentDetails.registrationFee.toLocaleString()}</div>
                  
                  <div className="text-muted-foreground">Access Fees:</div>
                  <div className="font-medium text-right">UGX {repaymentDetails.accessFees.toLocaleString()}</div>
                  
                  <div className="text-muted-foreground border-t pt-2 font-semibold">Total Repayment:</div>
                  <div className="font-bold text-right border-t pt-2 text-primary">UGX {repaymentDetails.totalAmount.toLocaleString()}</div>
                  
                  <div className="text-muted-foreground">Daily Installment:</div>
                  <div className="font-medium text-right">UGX {repaymentDetails.dailyInstallment.toLocaleString()}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status *</Label>
                <Select value={formData.paymentStatus} onValueChange={(value) => handleChange("paymentStatus", value)}>
                  <SelectTrigger id="paymentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
            )}
          </div>

          {/* Guarantor Information - Hidden for Pipeline */}
          {formData.status !== "pipeline" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Guarantor Information</h3>
            
            <div className="space-y-4 p-4 bg-secondary/20 rounded-lg">
              <h4 className="font-medium text-sm text-muted-foreground">Guarantor 1</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guarantor1Name">Name</Label>
                  <Input
                    id="guarantor1Name"
                    value={formData.guarantor1Name}
                    onChange={(e) => handleChange("guarantor1Name", e.target.value)}
                    placeholder="Enter guarantor's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guarantor1Contact">Contact</Label>
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
              </div>
            </div>

            <div className="space-y-4 p-4 bg-secondary/20 rounded-lg">
              <h4 className="font-medium text-sm text-muted-foreground">Guarantor 2</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guarantor2Name">Name</Label>
                  <Input
                    id="guarantor2Name"
                    value={formData.guarantor2Name}
                    onChange={(e) => handleChange("guarantor2Name", e.target.value)}
                    placeholder="Enter guarantor's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guarantor2Contact">Contact</Label>
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
          </div>
          )}

          {/* Location Information - Hidden for Pipeline */}
          {formData.status !== "pipeline" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Location Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cellOrVillage">Cell / Village</Label>
                <Input
                  id="cellOrVillage"
                  value={formData.cellOrVillage}
                  onChange={(e) => handleChange("cellOrVillage", e.target.value)}
                  placeholder="Enter cell or village name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcountyOrWard">Subcounty / Ward</Label>
                <Input
                  id="subcountyOrWard"
                  value={formData.subcountyOrWard}
                  onChange={(e) => handleChange("subcountyOrWard", e.target.value)}
                  placeholder="Enter subcounty or ward"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  placeholder="Enter district"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={formData.county}
                  onChange={(e) => handleChange("county", e.target.value)}
                  placeholder="Enter county"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 font-semibold"
              disabled={
                !formData.name.trim() || 
                !formData.contact.trim() || 
                !formData.address.trim() || 
                !formData.rentAmount ||
                parseFloat(formData.rentAmount) <= 0 ||
                !formData.agentName.trim() ||
                !formData.agentPhone.trim() ||
                !formData.serviceCenter.trim() ||
                realtimeDuplicate !== null ||
                isCheckingDuplicate ||
                hasInvalidPhoneNumber() ||
                (formData.status !== "pipeline" && (!formData.landlord.trim() || !formData.landlordContact.trim()))
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Form Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all form fields and remove the auto-saved data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearForm} className="bg-destructive hover:bg-destructive/90">
                    Clear Form
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                setDuplicateWarning(null);
              }} 
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
          
          {/* Helper text for disabled button */}
          {(
            !formData.name.trim() || 
            !formData.contact.trim() || 
            !formData.address.trim() || 
            !formData.rentAmount ||
            !formData.agentName.trim() ||
            !formData.agentPhone.trim() ||
            !formData.serviceCenter.trim() ||
            realtimeDuplicate !== null ||
            isCheckingDuplicate ||
            hasInvalidPhoneNumber() ||
            (formData.status !== "pipeline" && (!formData.landlord.trim() || !formData.landlordContact.trim()))
          ) && (
            <p className="text-sm text-muted-foreground text-center">
              {realtimeDuplicate ? "Cannot add duplicate tenant - contact number already exists" :
               isCheckingDuplicate ? "Checking for duplicate contacts..." :
               hasInvalidPhoneNumber() ? "Please fix phone number validation errors" :
               "Please fill in all required fields marked with *"}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
