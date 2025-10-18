import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tenants, DailyPayment } from "@/data/tenants";

interface TenantFormData {
  name: string;
  contact: string;
  address: string;
  landlord: string;
  landlordContact: string;
  rentAmount: string;
  repaymentDays: "30" | "60" | "90";
  status: "active" | "pending" | "review";
  paymentStatus: "paid" | "pending";
}

const generateDailyPayments = (days: number): DailyPayment[] => {
  const payments: DailyPayment[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    payments.push({
      date: date.toISOString().split('T')[0],
      amount: 0,
      paid: false,
    });
  }
  return payments;
};

export const AddTenantForm = ({ onTenantAdded }: { onTenantAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    contact: "",
    address: "",
    landlord: "",
    landlordContact: "",
    rentAmount: "",
    repaymentDays: "60",
    status: "active",
    paymentStatus: "pending",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TenantFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TenantFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!formData.contact.trim()) {
      newErrors.contact = "Contact is required";
    } else if (!/^[0-9+\s-()]+$/.test(formData.contact)) {
      newErrors.contact = "Invalid contact format";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length > 200) {
      newErrors.address = "Address must be less than 200 characters";
    }

    if (!formData.landlord.trim()) {
      newErrors.landlord = "Landlord name is required";
    }

    if (!formData.landlordContact.trim()) {
      newErrors.landlordContact = "Landlord contact is required";
    } else if (!/^[0-9+\s-()]+$/.test(formData.landlordContact)) {
      newErrors.landlordContact = "Invalid contact format";
    }

    const rentAmount = parseFloat(formData.rentAmount);
    if (!formData.rentAmount || isNaN(rentAmount) || rentAmount <= 0) {
      newErrors.rentAmount = "Valid rent amount is required";
    } else if (rentAmount > 100000000) {
      newErrors.rentAmount = "Rent amount too high";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    const newTenant = {
      id: (tenants.length + 1).toString(),
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      address: formData.address.trim(),
      landlord: formData.landlord.trim(),
      landlordContact: formData.landlordContact.trim(),
      rentAmount: parseFloat(formData.rentAmount),
      repaymentDays: parseInt(formData.repaymentDays) as 30 | 60 | 90,
      status: formData.status,
      paymentStatus: formData.paymentStatus,
      performance: 80, // Default performance score for new tenants
      dailyPayments: generateDailyPayments(parseInt(formData.repaymentDays)),
    };

    tenants.push(newTenant);

    toast({
      title: "Tenant Added Successfully",
      description: `${newTenant.name} has been added to the system`,
    });

    // Reset form
    setFormData({
      name: "",
      contact: "",
      address: "",
      landlord: "",
      landlordContact: "",
      rentAmount: "",
      repaymentDays: "60",
      status: "active",
      paymentStatus: "pending",
    });
    setErrors({});
    setOpen(false);
    onTenantAdded();
  };

  const handleChange = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
          <DialogTitle className="text-2xl font-bold text-primary">Add New Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
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
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                placeholder="e.g., 0700000000"
                className={errors.contact ? "border-destructive" : ""}
              />
              {errors.contact && <p className="text-sm text-destructive">{errors.contact}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter tenant's address"
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>
          </div>

          {/* Landlord Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Landlord Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="landlord">Landlord Name *</Label>
              <Input
                id="landlord"
                value={formData.landlord}
                onChange={(e) => handleChange("landlord", e.target.value)}
                placeholder="Enter landlord's name"
                className={errors.landlord ? "border-destructive" : ""}
              />
              {errors.landlord && <p className="text-sm text-destructive">{errors.landlord}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="landlordContact">Landlord Contact *</Label>
              <Input
                id="landlordContact"
                value={formData.landlordContact}
                onChange={(e) => handleChange("landlordContact", e.target.value)}
                placeholder="e.g., 0700000000"
                className={errors.landlordContact ? "border-destructive" : ""}
              />
              {errors.landlordContact && <p className="text-sm text-destructive">{errors.landlordContact}</p>}
            </div>
          </div>

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
                className={errors.rentAmount ? "border-destructive" : ""}
              />
              {errors.rentAmount && <p className="text-sm text-destructive">{errors.rentAmount}</p>}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Tenant
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
