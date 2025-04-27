import React from "react";
import { FileData } from "@/types";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatDate, getFileIcon } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface MenuHeaderProps {
  file: FileData;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ file }) => {
  const { t } = useTranslation();

  return (
    <div className="px-3 py-4 space-y-4">
      <div className="flex items-start gap-4 group">
        <div className="relative shrink-0 transition-all duration-300 group-hover:scale-[1.03]">
          {file.content_type.startsWith("image/") && file.url ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/30 bg-background/60 dark:bg-black/60 backdrop-blur-xl shadow-sm">
              <img
                src={file.url}
                alt={file.filename}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                  (e.target as HTMLImageElement).className = "w-full h-full object-contain p-2";
                }}
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-xl bg-gradient-to-b from-muted/40 to-muted/50 flex items-center justify-center border border-border/30 backdrop-blur-xl shadow-sm transition-all duration-300 group-hover:from-muted/50 group-hover:to-muted/60"
              style={
                file.is_folder
                  ? { backgroundColor: file.color || "#94a3b8" }
                  : {}
              }
            >
              <span className="text-3xl transition-all duration-300 group-hover:scale-115">
                {file.is_folder
                  ? file.icon || "📁"
                  : getFileIcon(file.content_type)}
              </span>
            </div>
          )}
          {file.is_favorite && (
            <div className="absolute -top-1.5 -right-1.5 transition-all duration-300 group-hover:scale-110 animate-pulse">
              <Star className="w-5 h-5 fill-yellow-400 stroke-[1.5px] drop-shadow-md" />
            </div>
          )}
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="font-medium text-base text-foreground/90 truncate group-hover:text-foreground transition-colors duration-200">
            {file.filename}
          </p>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="h-5 px-2 text-[10px] font-medium bg-accent/40 hover:bg-accent/50 backdrop-blur-xl transition-colors duration-200"
            >
              {file.is_folder 
                ? t("fileExplorer.fileProperties.folder") 
                : file.content_type.split("/").pop()?.toUpperCase()}
            </Badge>
            {!file.is_folder && (
              <span className="text-xs text-muted-foreground/80">
                {formatFileSize(file.size)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2 bg-background/30 dark:bg-black/20 backdrop-blur-xl p-2.5 rounded-lg border border-border/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
          <span className="font-medium">
            {t("fileExplorer.fileProperties.details.created")}:
          </span>
          <span>{formatDate(file.created_at)}</span>
        </div>
        {!file.is_folder && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
            <span className="font-medium">
              {t("fileExplorer.fileProperties.details.type")}:
            </span>
            <span>{file.content_type}</span>
          </div>
        )}
        {!file.is_folder && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
            <span className="font-medium">
              {t("fileExplorer.fileProperties.details.size")}:
            </span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
