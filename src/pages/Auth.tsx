
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: undefined
        }
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.factors?.length) {
        setShowOtpDialog(true);
      } else {
        navigate("/");
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Verifique seu email para confirmar sua conta",
      });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Verifique seu email para redefinir sua senha",
      });
      
      setShowResetPassword(false);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "totp"
      });

      if (error) throw error;

      navigate("/");
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Código inválido",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

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

  const passwordStrength = calculatePasswordStrength(password);
  const passwordStrengthColor = getPasswordStrengthColor(passwordStrength);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-8">
        <Tabs
          defaultValue="signin"
          className="w-full"
          onValueChange={resetForm}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  type="email"
                  id="signin-email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Label htmlFor="signin-password">Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="signin-password"
                    placeholder="Senha"
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
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => setShowResetPassword(true)}
              >
                Esqueceu sua senha?
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Carregando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  type="email"
                  id="signup-email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Senha</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="signup-password"
                      placeholder="Senha"
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
                  {password && (
                    <div className="space-y-1">
                      <Progress
                        value={passwordStrength}
                        className={`h-1 ${passwordStrengthColor}`}
                      />
                      <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                        <li
                          className={
                            password.length >= 8 ? "text-green-500" : ""
                          }
                        >
                          Mínimo de 8 caracteres
                        </li>
                        <li
                          className={
                            /[A-Z]/.test(password) ? "text-green-500" : ""
                          }
                        >
                          Letra maiúscula
                        </li>
                        <li
                          className={
                            /[0-9]/.test(password) ? "text-green-500" : ""
                          }
                        >
                          Número
                        </li>
                        <li
                          className={
                            /[^A-Za-z0-9]/.test(password)
                              ? "text-green-500"
                              : ""
                          }
                        >
                          Caractere especial
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    placeholder="Confirmar Senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Carregando..." : "Cadastrar"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificação em duas etapas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Digite o código de verificação gerado pelo seu aplicativo autenticador
              </p>
              <InputOTP
                value={otpCode}
                onChange={setOtpCode}
                maxLength={6}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} />
                    ))}
                  </InputOTPGroup>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Verificando..." : "Verificar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                type="email"
                id="reset-email"
                placeholder="Digite seu email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Enviando..." : "Enviar email de recuperação"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
