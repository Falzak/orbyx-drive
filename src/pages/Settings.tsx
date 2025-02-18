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
  User,
  Settings as SettingsIcon,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { section = "profile" } = useParams();
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

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

          <TabsContent value="profile" className="space-y-4">
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

          <TabsContent value="appearance" className="space-y-4">
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

          <TabsContent value="security" className="space-y-4">
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
                  <Button variant="outline" className="w-full" disabled>
                    {t("settings.sections.security.changePassword")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t("settings.sections.security.twoFactor")}</Label>
                  <Button variant="outline" className="w-full" disabled>
                    {t("settings.sections.security.enable2FA")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
