import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail } from "lucide-react";

interface AgentAccountSetupProps {
  agentId: string;
  agentName: string;
  agentPhone: string;
  onSuccess?: () => void;
}

export function AgentAccountSetup({ agentId, agentName, agentPhone, onSuccess }: AgentAccountSetupProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: agentName,
          phone: agentPhone,
        },
      });

      if (authError) throw authError;

      // Link agent to auth user
      const { error: updateError } = await supabase
        .from('agents')
        .update({ user_id: authData.user.id })
        .eq('id', agentId);

      if (updateError) throw updateError;

      // Send magic link for first login
      const { error: linkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (linkError) throw linkError;

      toast.success(`Account created! Login link sent to ${email}`);
      onSuccess?.();
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || "Failed to setup account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Setup Agent Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSetup} className="space-y-4">
          <div className="space-y-2">
            <Label>Agent Name</Label>
            <Input value={agentName} disabled />
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={agentPhone} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="agent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              <Mail className="h-3 w-3 inline mr-1" />
              Agent will receive a login link at this email
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Setting up...' : 'Create Account & Send Login Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
