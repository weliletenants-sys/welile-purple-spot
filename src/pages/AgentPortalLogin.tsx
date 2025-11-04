import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WelileLogo } from "@/components/WelileLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCheck, LogIn } from "lucide-react";

const AgentPortalLogin = () => {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agentName || !agentPhone) {
      toast.error("Please enter both name and phone number");
      return;
    }

    setIsLoading(true);
    try {
      // Verify agent exists
      const { data: tenants } = await supabase
        .from('tenants')
        .select('agent_name, agent_phone')
        .eq('agent_name', agentName)
        .eq('agent_phone', agentPhone)
        .limit(1);

      if (!tenants || tenants.length === 0) {
        toast.error("Agent not found. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Store agent info in session storage
      sessionStorage.setItem('agentName', agentName);
      sessionStorage.setItem('agentPhone', agentPhone);
      
      toast.success(`Welcome back, ${agentName}!`);
      navigate('/agent-portal');
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <WelileLogo />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              Agent Portal
            </CardTitle>
            <CardDescription className="mt-2">
              Access your performance dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                placeholder="Enter your full name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentPhone">Phone Number</Label>
              <Input
                id="agentPhone"
                placeholder="Enter your phone number"
                value={agentPhone}
                onChange={(e) => setAgentPhone(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="h-4 w-4 mr-2" />
              {isLoading ? 'Logging in...' : 'Access Portal'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentPortalLogin;
