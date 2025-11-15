import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, AlertTriangle, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import { useAgents } from "@/hooks/useAgents";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";
import { useAgentActivity } from "@/hooks/useAgentActivity";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

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
        <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all">
          <Zap className="w-5 h-5" />
          Quick Add Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[95vh] sm:h-[90vh] max-w-[95vw] sm:max-w-xl flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl font-bold text-primary">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                Quick Add Pipeline Tenant
              </DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Fast entry for prospects - only essential info required
              </p>
            </div>
            {hasDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearDraft}
                className="text-xs sm:text-sm text-muted-foreground hover:text-destructive gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Draft
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-4">
          {hasDraft && lastSaved && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
              <Save className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                Draft auto-saved at {lastSaved.toLocaleTimeString()}. Your progress is safe!
              </AlertDescription>
            </Alert>
          )}
          
          <Alert className="border-primary/30 bg-primary/5">
            <Zap className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs sm:text-sm">
              Prospect will be added with "Pending" status. Add full details when tenant becomes active.
            </AlertDescription>
          </Alert>

          {/* Essential Tenant Info */}
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-secondary/10 rounded-lg border">
            <h3 className="font-semibold text-sm sm:text-base text-foreground">Tenant Information *</h3>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quick-name" className="text-sm sm:text-base">Full Name *</Label>
              <Input
                id="quick-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter tenant's name"
                maxLength={100}
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quick-contact" className="text-sm sm:text-base">Contact Number *</Label>
              <Input
                id="quick-contact"
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                placeholder="e.g., 0700000000"
                maxLength={13}
                className={`h-11 sm:h-10 text-base sm:text-sm ${phoneError && formData.contact ? "border-destructive" : ""}`}
              />
              {phoneError && formData.contact && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quick-address" className="text-sm sm:text-base">Address *</Label>
              <Input
                id="quick-address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter address or location"
                maxLength={200}
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quick-rent" className="text-sm sm:text-base">Monthly Rent (UGX) *</Label>
              <Input
                id="quick-rent"
                type="number"
                value={formData.rentAmount}
                onChange={(e) => handleChange("rentAmount", e.target.value)}
                placeholder="Enter rent amount"
                min="0"
                step="1000"
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Agent & Service Center */}
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-sm sm:text-base text-foreground">Agent & Location *</h3>
            
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="quick-agent" className="text-sm sm:text-base">Agent *</Label>
                <Select value={formData.agentName} onValueChange={handleAgentChange}>
                  <SelectTrigger id="quick-agent" className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {agents.map((agent) => (
                      <SelectItem key={agent.name} value={agent.name} className="text-base sm:text-sm py-3 sm:py-2">
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quick-agent-phone" className="text-sm sm:text-base">Agent Phone *</Label>
                  {formData.agentPhone && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleChange("agentPhone", "");
                        localStorage.removeItem('quickAddAgentPhone');
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Input
                  id="quick-agent-phone"
                  value={formData.agentPhone}
                  onChange={(e) => handleChange("agentPhone", e.target.value)}
                  placeholder="0700000000"
                  maxLength={13}
                  className={`h-11 sm:h-10 text-base sm:text-sm ${phoneError && formData.agentPhone ? "border-destructive" : ""}`}
                />
                {formData.agentPhone && !phoneError && (
                  <p className="text-xs text-muted-foreground">
                    ✓ Phone saved - will persist across forms
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quick-service-center" className="text-sm sm:text-base">Service Center (Optional)</Label>
              <Select value={formData.serviceCenter} onValueChange={(value) => handleChange("serviceCenter", value)}>
                <SelectTrigger id="quick-service-center" className="h-11 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Select service center (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {serviceCenters?.map((center) => (
                    <SelectItem key={center.id} value={center.name} className="text-base sm:text-sm py-3 sm:py-2">
                      {center.name} ({center.district})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="h-2" />
        </form>
        </ScrollArea>
        
        {/* Fixed Bottom Actions */}
        <div className="flex flex-col gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t bg-background flex-shrink-0">
          {!isFormValid && (
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Please fill in all required fields
            </p>
          )}
          <div className="flex gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-11 sm:h-10 text-base sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              onClick={handleSubmit}
              className="flex-1 h-11 sm:h-10 text-base sm:text-sm bg-gradient-to-r from-primary to-primary/80 font-semibold"
            >
              <Zap className="w-4 h-4 mr-2" />
              Add to Pipeline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
