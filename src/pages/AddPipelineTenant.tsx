import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAgents } from "@/hooks/useAgents";
import { useServiceCenters } from "@/hooks/useServiceCenterAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { ShareButton } from "@/components/ShareButton";
import { BackToHome } from "@/components/BackToHome";
import { WelileLogo } from "@/components/WelileLogo";
import { 
  TrendingUp, 
  Users, 
  Zap, 
  DollarSign, 
  MapPin, 
  Phone, 
  Home,
  Sparkles,
  Trophy,
  Target
} from "lucide-react";
import ugandaLocations from "@/data/ugandaLocations";

interface FormData {
  name: string;
  contact: string;
  address: string;
  district: string;
  rentAmount: string;
  agentName: string;
  agentPhone: string;
  serviceCenter: string;
  referrerName: string;
  referrerPhone: string;
}

const AddPipelineTenant = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: agents = [] } = useAgents();
  const { data: serviceCenters = [] } = useServiceCenters();
  const [submitting, setSubmitting] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [tenantsAdded, setTenantsAdded] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    contact: "",
    address: "",
    district: "",
    rentAmount: "",
    agentName: "",
    agentPhone: "",
    serviceCenter: "",
    referrerName: "",
    referrerPhone: "",
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAgentChange = (agentName: string) => {
    const selectedAgent = agents.find((agent) => agent.name === agentName);
    setFormData((prev) => ({
      ...prev,
      agentName,
      agentPhone: selectedAgent?.phone || "",
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter the tenant's name",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.contact.trim() || formData.contact.length < 9) {
      toast({
        title: "Invalid Contact",
        description: "Please enter a valid phone number (at least 9 digits)",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.district) {
      toast({
        title: "Missing District",
        description: "Please select a district",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.referrerName.trim() || !formData.referrerPhone.trim()) {
      toast({
        title: "Missing Referrer Info",
        description: "Please enter your name and phone number to earn rewards",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const rentAmount = parseFloat(formData.rentAmount) || 0;

      // Insert tenant
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: formData.name.trim().toUpperCase(),
          contact: formData.contact.trim(),
          address: formData.address.trim() || "TBD",
          location_district: formData.district,
          landlord: "TBD",
          landlord_contact: "0000000000",
          rent_amount: rentAmount,
          repayment_days: 30,
          status: "pipeline",
          payment_status: "pending",
          agent_name: formData.agentName || "UNASSIGNED",
          agent_phone: formData.agentPhone || "",
          service_center: formData.serviceCenter || "",
          registration_fee: 0,
          access_fee: 0,
          source: "pipeline_referral",
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Award UGX 100 to referrer
      const { error: earningsError } = await supabase.from("agent_earnings").insert({
        agent_name: formData.referrerName.trim().toUpperCase(),
        agent_phone: formData.referrerPhone.trim(),
        earning_type: "pipeline_referral",
        amount: 100,
        tenant_id: tenant.id,
      });

      if (earningsError) throw earningsError;

      // Update local state
      setTotalEarned((prev) => prev + 100);
      setTenantsAdded((prev) => prev + 1);

      toast({
        title: "🎉 Success! You Earned UGX 100!",
        description: `${formData.name} added to pipeline. Keep adding more tenants to earn more!`,
      });

      // Reset form
      setFormData({
        name: "",
        contact: "",
        address: "",
        district: "",
        rentAmount: "",
        agentName: "",
        agentPhone: "",
        serviceCenter: "",
        referrerName: formData.referrerName,
        referrerPhone: formData.referrerPhone,
      });
    } catch (error: any) {
      console.error("Error adding pipeline tenant:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add tenant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackToHome />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <WelileLogo />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Earn UGX 100 Per Tenant! 💰
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us grow by adding pipeline tenants from all over Uganda
          </p>
        </div>

        {/* Earnings Dashboard */}
        {tenantsAdded > 0 && (
          <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Tenants Added</p>
                  </div>
                  <p className="text-3xl font-bold text-primary">{tenantsAdded}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">UGX {totalEarned.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Motivation Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Instant Rewards</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Earn UGX 100 immediately for every pipeline tenant you add
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                <CardTitle className="text-lg">No Limits</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add as many tenants as you want. The more you add, the more you earn!
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Help Uganda Grow</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Expand our reach across all districts of Uganda
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add Pipeline Tenant
            </CardTitle>
            <CardDescription>
              Fill in the basic information. All fields are important to earn your reward!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Referrer Information */}
                <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Your Information (to receive rewards)
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referrer-name">Your Full Name *</Label>
                      <Input
                        id="referrer-name"
                        value={formData.referrerName}
                        onChange={(e) => handleChange("referrerName", e.target.value)}
                        placeholder="Enter your name"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referrer-phone">Your Phone Number *</Label>
                      <Input
                        id="referrer-phone"
                        value={formData.referrerPhone}
                        onChange={(e) => handleChange("referrerPhone", e.target.value)}
                        placeholder="0700000000"
                        required
                        maxLength={13}
                      />
                    </div>
                  </div>

                  <Alert className="bg-primary/10 border-primary/30">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      UGX 100 will be credited to this phone number for each tenant added
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Tenant Information */}
                <div className="space-y-4 p-4 bg-secondary/10 rounded-lg border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Tenant Information
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="tenant-name">Tenant Full Name *</Label>
                    <Input
                      id="tenant-name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter tenant's full name"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenant-contact">
                        <Phone className="h-3 w-3 inline mr-1" />
                        Contact Number *
                      </Label>
                      <Input
                        id="tenant-contact"
                        value={formData.contact}
                        onChange={(e) => handleChange("contact", e.target.value)}
                        placeholder="0700000000 or 256700000000"
                        required
                        maxLength={13}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rent-amount">Expected Rent (UGX)</Label>
                      <Input
                        id="rent-amount"
                        type="number"
                        value={formData.rentAmount}
                        onChange={(e) => handleChange("rentAmount", e.target.value)}
                        placeholder="e.g., 50000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenant-address">
                      <Home className="h-3 w-3 inline mr-1" />
                      Address / Location
                    </Label>
                    <Input
                      id="tenant-address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Enter physical address or landmark"
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      District in Uganda *
                    </Label>
                    <Select value={formData.district} onValueChange={(value) => handleChange("district", value)}>
                      <SelectTrigger id="district">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {ugandaLocations.districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Optional: Agent & Service Center */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Optional: Agent Assignment
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agent">Assign to Agent (optional)</Label>
                      <Select value={formData.agentName} onValueChange={handleAgentChange}>
                        <SelectTrigger id="agent">
                          <SelectValue placeholder="Select an agent" />
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
                      <Label htmlFor="service-center">Service Center (optional)</Label>
                      <Select
                        value={formData.serviceCenter}
                        onValueChange={(value) => handleChange("serviceCenter", value)}
                      >
                        <SelectTrigger id="service-center">
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
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Zap className="h-5 w-5 mr-2 animate-spin" />
                      Adding Tenant...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5 mr-2" />
                      Add Tenant & Earn UGX 100
                    </>
                  )}
                </Button>
              </form>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-center">Share This Page & Earn More!</CardTitle>
            <CardDescription className="text-center">
              Invite others to add tenants. You all benefit from growing the network!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ShareButton
              title="Earn UGX 100 Per Tenant - Add Pipeline Tenants to Welile Hub"
              text={`Join me in earning money by adding pipeline tenants! Earn UGX 100 for each tenant you add from anywhere in Uganda. ${shareUrl}`}
              url={shareUrl}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddPipelineTenant;
