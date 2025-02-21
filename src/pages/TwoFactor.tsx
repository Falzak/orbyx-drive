import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, LockKeyhole } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TwoFactor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate("/auth");
        return;
      }

      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (mfaData?.currentLevel === 'aal2' || mfaData?.nextLevel !== 'aal2') {
        navigate("/");
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp[0];

      if (!totpFactor) {
        throw new Error("Fator TOTP não encontrado");
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: otpCode
      });

      if (verifyError) throw verifyError;

      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (mfaData?.currentLevel === 'aal2') {
        navigate("/");
      } else {
        throw new Error("Falha na verificação do código");
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Código inválido",
      });
    } finally {
      setLoading(false);
      setOtpCode("");
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-background p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4"
        onClick={() => navigate("/auth")}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="space-y-4">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 rounded-full bg-secondary">
              <Shield className="h-6 w-6 text-secondary-foreground" />
            </div>
          </motion.div>
          <CardTitle className="text-xl font-semibold text-center">
            Verificação em duas etapas
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                className="gap-2"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="rounded-md w-10 h-10 text-center text-base"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Verificando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    <span>Verificar</span>
                  </div>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
