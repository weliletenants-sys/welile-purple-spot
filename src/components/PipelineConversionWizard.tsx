import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import { useAgents } from "@/hooks/useAgents";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";
import { calculateRepaymentDetails } from "@/data/tenants";

interface PipelineConversionWizardProps {
  tenant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PipelineConversionWizard = ({ tenant, open, onOpenChange }: PipelineConversionWizardProps) => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const { updateTenant } = useTenants();
  const { data: agents = [] } = useAgents();
  const { data: serviceCenters = [] } = useServiceCenters();

  const [formData, setFormData] = useState({
    landlord: "",
    landlordContact: "",
    repaymentDays: "60",
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
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAgentChange = (agentName: string) => {
    const selectedAgent = agents.find(agent => agent.name === agentName);
    setFormData(prev => ({
      ...prev,
      agentName,
      agentPhone: selectedAgent?.phone || "",
    }));
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    // Validate all required fields
    const missingFields = [];
    if (!formData.landlord.trim()) missingFields.push("Landlord Name");
    if (!formData.landlordContact.trim()) missingFields.push("Landlord Contact");
    if (!formData.guarantor1Name.trim()) missingFields.push("Guarantor 1 Name");
    if (!formData.guarantor1Contact.trim()) missingFields.push("Guarantor 1 Contact");
    if (!formData.district.trim()) missingFields.push("District");
    if (!formData.agentName.trim()) missingFields.push("Agent Name");
    if (!formData.agentPhone.trim()) missingFields.push("Agent Phone");
    if (!formData.serviceCenter.trim()) missingFields.push("Service Center");

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const repaymentDays = parseInt(formData.repaymentDays) as 30 | 60 | 90;
      const repaymentDetails = calculateRepaymentDetails(tenant.rent_amount, repaymentDays);

      console.log("Converting pipeline tenant to active:", tenant.id);

      await updateTenant({
        id: tenant.id,
        updates: {
          landlord: formData.landlord.trim(),
          landlordContact: formData.landlordContact.trim(),
          repaymentDays: repaymentDays,
          registrationFee: repaymentDetails.registrationFee,
          accessFee: repaymentDetails.accessFees,
          guarantor1: formData.guarantor1Name.trim() ? {
            name: formData.guarantor1Name.trim(),
            contact: formData.guarantor1Contact.trim(),
          } : undefined,
          guarantor2: formData.guarantor2Name.trim() ? {
            name: formData.guarantor2Name.trim(),
            contact: formData.guarantor2Contact.trim(),
          } : undefined,
          location: {
            country: formData.country.trim(),
            county: formData.county.trim(),
            district: formData.district.trim(),
            subcountyOrWard: formData.subcountyOrWard.trim(),
            cellOrVillage: formData.cellOrVillage.trim(),
          },
          agentName: formData.agentName.trim(),
          agentPhone: formData.agentPhone.trim(),
          serviceCenter: formData.serviceCenter.trim(),
          status: "active" as any,
        },
      });

      toast({
        title: "✅ Conversion Complete!",
        description: `${tenant.name} has been successfully converted to active status`,
      });

      onOpenChange(false);
      setStep(1);
    } catch (error: any) {
      console.error("Error converting pipeline tenant:", error);
      toast({
        title: "❌ Conversion Failed",
        description: error.message || "Failed to convert tenant. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Convert Pipeline Tenant to Active
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Tenant: {tenant?.name} - Step {step} of {totalSteps}
          </p>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <div className="space-y-6">
          {/* Step 1: Landlord Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Landlord Information</h3>
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
                />
              </div>
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
            </div>
          )}

          {/* Step 2: Guarantor Information */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Guarantor Information</h3>
              <div className="p-4 bg-secondary/20 rounded-lg space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Guarantor 1</h4>
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
                  />
                </div>
              </div>
              <div className="p-4 bg-secondary/20 rounded-lg space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Guarantor 2 (Optional)</h4>
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
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Location Details</h3>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cellOrVillage">Cell / Village</Label>
                  <Input
                    id="cellOrVillage"
                    value={formData.cellOrVillage}
                    onChange={(e) => handleChange("cellOrVillage", e.target.value)}
                    placeholder="Enter cell or village"
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
              </div>
            </div>
          )}

          {/* Step 4: Agent Information */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Agent Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Agent Name *</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="agentPhone">Agent Phone *</Label>
                  <Input
                    id="agentPhone"
                    value={formData.agentPhone}
                    onChange={(e) => handleChange("agentPhone", e.target.value)}
                    placeholder="e.g., 0700000000"
                  />
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  ✓ Review all information before completing the conversion
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {step < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.landlord || !formData.landlordContact)) ||
                (step === 3 && !formData.serviceCenter) ||
                (step === 4 && (!formData.agentName || !formData.agentPhone))
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Conversion
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
