import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, LogIn, UserPlus, Lock, Mail } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "@/hooks/use-local-storage";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
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
  const [trustedDevices, setTrustedDevices] = useLocalStorage<string[]>("trusted_devices", []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check 2FA status before proceeding with navigation
      const { data: mfaData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp.length > 0 ? factors.totp[0] : null;

      // Check if this device is trusted
      if (
        mfaData?.currentLevel === "aal1" &&
        mfaData?.nextLevel === "aal2" &&
        totpFactor &&
        data.user
      ) {
        const userId = data.user.id;
        
        // If this is a trusted device, try to auto-verify 2FA
        if (trustedDevices.includes(userId)) {
          try {
            // Try to auto-verify without showing 2FA screen
            const { data: challengeData, error: challengeError } =
              await supabase.auth.mfa.challenge({
                factorId: totpFactor.id,
              });

            if (challengeError) {
              // If auto-verification fails, show 2FA screen
              navigate("/two-factor");
              return;
            }

            // Auto-verify with empty code to get to AAL2 without user input
            const { error: verifyError } = await supabase.auth.mfa.verify({
              factorId: totpFactor.id,
              challengeId: challengeData.id,
              code: "",
              sessionId: data.session?.access_token,
            });

            if (verifyError) {
              // If verification fails, show 2FA screen
              navigate("/two-factor");
              return;
            }

            // If auto-verification succeeds, navigate to dashboard
            navigate("/");
            return;
          } catch (error) {
            console.error("Error auto-verifying trusted device:", error);
            // If auto-verification fails, remove from trusted devices and show 2FA screen
            setTrustedDevices(trustedDevices.filter(id => id !== userId));
            navigate("/two-factor");
            return;
          }
        } else {
          // If not a trusted device, show 2FA screen
          navigate("/two-factor");
          return;
        }
      }

      // Only navigate to dashboard if 2FA is not required or already verified
      navigate("/");
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error instanceof Error ? error.message : t("auth.errors.generic"),
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
        title: t("common.error"),
        description: t("auth.errors.passwordsDontMatch"),
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
        title: t("common.success"),
        description: t("auth.success.signUp"),
      });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error instanceof Error ? error.message : t("auth.errors.generic"),
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
        title: t("common.success"),
        description: t("auth.success.resetPassword"),
      });

      setShowResetPassword(false);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error instanceof Error ? error.message : t("auth.errors.generic"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.totp[0];

      if (!totpFactor) {
        throw new Error(t("auth.errors.invalidCode"));
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        });

      if (challengeError) throw challengeError;

      const { data: verifyData, error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challengeData.id,
          code: otpCode,
        });

      if (verifyError) throw verifyError;

      // Check if verification was successful
      const { data: mfaData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (mfaData?.currentLevel === "aal2") {
        setShowOtpDialog(false);
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
    <div className="flex items-center justify-center min-h-screen bg-[url('/auth-background.svg')] bg-cover bg-center bg-no-repeat">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="z-10 w-full max-w-md p-4"
      >
        <Card className="overflow-hidden border border-border/40 shadow-xl bg-card/90 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {t("auth.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("auth.description")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              defaultValue="signin"
              className="w-full"
              onValueChange={resetForm}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {t("auth.signIn.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("auth.signUp.title")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <motion.form
                  onSubmit={handleSignIn}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-email"
                      className="text-sm font-medium"
                    >
                      {t("auth.signIn.email")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        id="signin-email"
                        placeholder={t("auth.signIn.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-background/50"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="signin-password"
                        className="text-sm font-medium"
                      >
                        {t("auth.signIn.password")}
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs font-normal"
                        onClick={() => setShowResetPassword(true)}
                      >
                        {t("auth.signIn.forgotPassword")}
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        id="signin-password"
                        placeholder={t("auth.signIn.passwordPlaceholder")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11 bg-background/50"
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

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 mt-2 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>{t("auth.signIn.buttonLoading")}</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            <span>{t("auth.signIn.button")}</span>
                          </>
                        )}
                      </span>
                    </Button>
                  </motion.div>
                </motion.form>
              </TabsContent>

              <TabsContent value="signup">
                <motion.form
                  onSubmit={handleSignUp}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="text-sm font-medium"
                    >
                      {t("auth.signUp.email")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        id="signup-email"
                        placeholder={t("auth.signUp.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-background/50"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-sm font-medium"
                    >
                      {t("auth.signUp.password")}
                    </Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          id="signup-password"
                          placeholder={t("auth.signUp.passwordPlaceholder")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 h-11 bg-background/50"
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
                        <div className="space-y-2">
                          <Progress
                            value={passwordStrength}
                            className={`h-1 ${passwordStrengthColor}`}
                          />
                          <motion.ul
                            className="text-xs text-muted-foreground grid grid-cols-2 gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <motion.li
                              className={`flex items-center gap-1 ${
                                password.length >= 8 ? "text-green-500" : ""
                              }`}
                              animate={{
                                scale: password.length >= 8 ? [1, 1.05, 1] : 1,
                                transition: { duration: 0.2 },
                              }}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  password.length >= 8
                                    ? "bg-green-500"
                                    : "bg-muted-foreground"
                                }`}
                              ></div>
                              {t("auth.passwordStrength.minLength")}
                            </motion.li>
                            <motion.li
                              className={`flex items-center gap-1 ${
                                /[A-Z]/.test(password) ? "text-green-500" : ""
                              }`}
                              animate={{
                                scale: /[A-Z]/.test(password)
                                  ? [1, 1.05, 1]
                                  : 1,
                                transition: { duration: 0.2 },
                              }}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  /[A-Z]/.test(password)
                                    ? "bg-green-500"
                                    : "bg-muted-foreground"
                                }`}
                              ></div>
                              {t("auth.passwordStrength.uppercase")}
                            </motion.li>
                            <motion.li
                              className={`flex items-center gap-1 ${
                                /[0-9]/.test(password) ? "text-green-500" : ""
                              }`}
                              animate={{
                                scale: /[0-9]/.test(password)
                                  ? [1, 1.05, 1]
                                  : 1,
                                transition: { duration: 0.2 },
                              }}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  /[0-9]/.test(password)
                                    ? "bg-green-500"
                                    : "bg-muted-foreground"
                                }`}
                              ></div>
                              {t("auth.passwordStrength.number")}
                            </motion.li>
                            <motion.li
                              className={`flex items-center gap-1 ${
                                /[^A-Za-z0-9]/.test(password)
                                  ? "text-green-500"
                                  : ""
                              }`}
                              animate={{
                                scale: /[^A-Za-z0-9]/.test(password)
                                  ? [1, 1.05, 1]
                                  : 1,
                                transition: { duration: 0.2 },
                              }}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  /[^A-Za-z0-9]/.test(password)
                                    ? "bg-green-500"
                                    : "bg-muted-foreground"
                                }`}
                              ></div>
                              {t("auth.passwordStrength.special")}
                            </motion.li>
                          </motion.ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm-password"
                      className="text-sm font-medium"
                    >
                      {t("auth.signUp.confirmPassword")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm-password"
                        placeholder={t(
                          "auth.signUp.confirmPasswordPlaceholder"
                        )}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-11 bg-background/50"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 mt-2 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>{t("auth.signUp.buttonLoading")}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            <span>{t("auth.signUp.button")}</span>
                          </>
                        )}
                      </span>
                    </Button>
                  </motion.div>
                </motion.form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md border border-border/40 shadow-lg bg-card/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              {t("auth.twoFactor.title")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("auth.twoFactor.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
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
                      className="h-12 w-12 rounded-md border-border/40 bg-background/50"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full h-11 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>{t("auth.twoFactor.buttonLoading")}</span>
                  </>
                ) : (
                  <span>{t("auth.twoFactor.button")}</span>
                )}
              </span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="sm:max-w-md border border-border/40 shadow-lg bg-card/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              {t("auth.resetPassword.title")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("auth.resetPassword.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">
                {t("auth.resetPassword.email")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  id="reset-email"
                  placeholder={t("auth.resetPassword.emailPlaceholder")}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 h-11 bg-background/50"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>{t("auth.resetPassword.buttonLoading")}</span>
                  </>
                ) : (
                  <span>{t("auth.resetPassword.button")}</span>
                )}
              </span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
