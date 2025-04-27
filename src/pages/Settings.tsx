import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/App";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  User,
  Settings as SettingsIcon,
  Shield,
  ChevronLeft,
  QrCode,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { AvatarUpload } from "@/components/AvatarUpload";

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { section = "profile" } = useParams();
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [showChangePasswordDialog, setShowChangePasswordDialog] =
    React.useState(false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [otpCode, setOtpCode] = React.useState("");
  const [isVerifying2FA, setIsVerifying2FA] = React.useState(false);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [has2FAEnabled, setHas2FAEnabled] = React.useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: { full_name: string; avatar_url?: string }) => {
      const { error } = await supabase.auth.updateUser({
        data: values,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("settings.profileUpdated"),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    },
  });

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const full_name = formData.get("full_name") as string;

    // Get the avatar URL from the hidden input if it exists
    const avatar_url = (formData.get("avatar_url") as string) || undefined;

    updateProfileMutation.mutate({ full_name, avatar_url });
  };

  const handleAvatarChange = (url: string) => {
    // Update the hidden input for form submission
    const avatarInput = document.getElementById(
      "avatar_url"
    ) as HTMLInputElement;
    if (avatarInput) {
      avatarInput.value = url;
    }

    // Save the avatar URL immediately
    const full_name = session?.user?.user_metadata?.full_name || "";
    updateProfileMutation.mutate({ full_name, avatar_url: url });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso",
      });

      setShowChangePasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao alterar a senha",
      });
    }
  };

  const check2FAStatus = React.useCallback(async () => {
    try {
      const { data, error } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) throw error;

      setHas2FAEnabled(
        data.currentLevel === "aal2" || data.nextLevel === "aal2"
      );
    } catch (error) {
      console.error("Error checking 2FA status:", error);
    }
  }, []);

  React.useEffect(() => {
    check2FAStatus();
  }, [check2FAStatus]);

  const handleEnable2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "FileVault",
        friendlyName: `TOTP-${new Date().getTime()}`,
      });

      if (error) throw error;

      if (data?.totp) {
        console.log("Factor enrolled:", data);
        setQrCode(data.totp.qr_code);
        setFactorId(data.id);
        setShowTwoFactorDialog(true);
      }
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao ativar 2FA",
      });
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!factorId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Factor ID não encontrado. Tente novamente.",
      });
      return;
    }

    try {
      setIsVerifying2FA(true);

      console.log("Challenging with factor ID:", factorId);
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: factorId,
        });

      if (challengeError) throw challengeError;

      console.log("Challenge response:", challengeData);
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: otpCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "Sucesso",
        description: "Autenticação em dois fatores ativada com sucesso",
      });

      setShowTwoFactorDialog(false);
      setOtpCode("");
      setFactorId(null);
      check2FAStatus();
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Código inválido",
      });
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.totp.find(
        (factor) => factor.factor_type === "totp"
      );

      if (!totpFactor) {
        throw new Error("Fator TOTP não encontrado");
      }

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Autenticação em dois fatores desativada com sucesso",
      });

      setHas2FAEnabled(false);
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao desativar 2FA",
      });
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-background via-background to-background/90 p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent opacity-70"></div>
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[100px] opacity-60"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-secondary/5 rounded-full filter blur-[80px] opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with back button and title */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10 rounded-full hover:bg-background/80 hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <motion.h1
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {t("settings.title")}
          </motion.h1>
        </div>

        {/* Main content with sidebar layout */}
        <div>
          <Tabs
            value={section}
            orientation="vertical"
            className="w-full grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 lg:gap-10"
          >
            {/* Sidebar navigation */}
            <div className="bg-card rounded-xl border shadow-sm p-4 h-fit sticky top-8">
              <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1 p-0">
                <TabsTrigger
                  value="profile"
                  onClick={() => navigate("/settings/profile")}
                  className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <User className="h-4 w-4 mr-3" />
                  {t("settings.sections.profile.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  onClick={() => navigate("/settings/appearance")}
                  className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <SettingsIcon className="h-4 w-4 mr-3" />
                  {t("settings.sections.appearance.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  onClick={() => navigate("/settings/security")}
                  className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Shield className="h-4 w-4 mr-3" />
                  {t("settings.sections.security.title")}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Main content area */}
            <div className="flex-1 w-full">
              <TabsContent value="profile" className="mt-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <Card className="border-primary/10 shadow-md overflow-hidden">
                    <form onSubmit={handleUpdateProfile}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          {t("settings.sections.profile.title")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.sections.profile.description")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <Label
                            htmlFor="avatar"
                            className="text-base font-medium"
                          >
                            {t("settings.sections.profile.avatar")}
                          </Label>
                          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                            <AvatarUpload
                              currentAvatarUrl={
                                session?.user?.user_metadata?.avatar_url
                              }
                              userEmail={session?.user?.email}
                              onAvatarChange={handleAvatarChange}
                            />
                            <input
                              type="hidden"
                              id="avatar_url"
                              name="avatar_url"
                              defaultValue={
                                session?.user?.user_metadata?.avatar_url || ""
                              }
                            />
                            <div className="space-y-3">
                              <div className="bg-muted/50 rounded-lg px-4 py-2 text-sm">
                                <p className="font-medium text-foreground">
                                  {session?.user?.email}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Your account email cannot be changed
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <Label
                            htmlFor="full_name"
                            className="text-base font-medium"
                          >
                            {t("settings.sections.profile.name")}
                          </Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            defaultValue={
                              session?.user?.user_metadata?.full_name || ""
                            }
                            placeholder={t(
                              "settings.sections.profile.namePlaceholder"
                            )}
                            className="max-w-md"
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/10 flex justify-end py-4">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="px-6"
                        >
                          {updateProfileMutation.isPending
                            ? t("common.saving")
                            : t("common.save")}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="appearance" className="mt-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <Card className="border-primary/10 shadow-md overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-primary" />
                        {t("settings.sections.appearance.title")}
                      </CardTitle>
                      <CardDescription>
                        {t("settings.sections.appearance.description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          {t("settings.sections.appearance.theme")}
                        </Label>
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                          <div
                            className={cn(
                              "border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-primary/30",
                              theme === "light"
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted"
                            )}
                            onClick={() => setTheme("light")}
                          >
                            <div className="h-24 bg-white border rounded-md mb-3 flex items-center justify-center shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-black/10"></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {t("common.theme.light")}
                              </span>
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full border-2",
                                  theme === "light"
                                    ? "border-primary bg-primary"
                                    : "border-muted"
                                )}
                              ></div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-primary/30",
                              theme === "dark"
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted"
                            )}
                            onClick={() => setTheme("dark")}
                          >
                            <div className="h-24 bg-gray-900 border border-gray-800 rounded-md mb-3 flex items-center justify-center shadow-sm">
                              <div className="w-8 h-8 rounded-full bg-white/20"></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {t("common.theme.dark")}
                              </span>
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full border-2",
                                  theme === "dark"
                                    ? "border-primary bg-primary"
                                    : "border-muted"
                                )}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="security" className="mt-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <Card className="border-primary/10 shadow-md overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {t("settings.sections.security.title")}
                      </CardTitle>
                      <CardDescription>
                        {t("settings.sections.security.description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          {t("settings.sections.security.password")}
                        </Label>
                        <div className="bg-muted/30 rounded-lg p-4 max-w-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Password</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Change your account password
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => setShowChangePasswordDialog(true)}
                              className="ml-4"
                            >
                              {t("settings.sections.security.changePassword")}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          {t("settings.sections.security.twoFactor")}
                        </Label>
                        <div className="bg-muted/30 rounded-lg p-4 max-w-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">
                                  Two-factor authentication
                                </h4>
                                <div
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    has2FAEnabled
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  }`}
                                >
                                  {has2FAEnabled ? "Enabled" : "Disabled"}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                            {has2FAEnabled ? (
                              <Button
                                variant="outline"
                                onClick={handleDisable2FA}
                                className="ml-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                              >
                                Disable
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={handleEnable2FA}
                                className="ml-4"
                              >
                                {t("settings.sections.security.enable2FA")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <Dialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
      >
        <DialogContent className="sm:max-w-md border-primary/10">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              Alterar senha
            </DialogTitle>
            <DialogDescription>
              Digite sua nova senha para atualizar suas credenciais
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
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
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-4">
                A senha deve ter pelo menos 6 caracteres e incluir letras e
                números para maior segurança.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full sm:w-auto">
                Alterar senha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <DialogContent className="sm:max-w-md border-primary/10">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <QrCode className="h-5 w-5 text-primary" />
              Configurar autenticação em dois fatores
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR code abaixo com seu aplicativo autenticador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-3">
            {qrCode && (
              <div className="flex justify-center p-4 bg-muted/20 rounded-lg border">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="space-y-2">
                <Label>Digite o código de verificação</Label>
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-4">
                  Use um aplicativo autenticador como Google Authenticator,
                  Microsoft Authenticator ou Authy para escanear o código QR
                  acima.
                </p>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isVerifying2FA}
                  className="w-full sm:w-auto"
                >
                  {isVerifying2FA ? "Verificando..." : "Verificar"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
