import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, AlertTriangle } from "lucide-react";
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

export const QuickAddTenantForm = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addTenant } = useTenants();
  const { data: agents = [] } = useAgents();
  const { data: serviceCenters = [] } = useServiceCenters();
  const { logActivity } = useAgentActivity();
  const [phoneError, setPhoneError] = useState("");
  
  const [formData, setFormData] = useState<QuickAddFormData>({
    name: "",
    contact: "",
    address: "",
    rentAmount: "",
    agentName: "MUHWEZI MARTIN",
    agentPhone: "",
    serviceCenter: "",
  });

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
      const tenantData = {
        name: formData.name.trim().toUpperCase(),
        contact: formData.contact.trim().replace(/[\s-]/g, ''),
        address: formData.address.trim(),
        landlord: "TBD",
        landlordContact: "0000000000",
        rentAmount,
        registrationFee: 0,
        accessFee: 0,
        repaymentDays: 60 as 30 | 60 | 90,
        status: "pipeline" as const,
        paymentStatus: "pending" as const,
        performance: 80,
        location: {
          country: "Uganda",
          county: "",
          district: "",
          subcountyOrWard: "",
          cellOrVillage: "",
        },
        agentName: formData.agentName.trim(),
        agentPhone: formData.agentPhone.trim().replace(/[\s-]/g, ''),
        serviceCenter: formData.serviceCenter.trim(),
      };

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

      // Reset form
      setFormData({
        name: "",
        contact: "",
        address: "",
        rentAmount: "",
        agentName: "MUHWEZI MARTIN",
        agentPhone: "",
        serviceCenter: "",
      });
      setPhoneError("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error adding tenant:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to add tenant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: keyof QuickAddFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate phone on change
    if (field === "contact" || field === "agentPhone") {
      validatePhone(value);
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

  const isFormValid = 
    formData.name.trim() && 
    formData.contact.trim() && 
    formData.address.trim() && 
    formData.rentAmount && 
    parseFloat(formData.rentAmount) > 0 &&
    formData.agentName.trim() && 
    formData.agentPhone.trim() && 
    formData.serviceCenter.trim() &&
    !phoneError;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all">
          <Zap className="w-5 h-5" />
          Quick Add Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Zap className="w-6 h-6" />
            Quick Add Pipeline Tenant
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fast entry for prospects - only essential info required
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Alert className="border-primary/30 bg-primary/5">
            <Zap className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Prospect will be added with "Pending" status. Add full details when tenant becomes active.
            </AlertDescription>
          </Alert>

          {/* Essential Tenant Info */}
          <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border">
            <h3 className="font-semibold text-sm text-foreground">Tenant Information *</h3>
            
            <div className="space-y-2">
              <Label htmlFor="quick-name">Full Name *</Label>
              <Input
                id="quick-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter tenant's name"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-contact">Contact Number *</Label>
              <Input
                id="quick-contact"
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                placeholder="e.g., 0700000000 or 256700000000"
                maxLength={13}
                className={phoneError && formData.contact ? "border-destructive" : ""}
              />
              {phoneError && formData.contact && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {phoneError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-address">Address *</Label>
              <Input
                id="quick-address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter address"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-rent">Expected Rent Amount (UGX) *</Label>
              <Input
                id="quick-rent"
                type="number"
                value={formData.rentAmount}
                onChange={(e) => handleChange("rentAmount", e.target.value)}
                placeholder="Enter rent amount"
              />
            </div>
          </div>

          {/* Agent & Service Center */}
          <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-sm text-foreground">Agent & Location *</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quick-agent">Agent *</Label>
                <Select value={formData.agentName} onValueChange={handleAgentChange}>
                  <SelectTrigger id="quick-agent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {agents.map((agent) => (
                      <SelectItem key={agent.name} value={agent.name}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quick-agent-phone">Agent Phone *</Label>
                <Input
                  id="quick-agent-phone"
                  value={formData.agentPhone}
                  onChange={(e) => handleChange("agentPhone", e.target.value)}
                  placeholder="0700000000"
                  maxLength={13}
                  className={phoneError && formData.agentPhone ? "border-destructive" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-service-center">Service Center *</Label>
              <Select value={formData.serviceCenter} onValueChange={(value) => handleChange("serviceCenter", value)}>
                <SelectTrigger id="quick-service-center">
                  <SelectValue placeholder="Select service center" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {serviceCenters?.map((center) => (
                    <SelectItem key={center.id} value={center.name}>
                      {center.name} ({center.district})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              className="flex-1 font-semibold"
              disabled={!isFormValid}
            >
              <Zap className="w-4 h-4 mr-2" />
              Add to Pipeline
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

          {!isFormValid && (
            <p className="text-sm text-muted-foreground text-center">
              Please fill in all required fields
            </p>
          )}
        </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
