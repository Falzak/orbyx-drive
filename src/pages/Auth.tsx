import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/App";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { supabase } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/");
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email,
          },
        },
      });

      if (error) throw error;
      navigate("/");
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid h-screen place-items-center">
      <Card className="w-[450px] shadow-xl">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleSignIn} disabled={loading}>
            Sign In
          </Button>
          <Button variant="secondary" onClick={handleSignUp} disabled={loading}>
            Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
