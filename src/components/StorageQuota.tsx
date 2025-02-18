import React from "react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { HardDrive } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { formatFileSize } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StorageQuotaProps {
  collapsed?: boolean;
}

const StorageQuota = ({ collapsed = false }: StorageQuotaProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { t } = useTranslation();

  const { data: quotaInfo, isLoading } = useQuery({
    queryKey: ["storage-quota"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_quotas")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card
        className={cn(
          "p-4 bg-background/80 dark:bg-black/80 backdrop-blur-xl",
          isCollapsed && "p-2"
        )}
      >
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-2 bg-muted rounded w-full"></div>
        </div>
      </Card>
    );
  }

  if (!quotaInfo) return null;

  const usedPercentage = (quotaInfo.used_quota / quotaInfo.total_quota) * 100;
  const usedGB = (quotaInfo.used_quota / (1024 * 1024 * 1024)).toFixed(2);
  const totalGB = (quotaInfo.total_quota / (1024 * 1024 * 1024)).toFixed(2);

  const content = (
    <Card
      className={cn(
        "p-4 bg-background/80 dark:bg-black/80 backdrop-blur-xl",
        isCollapsed && "p-2"
      )}
    >
      <div className="space-y-3">
        <div
          className={cn(
            "flex items-center gap-2 text-sm text-muted-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <HardDrive className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <span className="font-medium">{t("sidebar.system.storage")}</span>
          )}
        </div>
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("sidebar.system.used")}
              </span>
              <span className="font-medium">
                {usedGB}GB / {totalGB}GB
              </span>
            </div>
            <Progress
              value={usedPercentage}
              className={`h-2 ${
                usedPercentage > 90 ? "bg-destructive" : "bg-primary"
              }`}
            />
          </div>
        )}
      </div>
    </Card>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-2">
          <div className="font-medium">{t("sidebar.system.storage")}</div>
          <div className="text-sm">
            {usedGB}GB / {totalGB}GB ({usedPercentage.toFixed(1)}%)
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export default StorageQuota;
