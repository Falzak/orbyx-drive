import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FileData } from "@/types";
import { formatFileSize, getFileIcon, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Download,
  Share2,
  Star,
  Trash2,
  Edit,
  FileIcon,
  Calendar,
  Info,
  Clock,
  HardDrive,
  FileType,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FileContextMenu } from "./FileContextMenu";

interface FileGridProps {
  files: FileData[];
  isLoading: boolean;
  onPreview: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onRename: (file: FileData, newName: string) => void;
  onToggleFavorite: (file: FileData) => void;
  onEditFolder?: (folder: FileData) => void;
}

export const FileGrid = forwardRef<HTMLDivElement, FileGridProps>(
  (
    {
      files,
      isLoading,
      onPreview,
      onDownload,
      onShare,
      onDelete,
      onRename,
      onToggleFavorite,
      onEditFolder,
    },
    ref
  ) => {
    const { t } = useTranslation();

    const isMediaFile = (contentType: string) => {
      return (
        contentType.startsWith("image/") ||
        contentType.startsWith("video/") ||
        contentType.startsWith("audio/")
      );
    };

    const getFolderStyle = (file: FileData) => {
      if (!file.is_folder) return {};
      return {
        backgroundColor: file.color || "#94a3b8",
      };
    };

    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 p-6 h-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Card className="overflow-hidden border-border/50 bg-background/50 dark:bg-black/50 backdrop-blur-sm">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      );
    }

    const MotionDiv = motion.div;

    return (
      <motion.div
        ref={ref}
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 p-6 h-full"
      >
        <AnimatePresence mode="popLayout">
          {files.map((file) => (
            <FileContextMenu
              key={file.id}
              file={file}
              onPreview={onPreview}
              onDownload={onDownload}
              onShare={onShare}
              onDelete={onDelete}
              onRename={onRename}
              onToggleFavorite={onToggleFavorite}
              onEditFolder={onEditFolder}
            >
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  if (file.is_folder || isMediaFile(file.content_type)) {
                    onPreview(file);
                  }
                }}
                className={cn("group", file.is_folder && "hover:scale-[1.02]")}
              >
                <Card
                  className={cn(
                    "overflow-hidden cursor-pointer border-border/50 transition-all duration-200 hover:shadow-lg hover:border-border bg-background/50 dark:bg-black/50 backdrop-blur-sm group-hover:bg-background/80 dark:group-hover:bg-black/80",
                    file.is_folder && "hover:scale-[1.02]"
                  )}
                >
                  <div className="aspect-square relative bg-gradient-to-b from-muted/5 to-muted/20">
                    {file.content_type.startsWith("image/") && file.url ? (
                      <>
                        <img
                          src={file.url}
                          alt={file.filename}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </>
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                        style={getFolderStyle(file)}
                      >
                        <span className="text-4xl drop-shadow-sm">
                          {file.is_folder
                            ? file.icon || "📁"
                            : getFileIcon(file.content_type)}
                        </span>
                      </div>
                    )}
                    {file.is_favorite && (
                      <div className="absolute top-2 right-2">
                        <Star className="w-4 h-4 fill-yellow-400 stroke-2 drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-background/80 dark:bg-black/80 backdrop-blur-xl border-t border-border/50">
                    <p className="font-medium truncate text-sm text-foreground/90">
                      {file.filename}
                    </p>
                  </div>
                </Card>
              </MotionDiv>
            </FileContextMenu>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }
);

FileGrid.displayName = "FileGrid";
