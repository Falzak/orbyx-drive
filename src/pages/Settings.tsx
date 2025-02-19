
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

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { section = "profile" } = useParams();
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [showChangePasswordDialog, setShowChangePasswordDialog] = React.useState(false);
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

    updateProfileMutation.mutate({ full_name });
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
        description: error instanceof Error ? error.message : "Ocorreu um erro ao alterar a senha",
      });
    }
  };

  const handleEnable2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      if (data.qr_code) {
        setQrCode(data.qr_code);
        setShowTwoFactorDialog(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao ativar 2FA",
      });
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsVerifying2FA(true);
      
      const { error } = await supabase.auth.mfa.challenge({
        factorId: 'totp',
      });

      if (error) throw error;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        code: otpCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "Sucesso",
        description: "Autenticação em dois fatores ativada com sucesso",
      });

      setShowTwoFactorDialog(false);
      setOtpCode("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Código inválido",
      });
    } finally {
      setIsVerifying2FA(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        </div>

        <Tabs value={section} className="space-y-6">
          <TabsList>
            <TabsTrigger
              value="profile"
              onClick={() => navigate("/settings/profile")}
            >
              <User className="h-4 w-4 mr-2" />
              {t("settings.sections.profile.title")}
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              onClick={() => navigate("/settings/appearance")}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              {t("settings.sections.appearance.title")}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              onClick={() => navigate("/settings/security")}
            >
              <Shield className="h-4 w-4 mr-2" />
              {t("settings.sections.security.title")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <form onSubmit={handleUpdateProfile}>
                <CardHeader>
                  <CardTitle>{t("settings.sections.profile.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.sections.profile.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar">
                      {t("settings.sections.profile.avatar")}
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {session?.user?.user_metadata?.avatar_url ? (
                          <img
                            src={session.user.user_metadata.avatar_url}
                            alt={session.user.email || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-medium text-primary">
                            {session?.user?.email?.[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <Button variant="outline" disabled>
                        {t("common.upload")}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t("settings.sections.profile.email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={session?.user?.email || ""}
                      disabled
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending
                      ? t("common.saving")
                      : t("common.save")}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.sections.appearance.title")}</CardTitle>
                <CardDescription>
                  {t("settings.sections.appearance.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("settings.sections.appearance.theme")}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => setTheme("light")}
                      className="flex-1"
                    >
                      {t("common.theme.light")}
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => setTheme("dark")}
                      className="flex-1"
                    >
                      {t("common.theme.dark")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.sections.security.title")}</CardTitle>
                <CardDescription>
                  {t("settings.sections.security.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("settings.sections.security.password")}</Label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowChangePasswordDialog(true)}
                  >
                    {t("settings.sections.security.changePassword")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t("settings.sections.security.twoFactor")}</Label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleEnable2FA}
                  >
                    {t("settings.sections.security.enable2FA")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Digite sua nova senha
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
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
            <DialogFooter>
              <Button type="submit">Alterar senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar autenticação em dois fatores</DialogTitle>
            <DialogDescription>
              Escaneie o QR code abaixo com seu aplicativo autenticador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="space-y-2">
                <Label>Digite o código de verificação</Label>
                <InputOTP
                  value={otpCode}
                  onChange={setOtpCode}
                  maxLength={6}
                  render={({ slots }) => (
                    <InputOTPGroup>
                      {slots.map((slot, i) => (
                        <InputOTPSlot key={i} {...slot} index={i} />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isVerifying2FA}>
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
