
import React from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageProvidersPanel } from "@/components/admin/StorageProvidersPanel";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Settings, Database, HardDrive } from "lucide-react";

const Admin = () => {
  const session = useAuthRedirect();
  const { t } = useTranslation();

  const { data: isAdmin } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session?.user.id)
        .single();

      if (error) return false;
      return data?.role === "admin";
    },
  });

  if (!session || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("admin.unauthorized.title")}</h1>
          <p className="text-muted-foreground">
            {t("admin.unauthorized.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{t("admin.description")}</p>
        </div>

        <Tabs defaultValue="storage" className="space-y-6">
          <TabsList>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              {t("admin.tabs.storage")}
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("admin.tabs.database")}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("admin.tabs.settings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="storage" className="space-y-4">
            <StorageProvidersPanel />
          </TabsContent>

          <TabsContent value="database">
            <div className="rounded-lg border bg-card text-card-foreground p-6">
              <h3 className="text-lg font-semibold mb-2">
                {t("admin.database.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("admin.database.comingSoon")}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="rounded-lg border bg-card text-card-foreground p-6">
              <h3 className="text-lg font-semibold mb-2">
                {t("admin.settings.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("admin.settings.comingSoon")}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Admin;
