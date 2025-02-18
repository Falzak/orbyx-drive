import React, { useState, useEffect, useCallback, forwardRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HTMLMotionProps,
  MotionStyle,
  Transition,
  Variants,
  AnimatePresence,
  motion,
} from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileData, ViewMode } from "@/types";
import MediaPreview from "./MediaPreview";
import {
  FileIcon,
  Grid,
  List,
  ChevronRight,
  MoreHorizontal,
  Download,
  Share2,
  Star,
  Trash2,
  Edit,
  Copy,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { FileViewOptions } from "@/components/FileViewOptions";
import { FileGrid } from "@/components/FileGrid";
import { FileList } from "@/components/FileList";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { ShareDialog } from "./ShareDialog";

interface FileExplorerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onFolderChange?: (folderId: string | null) => void;
}

export const FileExplorer = React.forwardRef<HTMLDivElement, FileExplorerProps>(
  ({ className, onFolderChange, ...props }, ref) => {
    const { session } = useAuth();
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [view, setView] = useLocalStorage<"grid" | "list">(
      "file-view",
      "grid"
    );
    const [sortBy, setSortBy] = useLocalStorage<string>(
      "file-sort",
      "date_desc"
    );
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
    const [shareFile, setShareFile] = useState<FileData | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
      if (!session) {
        navigate("/auth");
      }
    }, [session, navigate]);

    const getSignedUrl = useCallback(async (filePath: string) => {
      const { data } = await supabase.storage
        .from("files")
        .createSignedUrl(filePath, 3600);
      return data?.signedUrl;
    }, []);

    const { data: folders = [], isLoading: isFoldersLoading } = useQuery({
      queryKey: ["folders", sortBy, currentFolderId],
      queryFn: async () => {
        let query = supabase
          .from("folders")
          .select("id, name, parent_id, user_id")
          .eq("user_id", session?.user.id);

        if (currentFolderId === null) {
          query = query.is("parent_id", null);
        } else {
          query = query.eq("parent_id", currentFolderId);
        }

        query = query.order("name", { ascending: sortBy.endsWith("asc") });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    });

    const { data: files = [], isLoading: isFilesLoading } = useQuery({
      queryKey: ["files", sortBy, currentFolderId],
      queryFn: async () => {
        const [field, direction] = sortBy.split("_");
        let query = supabase
          .from("files")
          .select(
            "id, filename, content_type, size, created_at, updated_at, user_id, file_path, folder_id, is_favorite, category"
          )
          .eq("user_id", session?.user.id);

        if (currentFolderId === null) {
          query = query.is("folder_id", null);
        } else {
          query = query.eq("folder_id", currentFolderId);
        }

        query = query.order(field === "name" ? "filename" : "created_at", {
          ascending: direction === "asc",
        });

        const { data, error } = await query;
        if (error) throw error;

        const filesWithUrls = await Promise.all(
          (data || []).map(async (file) => {
            try {
              const url = await getSignedUrl(file.file_path);
              return {
                ...file,
                url: url || undefined,
              };
            } catch (error) {
              console.error("Failed to get signed URL for file:", file.id);
              return file;
            }
          })
        );

        return filesWithUrls;
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    });

    const handleFolderClick = (folderId: string) => {
      setCurrentFolderId(folderId);
      onFolderChange?.(folderId);
    };

    const handleBackClick = async () => {
      if (!currentFolderId) return;

      try {
        const { data: currentFolder } = await supabase
          .from("folders")
          .select("parent_id")
          .eq("id", currentFolderId)
          .single();

        setCurrentFolderId(currentFolder?.parent_id);
        onFolderChange?.(currentFolder?.parent_id);
      } catch (error) {
        console.error("Erro ao buscar pasta pai:", error);
      }
    };

    const items = React.useMemo(() => {
      const folderItems = folders.map(
        (folder): FileData => ({
          id: folder.id,
          filename: folder.name,
          content_type: "folder",
          size: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: folder.user_id,
          is_folder: true,
          file_path: null,
          folder_id: null,
          is_favorite: false,
          category: "folder",
          name: folder.name,
          parent_id: folder.parent_id,
        })
      );

      return [...folderItems, ...files];
    }, [folders, files]);

    useEffect(() => {
      if (selectedFile) {
        const updatedFile = items.find((file) => file.id === selectedFile.id);
        if (!updatedFile) {
          setSelectedFile(null);
        } else if (updatedFile && previewUrls[updatedFile.id]) {
          setSelectedFile({
            ...updatedFile,
            url: previewUrls[updatedFile.id],
          });
        }
      }
    }, [items, previewUrls, selectedFile]);

    const handleDownload = useCallback(
      async (file: FileData) => {
        try {
          let url = previewUrls[file.id];
          if (!url) {
            const signedUrl = await getSignedUrl(file.file_path);
            if (signedUrl) {
              url = signedUrl;
              setPreviewUrls((prev) => ({
                ...prev,
                [file.id]: signedUrl,
              }));
            }
          }

          if (url) {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = file.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to download file",
          });
        }
      },
      [previewUrls, getSignedUrl]
    );

    const handlePreview = useCallback(
      async (file: FileData) => {
        try {
          let url = previewUrls[file.id];
          if (!url) {
            const signedUrl = await getSignedUrl(file.file_path);
            if (signedUrl) {
              url = signedUrl;
              setPreviewUrls((prev) => ({
                ...prev,
                [file.id]: signedUrl,
              }));
            }
          }

          setSelectedFile({
            ...file,
            url,
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to preview file",
          });
        }
      },
      [previewUrls, getSignedUrl]
    );

    const getFileIcon = (contentType: string) => {
      if (contentType.startsWith("image/")) return "🖼️";
      if (contentType.startsWith("video/")) return "🎥";
      if (contentType.startsWith("audio/")) return "🎵";
      if (contentType.startsWith("application/pdf")) return "📄";
      if (contentType.startsWith("application/msword")) return "📝";
      return "📁";
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (date: string) => {
      return new Intl.DateTimeFormat("pt-BR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    };

    const handleDelete = async (file: FileData) => {
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }

      if (file.is_folder) {
        const { error: dbError } = await supabase
          .from("folders")
          .delete()
          .eq("id", file.id);

        if (dbError) {
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("fileExplorer.actions.deleteFolderError"),
          });
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["folders"] });
        toast({
          title: t("common.success"),
          description: t("fileExplorer.actions.deleteFolderSuccess"),
        });
      } else {
        const { error: storageError } = await supabase.storage
          .from("files")
          .remove([file.file_path!]);

        if (storageError) {
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("fileExplorer.actions.deleteError"),
          });
          return;
        }

        const { error: dbError } = await supabase
          .from("files")
          .delete()
          .eq("id", file.id);

        if (dbError) {
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("fileExplorer.actions.deleteError"),
          });
          return;
        }

        setPreviewUrls((prev) => {
          const newUrls = { ...prev };
          delete newUrls[file.id];
          return newUrls;
        });

        queryClient.invalidateQueries({ queryKey: ["files"] });
        toast({
          title: t("common.success"),
          description: t("fileExplorer.actions.deleteSuccess"),
        });
      }
    };

    const handleRename = async (file: FileData, newName: string) => {
      if (file.is_folder) {
        const { error } = await supabase
          .from("folders")
          .update({ name: newName })
          .eq("id", file.id);

        if (error) {
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("fileExplorer.actions.renameFolderError"),
          });
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["folders"] });
        toast({
          title: t("common.success"),
          description: t("fileExplorer.actions.renameFolderSuccess"),
        });
      } else {
        const { error } = await supabase
          .from("files")
          .update({ filename: newName })
          .eq("id", file.id);

        if (error) {
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("fileExplorer.actions.renameFileError"),
          });
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["files"] });
        toast({
          title: t("common.success"),
          description: t("fileExplorer.actions.renameFileSuccess"),
        });
      }
    };

    const handleShare = (file: FileData) => {
      setShareFile(file);
    };

    const handleToggleFavorite = async (file: FileData) => {
      if (file.is_folder) return;
      const { error } = await supabase
        .from("files")
        .update({
          is_favorite: !file.is_favorite,
        })
        .eq("id", file.id);

      if (!error) {
        setSelectedFile({
          ...file,
          is_favorite: !file.is_favorite,
        });
        queryClient.invalidateQueries({ queryKey: ["files"] });
      }
    };

    const MotionTableRow = React.forwardRef<
      HTMLTableRowElement,
      HTMLMotionProps<"tr">
    >((props, ref) => <motion.tr ref={ref} {...props} />);
    MotionTableRow.displayName = "MotionTableRow";

    const FileContextMenu = React.forwardRef<
      HTMLDivElement,
      {
        file: FileData;
        children: React.ReactNode;
      }
    >(({ file, children }, ref) => (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div ref={ref}>{children}</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => handlePreview(file)}
            className="text-foreground/80 hover:bg-accent hover:text-accent-foreground !cursor-pointer transition-colors"
          >
            <FileIcon className="h-4 w-4 mr-2" />
            Preview
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleDownload(file)}
            className="text-foreground/80 hover:bg-accent hover:text-accent-foreground !cursor-pointer transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => navigate(`/share/${file.id}`)}
            className="text-foreground/80 hover:bg-accent hover:text-accent-foreground !cursor-pointer transition-colors"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-border/50" />
          <ContextMenuItem
            onClick={async () => {
              const { error } = await supabase
                .from("files")
                .update({ is_favorite: !file.is_favorite })
                .eq("id", file.id);
              if (!error) {
                queryClient.invalidateQueries({ queryKey: ["files"] });
              }
            }}
            className="text-foreground/80 hover:bg-accent hover:text-accent-foreground !cursor-pointer transition-colors"
          >
            <Star
              className={cn(
                "h-4 w-4 mr-2",
                file.is_favorite && "fill-yellow-400"
              )}
            />
            {file.is_favorite ? "Remove from favorites" : "Add to favorites"}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              const newName = prompt("Enter new name", file.filename);
              if (newName && newName !== file.filename) {
                handleRename(file, newName);
              }
            }}
            className="text-foreground/80 hover:bg-accent hover:text-accent-foreground !cursor-pointer transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-border/50" />
          <ContextMenuItem
            onClick={() => handleDelete(file)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive !cursor-pointer transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));
    FileContextMenu.displayName = "FileContextMenu";

    return (
      <div className="space-y-4 w-full">
        {currentFolderId && (
          <Button variant="ghost" onClick={handleBackClick} className="mb-4">
            {t("fileExplorer.navigation.back")}
          </Button>
        )}
        <FileViewOptions
          view={view}
          onViewChange={setView}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalFiles={items.length}
        />

        <div className="w-full" ref={ref}>
          {view === "grid" ? (
            <FileGrid
              files={items}
              isLoading={isFoldersLoading || isFilesLoading}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={handleDelete}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : (
            <FileList
              files={items}
              isLoading={isFoldersLoading || isFilesLoading}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={handleDelete}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </div>

        {selectedFile && (
          <MediaPreview
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDownload={() => handleDownload(selectedFile)}
            onShare={() => handleShare(selectedFile)}
            onToggleFavorite={async () => {
              const { error } = await supabase
                .from("files")
                .update({
                  is_favorite: !selectedFile.is_favorite,
                })
                .eq("id", selectedFile.id);

              if (!error) {
                setSelectedFile({
                  ...selectedFile,
                  is_favorite: !selectedFile.is_favorite,
                });
                queryClient.invalidateQueries({ queryKey: ["files"] });
              }
            }}
          />
        )}

        {shareFile && (
          <ShareDialog
            file={shareFile}
            open={!!shareFile}
            onOpenChange={(open) => !open && setShareFile(null)}
          />
        )}
      </div>
    );
  }
);

FileExplorer.displayName = "FileExplorer";
