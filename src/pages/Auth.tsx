import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be less than 100 characters" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [errors, setErrors] = useState<{
    login?: { email?: string; password?: string };
    signup?: { email?: string; password?: string };
  }>({});

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const validation = authSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    });

    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as "email" | "password"] = err.message;
        }
      });
      setErrors({ login: fieldErrors });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      let errorMessage = "Login failed. Please try again.";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email address.";
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });

    navigate("/");
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const validation = authSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
    });

    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as "email" | "password"] = err.message;
        }
      });
      setErrors({ signup: fieldErrors });
      return;
    }

    setIsLoading(true);

    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      let errorMessage = "Signup failed. Please try again.";
      if (error.message.includes("User already registered")) {
        errorMessage = "This email is already registered. Please login instead.";
      } else if (error.message.includes("Password")) {
        errorMessage = error.message;
      }

      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Account Created!",
      description: "Your account has been created successfully. You can now login.",
    });

    // Switch to login tab
    setLoginEmail(validation.data.email);
    setSignupEmail("");
    setSignupPassword("");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Welcome to Tenants Hub
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to access admin features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      className={errors.login?.email ? "border-destructive" : ""}
                    />
                    {errors.login?.email && (
                      <p className="text-sm text-destructive">
                        {errors.login.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      className={
                        errors.login?.password ? "border-destructive" : ""
                      }
                    />
                    {errors.login?.password && (
                      <p className="text-sm text-destructive">
                        {errors.login.password}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <LogIn className="h-4 w-4 mr-2" />
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isLoading}
                      className={
                        errors.signup?.email ? "border-destructive" : ""
                      }
                    />
                    {errors.signup?.email && (
                      <p className="text-sm text-destructive">
                        {errors.signup.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isLoading}
                      className={
                        errors.signup?.password ? "border-destructive" : ""
                      }
                    />
                    {errors.signup?.password && (
                      <p className="text-sm text-destructive">
                        {errors.signup.password}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Contact your administrator to get admin access
        </p>
      </div>
    </div>
  );
};

export default Auth;
