import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";

interface AgentQuickAddDialogProps {
  agentName: string;
  agentPhone: string;
}

export const AgentQuickAddDialog = ({ agentName, agentPhone }: AgentQuickAddDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addTenant } = useTenants();
  const { data: serviceCenters = [] } = useServiceCenters();
  
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    rentAmount: "",
    serviceCenter: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        contact: "",
        address: "",
        rentAmount: "",
        serviceCenter: "",
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.contact.trim() || !formData.address.trim() || 
        !formData.rentAmount || !formData.serviceCenter) {
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
        landlord: "TBD",
        landlordContact: "0000000000",
        rentAmount,
        registrationFee: 0,
        accessFee: 0,
        repaymentDays: 60 as 30 | 60 | 90,
        status: "pending" as const,
        paymentStatus: "pending" as const,
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
        description: "Tenant added quickly!",
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
        <Button variant="secondary" className="gap-2">
          <Zap className="h-4 w-4" />
          Quick Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Tenant for {agentName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
            />
          </div>

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
              Quick Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
