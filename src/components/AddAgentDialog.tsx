import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { z } from "zod";

const agentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  phone: z
    .string()
    .trim()
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional(),
});

interface AddAgentDialogProps {
  onSuccess?: () => void;
}

export const AddAgentDialog = ({ onSuccess }: AddAgentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setPhone("");
    setErrors({});
  };

  const handleSubmit = async () => {
    setErrors({});

    // Validate input
    const validation = agentSchema.safeParse({ name, phone });
    if (!validation.success) {
      const fieldErrors: { name?: string; phone?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as "name" | "phone"] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    // Check for duplicate name
    const { data: existing, error: checkError } = await supabase
      .from("agents")
      .select("id")
      .eq("name", validation.data.name.toUpperCase())
      .maybeSingle();

    if (checkError) {
      toast({
        title: "Error",
        description: "Failed to check for duplicate agents",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (existing) {
      setErrors({ name: "An agent with this name already exists" });
      setIsSubmitting(false);
      return;
    }

    // Insert new agent
    const { error: insertError } = await supabase.from("agents").insert({
      name: validation.data.name.toUpperCase(),
      phone: validation.data.phone || "",
      is_active: true,
    });

    if (insertError) {
      toast({
        title: "Error",
        description: "Failed to add agent",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Success",
      description: `Agent ${validation.data.name.toUpperCase()} added successfully`,
    });

    resetForm();
    setOpen(false);
    setIsSubmitting(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-12 py-8 text-xl shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all hover:scale-110 animate-pulse-subtle">
          <UserPlus className="mr-3 h-7 w-7" />
          Add New Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>
            Create a new agent profile. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Agent Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number (optional)"
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
