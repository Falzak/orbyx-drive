
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalStorage } from "@/hooks/use-local-storage";

export default function TwoFactor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [trustedDevices, setTrustedDevices] = useLocalStorage<string[]>("trusted_devices", []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate("/auth");
        return;
      }

      const { data: mfaData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      // Check if this device is trusted
      const userId = session.session.user.id;
      if (trustedDevices.includes(userId)) {
        try {
          // Skip 2FA for trusted devices
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totpFactor = factors?.totp[0];

          if (totpFactor) {
            const { data: challengeData, error: challengeError } =
              await supabase.auth.mfa.challenge({
                factorId: totpFactor.id,
              });

            if (challengeError) throw challengeError;

            // Auto-verify with empty code to get to AAL2 without user input
            // This is just to update the authentication level on Supabase's side
            await supabase.auth.mfa.verify({
              factorId: totpFactor.id,
              challengeId: challengeData.id,
              code: "",
              sessionId: session.session.access_token,
            });
          }
          navigate("/");
          return;
        } catch (error) {
          console.error("Error auto-verifying trusted device:", error);
          // If auto-verification fails, remove from trusted devices
          setTrustedDevices(trustedDevices.filter(id => id !== userId));
        }
      }

      if (mfaData?.currentLevel === "aal2" || mfaData?.nextLevel !== "aal2") {
        navigate("/");
      }
    };

    checkAuthStatus();
  }, [navigate, trustedDevices, setTrustedDevices]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate("/auth");
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp[0];

      if (!totpFactor) {
        throw new Error(t("auth.errors.invalidCode"));
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: otpCode,
      });

      if (verifyError) throw verifyError;

      const { data: mfaData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (mfaData?.currentLevel === "aal2") {
        // If remember device is checked, add current user ID to trusted devices
        if (rememberDevice && session.session) {
          const userId = session.session.user.id;
          if (!trustedDevices.includes(userId)) {
            setTrustedDevices([...trustedDevices, userId]);
          }
        }
        
        navigate("/");
      } else {
        throw new Error(t("auth.errors.invalidCode"));
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error instanceof Error ? error.message : t("auth.errors.invalidCode"),
      });
    } finally {
      setLoading(false);
      setOtpCode("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[url('/auth-background.svg')] bg-cover bg-center bg-no-repeat">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-20 bg-background/50 backdrop-blur-sm"
        onClick={() => navigate("/auth")}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <motion.div
        className="w-full max-w-md p-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border border-border/40 shadow-xl bg-card/90 backdrop-blur">
          <CardHeader className="pb-4">
            <motion.div
              className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Shield className="h-8 w-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-center">
              {t("auth.twoFactor.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("auth.twoFactor.description")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
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
                        className="h-14 w-14 rounded-md text-center text-lg border-border/40 bg-background/50"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </motion.div>

              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Checkbox 
                  id="remember-device" 
                  checked={rememberDevice}
                  onCheckedChange={(checked) => setRememberDevice(checked === true)}
                />
                <label
                  htmlFor="remember-device"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {t("auth.twoFactor.rememberDevice")}
                </label>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full h-11 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <motion.div
                          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span>{t("auth.twoFactor.buttonLoading")}</span>
                      </>
                    ) : (
                      <>
                        <LockKeyhole className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        <span>{t("auth.twoFactor.button")}</span>
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>

              <motion.p
                className="text-xs text-center text-muted-foreground mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                {t("auth.twoFactor.support")}{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs font-normal"
                  onClick={() => navigate("/auth")}
                >
                  {t("auth.twoFactor.contactSupport")}
                </Button>
              </motion.p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
