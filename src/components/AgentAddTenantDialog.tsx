import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentAddTenantDialogProps {
  agentName: string;
  agentPhone: string;
}

export const AgentAddTenantDialog = ({ agentName, agentPhone }: AgentAddTenantDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addTenant } = useTenants();
  const { data: serviceCenters = [] } = useServiceCenters();
  
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    landlord: "",
    landlordContact: "",
    rentAmount: "",
    registrationFee: "10000",
    accessFee: "0",
    repaymentDays: "60" as "30" | "60" | "90",
    status: "pending" as const,
    paymentStatus: "pending" as const,
    serviceCenter: "",
  });

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setFormData(prev => ({
        ...prev,
        name: "",
        contact: "",
        address: "",
        landlord: "",
        landlordContact: "",
        rentAmount: "",
        serviceCenter: "",
      }));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.contact.trim() || !formData.address.trim() || 
        !formData.landlord.trim() || !formData.landlordContact.trim() || !formData.rentAmount || 
        !formData.serviceCenter) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
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
      await addTenant({
        name: formData.name.trim().toUpperCase(),
        contact: formData.contact.trim(),
        address: formData.address.trim(),
        landlord: formData.landlord.trim().toUpperCase(),
        landlordContact: formData.landlordContact.trim(),
        rentAmount,
        registrationFee: parseFloat(formData.registrationFee),
        accessFee: parseFloat(formData.accessFee),
        repaymentDays: parseInt(formData.repaymentDays) as 30 | 60 | 90,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        performance: 80,
        location: {
          country: "Uganda",
          county: "",
          district: "",
          subcountyOrWard: "",
          cellOrVillage: "",
        },
        guarantor1: { name: "", contact: "" },
        guarantor2: { name: "", contact: "" },
        agentName,
        agentPhone,
        serviceCenter: formData.serviceCenter,
      });

      toast({
        title: "Success",
        description: "Tenant added successfully",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error adding tenant:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add tenant",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Tenant for {agentName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tenant Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter tenant name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact *</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="landlord">Landlord Name *</Label>
                <Input
                  id="landlord"
                  value={formData.landlord}
                  onChange={(e) => setFormData({ ...formData, landlord: e.target.value })}
                  placeholder="Landlord name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landlordContact">Landlord Contact *</Label>
                <Input
                  id="landlordContact"
                  value={formData.landlordContact}
                  onChange={(e) => setFormData({ ...formData, landlordContact: e.target.value })}
                  placeholder="Landlord phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Rent Amount *</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                  placeholder="Monthly rent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repaymentDays">Repayment Days *</Label>
                <Select
                  value={formData.repaymentDays}
                  onValueChange={(value: "30" | "60" | "90") => 
                    setFormData({ ...formData, repaymentDays: value })
                  }
                >
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceCenter">Service Center *</Label>
              <Select
                value={formData.serviceCenter}
                onValueChange={(value) => setFormData({ ...formData, serviceCenter: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service center" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCenters.map((center) => (
                    <SelectItem key={center.name} value={center.name}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Tenant
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
