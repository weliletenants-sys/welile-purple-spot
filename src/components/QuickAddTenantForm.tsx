import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, AlertTriangle, Save, Trash2, User, Phone, MapPin, DollarSign, Users, Building2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import { useAgents } from "@/hooks/useAgents";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";
import { useAgentActivity } from "@/hooks/useAgentActivity";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuickAddFormData {
  name: string;
  contact: string;
  address: string;
  rentAmount: string;
  agentName: string;
  agentPhone: string;
  serviceCenter: string;
}

const DRAFT_KEY = 'quickAddTenantDraft';
const DRAFT_TIMESTAMP_KEY = 'quickAddTenantDraftTimestamp';

export const QuickAddTenantForm = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addTenant } = useTenants();
  const { data: agents = [] } = useAgents();
  const { data: serviceCenters = [] } = useServiceCenters();
  const { logActivity } = useAgentActivity();
  const [phoneError, setPhoneError] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Load saved agent phone and draft from localStorage on component mount
  const [formData, setFormData] = useState<QuickAddFormData>(() => {
    const savedAgentPhone = localStorage.getItem('quickAddAgentPhone');
    const savedAgentName = localStorage.getItem('quickAddAgentName');
    return {
      name: "",
      contact: "",
      address: "",
      rentAmount: "",
      agentName: savedAgentName || "MUHWEZI MARTIN",
      agentPhone: savedAgentPhone || "",
      serviceCenter: "",
    };
  });

  // Load draft when dialog opens
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem(DRAFT_KEY);
      const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);
      
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
          setHasDraft(true);
          if (timestamp) {
            setLastSaved(new Date(timestamp));
          }
        } catch (error) {
          console.error("Failed to load draft:", error);
        }
      }
    }
  }, [open]);

  // Auto-save draft as user types (with debounce)
  useEffect(() => {
    const hasContent = formData.name || formData.contact || formData.address || formData.rentAmount;
    
    if (!hasContent) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        const now = new Date();
        localStorage.setItem(DRAFT_TIMESTAMP_KEY, now.toISOString());
        setLastSaved(now);
        setHasDraft(true);
      } catch (error) {
        console.error("Failed to save draft:", error);
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
    setHasDraft(false);
    setLastSaved(null);
    setFormData({
      name: "",
      contact: "",
      address: "",
      rentAmount: "",
      agentName: formData.agentName,
      agentPhone: formData.agentPhone,
      serviceCenter: "",
    });
    toast({
      title: "Draft Cleared",
      description: "Form has been reset",
    });
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      setPhoneError("Phone number is required");
      return false;
    }
    
    // Remove any spaces or dashes
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    if (cleanPhone.length < 9 || cleanPhone.length > 13) {
      setPhoneError("Phone must be 9-13 digits");
      return false;
    }
    
    if (!/^\d+$/.test(cleanPhone)) {
      setPhoneError("Phone must contain only digits");
      return false;
    }
    
    setPhoneError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim() || !formData.contact.trim() || !formData.address.trim() || 
        !formData.rentAmount || !formData.agentName.trim() || !formData.agentPhone.trim() || 
        !formData.serviceCenter.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate phone numbers
    if (!validatePhone(formData.contact) || !validatePhone(formData.agentPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: phoneError,
        variant: "destructive",
      });
      return;
    }

    const rentAmount = parseFloat(formData.rentAmount);
    if (isNaN(rentAmount) || rentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid rent amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Normalize phone numbers
      const normalizedContact = formData.contact.trim().replace(/[\s-]/g, '');
      const normalizedAgentPhone = formData.agentPhone.trim().replace(/[\s-]/g, '');
      
      const tenantData = {
        name: formData.name.trim().toUpperCase(),
        contact: normalizedContact,
        address: formData.address.trim() || "TBD",
        landlord: "TBD",
        landlordContact: "0000000000",
        rentAmount,
        registrationFee: 0,
        accessFee: 0,
        repaymentDays: 60 as 30 | 60 | 90,
        status: "pipeline" as const,
        paymentStatus: "pending" as const,
        performance: 80,
        guarantor1: undefined,
        guarantor2: undefined,
        location: {
          country: "Uganda",
          county: "",
          district: "",
          subcountyOrWard: "",
          cellOrVillage: "",
        },
        agentName: formData.agentName.trim(),
        agentPhone: normalizedAgentPhone,
        serviceCenter: formData.serviceCenter.trim() || "",
      };

      console.log('Submitting pipeline tenant:', tenantData);
      await addTenant(tenantData);

      // Log agent activity
      const selectedAgent = agents.find(agent => agent.name === formData.agentName);
      if (selectedAgent?.id) {
        await logActivity({
          agentId: selectedAgent.id,
          agentName: formData.agentName,
          agentPhone: formData.agentPhone,
          actionType: 'tenant_added',
          actionDescription: `Quick-added pipeline tenant: ${formData.name}`,
          metadata: { 
            tenantName: formData.name,
            tenantContact: formData.contact,
            tenantStatus: 'pipeline',
            serviceCenter: formData.serviceCenter,
            quickAdd: true
          }
        });
      }

      // Fetch total earnings to show in notification
      const { data: earningsData } = await supabase
        .from("agent_earnings")
        .select("amount")
        .eq("agent_phone", formData.agentPhone)
        .neq("earning_type", "withdrawal");

      const totalEarnings = earningsData?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;

      toast({
        title: "🎉 Pipeline Tenant Added!",
        description: `${formData.name} added successfully! You earned UGX 50. Total earnings: UGX ${totalEarnings.toLocaleString()}`,
        duration: 5000,
      });

      // Clear draft after successful submission
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
      setHasDraft(false);
      setLastSaved(null);

      // Reset form but keep agent info
      setFormData({
        name: "",
        contact: "",
        address: "",
        rentAmount: "",
        agentName: formData.agentName, // Keep agent name
        agentPhone: formData.agentPhone, // Keep agent phone
        serviceCenter: "",
      });
      setPhoneError("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error adding pipeline tenant:", error);
      
      // More detailed error message
      let errorMessage = "Failed to add tenant. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Database error (${error.code}): ${error.details || 'Please check all fields'}`;
      }
      
      toast({
        title: "❌ Error Adding Pipeline Tenant",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleChange = (field: keyof QuickAddFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Save agent phone to localStorage when changed
    if (field === "agentPhone") {
      localStorage.setItem('quickAddAgentPhone', value);
      validatePhone(value);
    } else if (field === "agentName") {
      localStorage.setItem('quickAddAgentName', value);
    }
    
    // Validate phone on change
    if (field === "contact") {
      validatePhone(value);
    }
  };

  const handleAgentChange = (agentName: string) => {
    const selectedAgent = agents.find(agent => agent.name === agentName);
    const newAgentPhone = selectedAgent?.phone || "";
    
    setFormData(prev => ({
      ...prev,
      agentName,
      agentPhone: newAgentPhone,
    }));
    
    // Save to localStorage
    localStorage.setItem('quickAddAgentName', agentName);
    localStorage.setItem('quickAddAgentPhone', newAgentPhone);
    
    // Validate the new phone
    if (newAgentPhone) {
      validatePhone(newAgentPhone);
    }
  };

  const isFormValid =
    formData.name.trim() && 
    formData.contact.trim() && 
    formData.address.trim() && 
    formData.rentAmount && 
    parseFloat(formData.rentAmount) > 0 &&
    formData.agentName.trim() && 
    formData.agentPhone.trim() && 
    !phoneError;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-3 h-14 px-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all text-base font-bold">
          <Zap className="w-6 h-6" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[95vh] sm:h-[90vh] max-w-[95vw] sm:max-w-xl flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b-4 border-primary/30 bg-gradient-to-r from-primary/10 to-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-primary">
                  Add New Tenant
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Fill form below
                </p>
              </div>
            </div>
            {hasDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearDraft}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-4">
            {[
              { filled: !!formData.name, icon: User, label: "Name" },
              { filled: !!formData.contact, icon: Phone, label: "Phone" },
              { filled: !!formData.address, icon: MapPin, label: "Location" },
              { filled: !!formData.rentAmount, icon: DollarSign, label: "Rent" },
            ].map((step, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all",
                  step.filled ? "bg-green-500" : "bg-muted"
                )}
              />
            ))}
          </div>

          {hasDraft && lastSaved && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-sm font-medium text-green-700 dark:text-green-300">
                ✓ Saved {lastSaved.toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )}

          {/* Tenant Name - Visual Card */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all",
            formData.name ? "bg-green-50 dark:bg-green-950/20 border-green-500" : "bg-blue-50 dark:bg-blue-950/20 border-blue-300"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-3 rounded-full",
                formData.name ? "bg-green-500" : "bg-blue-500"
              )}>
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="quick-name" className="text-base font-bold text-foreground">
                  1. Tenant Name
                </Label>
              </div>
              {formData.name && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            </div>
            <Input
              id="quick-name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Example: JOHN DOE"
              maxLength={100}
              className="h-14 text-lg font-medium border-2"
            />
          </div>

          {/* Phone Number - Visual Card */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all",
            formData.contact && !phoneError ? "bg-green-50 dark:bg-green-950/20 border-green-500" : "bg-orange-50 dark:bg-orange-950/20 border-orange-300"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-3 rounded-full",
                formData.contact && !phoneError ? "bg-green-500" : "bg-orange-500"
              )}>
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="quick-contact" className="text-base font-bold text-foreground">
                  2. Phone Number
                </Label>
              </div>
              {formData.contact && !phoneError && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            </div>
            <Input
              id="quick-contact"
              value={formData.contact}
              onChange={(e) => handleChange("contact", e.target.value)}
              placeholder="0700123456"
              type="tel"
              maxLength={13}
              className={cn(
                "h-14 text-lg font-medium border-2",
                phoneError && formData.contact && "border-red-500"
              )}
            />
            {phoneError && formData.contact && (
              <div className="flex items-center gap-2 mt-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">{phoneError}</p>
              </div>
            )}
          </div>

          {/* Address - Visual Card */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all",
            formData.address ? "bg-green-50 dark:bg-green-950/20 border-green-500" : "bg-purple-50 dark:bg-purple-950/20 border-purple-300"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-3 rounded-full",
                formData.address ? "bg-green-500" : "bg-purple-500"
              )}>
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="quick-address" className="text-base font-bold text-foreground">
                  3. Location
                </Label>
              </div>
              {formData.address && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            </div>
            <Input
              id="quick-address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Example: Kampala, Wandegeya"
              maxLength={200}
              className="h-14 text-lg font-medium border-2"
            />
          </div>

          {/* Rent Amount - Visual Card */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all",
            formData.rentAmount ? "bg-green-50 dark:bg-green-950/20 border-green-500" : "bg-amber-50 dark:bg-amber-950/20 border-amber-300"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-3 rounded-full",
                formData.rentAmount ? "bg-green-500" : "bg-amber-500"
              )}>
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="quick-rent" className="text-base font-bold text-foreground">
                  4. Monthly Rent (UGX)
                </Label>
              </div>
              {formData.rentAmount && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            </div>
            <Input
              id="quick-rent"
              type="number"
              value={formData.rentAmount}
              onChange={(e) => handleChange("rentAmount", e.target.value)}
              placeholder="Example: 500000"
              min="0"
              step="10000"
              className="h-14 text-lg font-medium border-2"
            />
          </div>

          {/* Agent Selection - Visual Card */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all",
            formData.agentName ? "bg-green-50 dark:bg-green-950/20 border-green-500" : "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-3 rounded-full",
                formData.agentName ? "bg-green-500" : "bg-indigo-500"
              )}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="quick-agent" className="text-base font-bold text-foreground">
                  5. Your Name
                </Label>
              </div>
              {formData.agentName && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            </div>
            <Select value={formData.agentName} onValueChange={handleAgentChange}>
              <SelectTrigger id="quick-agent" className="h-14 text-lg font-medium border-2">
                <SelectValue placeholder="Select your name" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {agents.map((agent) => (
                  <SelectItem 
                    key={agent.name} 
                    value={agent.name} 
                    className="text-lg py-4 font-medium"
                  >
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Phone - Auto-filled */}
          {formData.agentPhone && (
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-500">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Your Phone</p>
                  <p className="text-lg font-bold">{formData.agentPhone}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          )}

          {/* Service Center - Optional */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all",
            formData.serviceCenter ? "bg-green-50 dark:bg-green-950/20 border-green-500" : "bg-gray-50 dark:bg-gray-900/20 border-gray-300"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-3 rounded-full",
                formData.serviceCenter ? "bg-green-500" : "bg-gray-400"
              )}>
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <Label htmlFor="quick-service-center" className="text-base font-bold text-foreground">
                  6. Office (Optional)
                </Label>
              </div>
              {formData.serviceCenter && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            </div>
            <Select value={formData.serviceCenter} onValueChange={(value) => handleChange("serviceCenter", value)}>
              <SelectTrigger id="quick-service-center" className="h-14 text-lg font-medium border-2">
                <SelectValue placeholder="Skip or select office" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {serviceCenters?.map((center) => (
                  <SelectItem 
                    key={center.id} 
                    value={center.name} 
                    className="text-lg py-4 font-medium"
                  >
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bottom spacing */}
          <div className="h-4" />
        </form>
        </ScrollArea>
        
        {/* Fixed Bottom Actions - Large and Visual */}
        <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 border-t-4 border-primary/20 bg-background flex-shrink-0">
          {!isFormValid && (
            <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-2 border-amber-300">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Fill all fields above ↑
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-14 text-base font-bold border-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              onClick={handleSubmit}
              className={cn(
                "flex-1 h-14 text-base font-bold gap-2",
                isFormValid 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-gray-300 text-gray-500"
              )}
            >
              {isFormValid && <CheckCircle2 className="w-5 h-5" />}
              Save Tenant
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
