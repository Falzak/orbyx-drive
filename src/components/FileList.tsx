import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileData } from "@/types";
import { formatFileSize, getFileIcon, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Star, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileContextMenu } from "./FileContextMenu";

const MotionTableRow = motion(TableRow);

interface FileListProps {
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

export const FileList = forwardRef<HTMLDivElement, FileListProps>(
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

    const isPreviewableFile = (contentType: string) => {
      return (
        contentType.startsWith("image/") ||
        contentType.startsWith("video/") ||
        contentType.startsWith("audio/") ||
        contentType === "text/plain" ||
        contentType === "application/pdf"
      );
    };

    if (isLoading) {
      return (
        <div className="rounded-lg border border-border/50 bg-background/50 dark:bg-black/50 backdrop-blur-sm w-full h-full p-6">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[60%] text-foreground/70">
                  {t("fileExplorer.fileProperties.name")}
                </TableHead>
                <TableHead className="w-[20%] text-foreground/70">
                  {t("fileExplorer.fileProperties.size")}
                </TableHead>
                <TableHead className="w-[20%] text-foreground/70">
                  {t("fileExplorer.fileProperties.modified")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow
                  key={i}
                  className="hover:bg-transparent border-border/50"
                >
                  <TableCell className="max-w-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className="rounded-lg border border-border/50 bg-background/50 dark:bg-black/50 backdrop-blur-sm w-full h-full p-6"
      >
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[60%] text-foreground/70">
                {t("fileExplorer.fileProperties.name")}
              </TableHead>
              <TableHead className="w-[20%] text-foreground/70">
                {t("fileExplorer.fileProperties.size")}
              </TableHead>
              <TableHead className="w-[20%] text-foreground/70">
                {t("fileExplorer.fileProperties.modified")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout" initial={false}>
              {files.map((file) => (
                <MotionTableRow
                  key={file.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "group cursor-pointer transition-all hover:bg-accent/5 border-border/50",
                    file.is_folder && "hover:bg-accent/10"
                  )}
                  onClick={() => {
                    if (
                      file.is_folder ||
                      isPreviewableFile(file.content_type)
                    ) {
                      onPreview(file);
                    }
                  }}
                >
                  <TableCell className="max-w-0">
                    <FileContextMenu
                      file={file}
                      onPreview={onPreview}
                      onDownload={onDownload}
                      onShare={onShare}
                      onDelete={onDelete}
                      onRename={onRename}
                      onToggleFavorite={onToggleFavorite}
                      onEditFolder={onEditFolder}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {file.content_type.startsWith("image/") &&
                          file.url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/50 bg-background/50 dark:bg-black/50">
                              <img
                                src={file.url}
                                alt={file.filename}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                onError={(e) => {
                                  console.log(
                                    "Image failed to load:",
                                    file.filename
                                  );
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder.svg";
                                  (e.target as HTMLImageElement).className =
                                    "w-full h-full object-contain p-1";
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg bg-gradient-to-b from-muted/5 to-muted/20 flex items-center justify-center shrink-0 border border-border/50 transition-transform duration-200 group-hover:scale-110",
                                file.is_folder && "bg-primary/5"
                              )}
                              style={
                                file.is_folder
                                  ? {
                                      backgroundColor: file.color || "#94a3b8",
                                    }
                                  : {}
                              }
                            >
                              <span className="text-2xl drop-shadow-sm">
                                {file.is_folder
                                  ? file.icon || "📁"
                                  : getFileIcon(file.content_type)}
                              </span>
                            </div>
                          )}
                          {file.is_favorite && (
                            <div className="absolute -top-1.5 -right-1.5">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-2 drop-shadow-sm" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate text-sm text-foreground/90 group-hover:text-foreground transition-colors">
                            {file.filename}
                          </span>
                        </div>
                      </div>
                    </FileContextMenu>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap group-hover:text-foreground/70 transition-colors">
                    {formatFileSize(file.size)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap group-hover:text-foreground/70 transition-colors">
                    {formatDate(file.created_at)}
                  </TableCell>
                </MotionTableRow>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    );
  }
);

FileList.displayName = "FileList";
