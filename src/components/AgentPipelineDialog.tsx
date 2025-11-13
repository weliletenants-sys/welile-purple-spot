import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";
import { ScrollArea } from "@/components/ui/scroll-area";
import ugandaLocations from "@/data/ugandaLocations";

interface AgentPipelineDialogProps {
  agentName: string;
  agentPhone: string;
}

export const AgentPipelineDialog = ({ agentName, agentPhone }: AgentPipelineDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: serviceCenters = [] } = useServiceCenters();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    district: "",
    rentAmount: "",
    serviceCenter: "",
    referrerName: "",
    referrerPhone: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        contact: "",
        address: "",
        district: "",
        rentAmount: "",
        serviceCenter: "",
        referrerName: agentName,
        referrerPhone: agentPhone,
      });
    }
  }, [open, agentName, agentPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.contact.trim() || !formData.district || 
        !formData.referrerName.trim() || !formData.referrerPhone.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const rentAmount = parseFloat(formData.rentAmount) || 0;

      const { error } = await supabase.from("tenants").insert({
        name: formData.name.trim().toUpperCase(),
        contact: formData.contact.trim(),
        address: formData.address.trim() || formData.district,
        location_district: formData.district,
        landlord: "TBD",
        landlord_contact: "0000000000",
        rent_amount: rentAmount,
        registration_fee: 0,
        access_fee: 0,
        repayment_days: 60,
        status: "pipeline",
        payment_status: "pending",
        performance: 80,
        agent_name: formData.referrerName,
        agent_phone: formData.referrerPhone,
        service_center: formData.serviceCenter || "Not Assigned",
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Pipeline tenant added for ${agentName}!`,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error adding pipeline tenant:", error);
      toast({
        title: "Error",
        description: "Failed to add pipeline tenant",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Add Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Pipeline Tenant for {agentName}</DialogTitle>
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
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => setFormData({ ...formData, district: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {ugandaLocations.districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Expected Rent (Optional)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                  placeholder="Monthly rent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceCenter">Service Center</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referrerName">Referrer Name *</Label>
                <Input
                  id="referrerName"
                  value={formData.referrerName}
                  onChange={(e) => setFormData({ ...formData, referrerName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referrerPhone">Referrer Phone *</Label>
                <Input
                  id="referrerPhone"
                  value={formData.referrerPhone}
                  onChange={(e) => setFormData({ ...formData, referrerPhone: e.target.value })}
                  placeholder="Your phone"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Adding..." : "Add Pipeline Tenant"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
