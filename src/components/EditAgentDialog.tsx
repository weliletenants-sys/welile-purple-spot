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
import { Pencil } from "lucide-react";
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

interface Agent {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
}

interface EditAgentDialogProps {
  agent: Agent;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export const EditAgentDialog = ({ agent, onSuccess, children }: EditAgentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(agent.name);
  const [phone, setPhone] = useState(agent.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const { toast } = useToast();

  const resetForm = () => {
    setName(agent.name);
    setPhone(agent.phone || "");
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

    // Check for duplicate name (excluding current agent)
    const { data: existing, error: checkError } = await supabase
      .from("agents")
      .select("id")
      .eq("name", validation.data.name.toUpperCase())
      .neq("id", agent.id)
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

    // Update agent
    const { error: updateError } = await supabase
      .from("agents")
      .update({
        name: validation.data.name.toUpperCase(),
        phone: validation.data.phone || "",
      })
      .eq("id", agent.id);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Success",
      description: `Agent ${validation.data.name.toUpperCase()} updated successfully`,
    });

    setOpen(false);
    setIsSubmitting(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>
            Update agent information. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Agent Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
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
            <Label htmlFor="edit-phone">Phone Number</Label>
            <Input
              id="edit-phone"
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
            {isSubmitting ? "Updating..." : "Update Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
