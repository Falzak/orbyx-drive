import React from "react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { HardDrive, AlertCircle } from "lucide-react";
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
    // Configurações otimizadas para atualização em tempo real
    refetchInterval: 10000, // Atualizar a cada 10 segundos
    refetchOnWindowFocus: true, // Atualizar quando a janela ganhar foco
    refetchOnMount: true, // Atualizar quando o componente for montado
    refetchOnReconnect: true, // Atualizar quando a conexão for restabelecida
    staleTime: 5000, // Considerar os dados obsoletos após 5 segundos
    // Usar cache para evitar flickering durante atualizações
    keepPreviousData: true,
  });

  if (isLoading) {
    return (
      <Card
        className={cn(
          "p-4 bg-background/80 dark:bg-black/80 backdrop-blur-xl border-border/50",
          "relative overflow-hidden group",
          isCollapsed && "p-2"
        )}
      >
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted/50 rounded-full w-3/4"></div>
          <div className="h-2 bg-muted/50 rounded-full w-full"></div>
        </div>
      </Card>
    );
  }

  if (!quotaInfo) return null;

  const usedPercentage = (quotaInfo.used_quota / quotaInfo.total_quota) * 100;
  const usedGB = (quotaInfo.used_quota / (1024 * 1024 * 1024)).toFixed(2);
  const totalGB = (quotaInfo.total_quota / (1024 * 1024 * 1024)).toFixed(2);
  const isNearLimit = usedPercentage > 80;
  const isCritical = usedPercentage > 90;

  const getStatusColor = () => {
    if (isCritical) return "destructive";
    if (isNearLimit) return "yellow";
    return "primary";
  };

  const statusColor = getStatusColor();

  const content = (
    <Card
      className={cn(
        "p-4 bg-background/80 dark:bg-black/80 backdrop-blur-xl border-border/50",
        "relative overflow-hidden group transition-all duration-200",
        isCollapsed && "p-2"
      )}
    >
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-sm",
            isCollapsed && "justify-center"
          )}
        >
          <div className="relative">
            <HardDrive
              className={cn(
                "h-4 w-4 shrink-0",
                isCritical
                  ? "text-destructive"
                  : isNearLimit
                  ? "text-yellow-500"
                  : "text-primary",
                "transition-transform group-hover:scale-110 duration-200"
              )}
            />
          </div>
          {!isCollapsed && (
            <span className="font-medium text-foreground/90">
              {t("sidebar.system.storage")}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t("sidebar.system.used")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {usedGB}GB / {totalGB}GB
                </span>
                {isNearLimit && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle
                          className={cn(
                            "h-4 w-4",
                            isCritical ? "text-destructive" : "text-yellow-500"
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          {isCritical
                            ? "Armazenamento quase cheio!"
                            : "Armazenamento chegando ao limite"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="relative">
              <Progress
                value={usedPercentage}
                className={cn(
                  "h-2",
                  isCritical
                    ? "bg-destructive/20"
                    : isNearLimit
                    ? "bg-yellow-500/20"
                    : "bg-primary/20"
                )}
                indicatorClassName={cn(
                  "transition-all duration-700 ease-in-out",
                  isCritical
                    ? "bg-destructive"
                    : isNearLimit
                    ? "bg-yellow-500"
                    : "bg-primary"
                )}
              />
              {/* Overlay para animação suave */}
              <motion.div
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full",
                  isCritical
                    ? "bg-destructive/30"
                    : isNearLimit
                    ? "bg-yellow-500/30"
                    : "bg-primary/30"
                )}
                initial={{ width: "0%" }}
                animate={{ width: `${usedPercentage}%` }}
                transition={{
                  duration: 0.7,
                  ease: "easeInOut",
                  delay: 0.1,
                }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{formatFileSize(quotaInfo.used_quota)}</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
                <span>{usedPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Card>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex flex-col gap-2 bg-background/80 backdrop-blur-xl border-border/50 p-3"
        >
          <div className="font-medium flex items-center gap-2">
            {t("sidebar.system.storage")}
            {isNearLimit && (
              <AlertCircle
                className={cn(
                  "h-4 w-4",
                  isCritical ? "text-destructive" : "text-yellow-500"
                )}
              />
            )}
          </div>
          <div className="relative">
            <Progress
              value={usedPercentage}
              className={cn(
                "h-1.5",
                isCritical
                  ? "bg-destructive/20"
                  : isNearLimit
                  ? "bg-yellow-500/20"
                  : "bg-primary/20"
              )}
              indicatorClassName={cn(
                "transition-all duration-700 ease-in-out",
                isCritical
                  ? "bg-destructive"
                  : isNearLimit
                  ? "bg-yellow-500"
                  : "bg-primary"
              )}
            />
            {/* Overlay para animação suave */}
            <motion.div
              className={cn(
                "absolute top-0 left-0 h-full rounded-full",
                isCritical
                  ? "bg-destructive/30"
                  : isNearLimit
                  ? "bg-yellow-500/30"
                  : "bg-primary/30"
              )}
              initial={{ width: "0%" }}
              animate={{ width: `${usedPercentage}%` }}
              transition={{
                duration: 0.7,
                ease: "easeInOut",
                delay: 0.1,
              }}
            />
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Usado:</span>
              <span>{formatFileSize(quotaInfo.used_quota)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total:</span>
              <span>{formatFileSize(quotaInfo.total_quota)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Porcentagem:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
                <span>{usedPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export default StorageQuota;
