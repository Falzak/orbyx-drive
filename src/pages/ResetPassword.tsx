import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { Eye, EyeOff, Lock, KeyRound, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
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
        password: password,
      });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("auth.success.passwordUpdated"),
      });

      navigate("/auth");
    } catch (error) {
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
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-20 bg-background/50 backdrop-blur-sm"
          onClick={() => navigate("/auth")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Card className="overflow-hidden border border-border/40 shadow-xl bg-card/90 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {t("auth.newPassword.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("auth.newPassword.description")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <motion.form
              onSubmit={handleResetPassword}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t("auth.newPassword.password")}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder={t("auth.newPassword.passwordPlaceholder")}
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
                          scale: /[A-Z]/.test(password) ? [1, 1.05, 1] : 1,
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
                          scale: /[0-9]/.test(password) ? [1, 1.05, 1] : 1,
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
                          /[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""
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

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full h-11 relative overflow-hidden group"
                  disabled={isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>{t("auth.newPassword.buttonLoading")}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        <span>{t("auth.newPassword.button")}</span>
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
