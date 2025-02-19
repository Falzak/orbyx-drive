
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verifica se existe um token de recuperação na URL
  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.substring(1));
    if (!hashParams.get("type") || !hashParams.get("access_token")) {
      navigate("/auth");
    }
  }, [location, navigate]);

  const calculatePasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 25) return "bg-destructive";
    if (strength <= 50) return "bg-yellow-500";
    if (strength <= 75) return "bg-orange-500";
    return "bg-green-500";
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso.",
      });

      navigate("/auth");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro ao atualizar sua senha",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(password);
  const passwordStrengthColor = getPasswordStrengthColor(passwordStrength);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-8">
        <form onSubmit={handleResetPassword} className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Redefinir Senha</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {password && (
              <div className="space-y-1">
                <Progress
                  value={passwordStrength}
                  className={`h-1 ${passwordStrengthColor}`}
                />
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  <li className={password.length >= 8 ? "text-green-500" : ""}>
                    Mínimo de 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(password) ? "text-green-500" : ""}>
                    Letra maiúscula
                  </li>
                  <li className={/[0-9]/.test(password) ? "text-green-500" : ""}>
                    Número
                  </li>
                  <li
                    className={
                      /[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""
                    }
                  >
                    Caractere especial
                  </li>
                </ul>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Atualizando..." : "Atualizar Senha"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
