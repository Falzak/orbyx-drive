import React from "react";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Download, Share2, Star, Trash2, Edit, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileListProps {
  files: FileData[];
  isLoading: boolean;
  onPreview: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onRename: (file: FileData, newName: string) => void;
  onToggleFavorite: (file: FileData) => void;
}

export function FileList({
  files,
  isLoading,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  onRename,
  onToggleFavorite,
}: FileListProps) {
  const { t } = useTranslation();

  const isMediaFile = (contentType: string) => {
    return (
      contentType.startsWith("image/") ||
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/")
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-background/50 backdrop-blur-xl w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[45%]">
                {t("fileExplorer.fileProperties.name")}
              </TableHead>
              <TableHead className="w-[15%]">
                {t("fileExplorer.fileProperties.size")}
              </TableHead>
              <TableHead className="w-[15%]">
                {t("fileExplorer.fileProperties.type")}
              </TableHead>
              <TableHead className="w-[25%]">
                {t("fileExplorer.fileProperties.modified")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent border-border">
                <TableCell className="max-w-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md shrink-0" />
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
                  <Skeleton className="h-6 w-20" />
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
    <div className="rounded-lg border bg-background/50 backdrop-blur-xl w-full">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="w-[45%]">
              {t("fileExplorer.fileProperties.name")}
            </TableHead>
            <TableHead className="w-[15%]">
              {t("fileExplorer.fileProperties.size")}
            </TableHead>
            <TableHead className="w-[15%]">
              {t("fileExplorer.fileProperties.type")}
            </TableHead>
            <TableHead className="w-[25%]">
              {t("fileExplorer.fileProperties.modified")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger asChild>
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="group cursor-pointer transition-colors hover:bg-muted/50 border-border"
                    onDoubleClick={() => {
                      if (isMediaFile(file.content_type)) {
                        onPreview(file);
                      }
                    }}
                  >
                    <TableCell className="max-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gradient-to-b from-muted/5 to-muted/20 flex items-center justify-center shrink-0 border border-border/50">
                          <span className="text-2xl">
                            {getFileIcon(file.content_type)}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate text-sm text-foreground/90">
                            {file.filename}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {t("fileExplorer.fileProperties.added")}{" "}
                            {formatDate(file.created_at)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatFileSize(file.size)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-xs font-medium ring-1 ring-inset ring-border/50">
                        {file.content_type.split("/").pop()?.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(file.created_at)}
                    </TableCell>
                  </motion.tr>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56 bg-background/80 dark:bg-black/80 backdrop-blur-xl border-border">
                  {isMediaFile(file.content_type) && (
                    <>
                      <ContextMenuItem
                        onClick={() => onPreview(file)}
                        className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <FileIcon className="h-4 w-4 mr-2" />
                        {t("fileExplorer.contextMenu.open")}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                    </>
                  )}
                  <ContextMenuItem
                    onClick={() => onDownload(file)}
                    className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("fileExplorer.contextMenu.download")}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onShare(file)}
                    className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t("fileExplorer.contextMenu.share")}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => onToggleFavorite(file)}
                    className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 mr-2",
                        file.is_favorite && "fill-yellow-400"
                      )}
                    />
                    {file.is_favorite
                      ? t("fileExplorer.contextMenu.unfavorite")
                      : t("fileExplorer.contextMenu.favorite")}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      const newName = prompt(
                        t("fileExplorer.contextMenu.renamePrompt"),
                        file.filename
                      );
                      if (newName && newName !== file.filename) {
                        onRename(file, newName);
                      }
                    }}
                    className="text-foreground/90 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t("fileExplorer.contextMenu.rename")}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => onDelete(file)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("fileExplorer.contextMenu.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
