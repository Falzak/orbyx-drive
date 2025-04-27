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
import PDFViewer from "./PDFViewer";
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
  FolderOpen,
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
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { getFileUrl, removeFiles } from "@/utils/storage";

interface FileExplorerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onFolderChange?: (folderId: string | null) => void;
  searchQuery?: string;
}

export const FileExplorer = React.forwardRef<HTMLDivElement, FileExplorerProps>(
  ({ className, onFolderChange, searchQuery = "", ...props }, ref) => {
    const { session } = useAuth();
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string>("");
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
    const [selectedFolder, setSelectedFolder] = useState<FileData | null>(null);
    const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);

    useEffect(() => {
      if (!session) {
        navigate("/auth");
      }
    }, [session, navigate]);

    // Parse query parameters
    const searchParams = new URLSearchParams(location.search);
    const filterParam = searchParams.get('filter');

    // Check if we're in trash view or favorites view
    const isTrashView = filterParam === 'trash';
    const isFavoritesView = filterParam === 'favorites';

    const getSignedUrlForFile = useCallback(async (filePath: string) => {
      if (!filePath) {
        console.error("getSignedUrlForFile: Empty file path provided");
        return null;
      }

      try {
        const url = await getFileUrl(filePath);
        console.log(
          "Got signed URL for:",
          filePath,
          url ? "Success" : "Failed"
        );
        return url;
      } catch (error) {
        console.error(
          "Error getting signed URL:",
          error,
          "for file:",
          filePath
        );
        return null;
      }
    }, []);

    const { data: folders = [], isLoading: isFoldersLoading } = useQuery({
      queryKey: ["folders", sortBy, currentFolderId, searchQuery, isTrashView, isFavoritesView],
      queryFn: async () => {
        let query = supabase
          .from("folders")
          .select("id, name, parent_id, user_id, icon, color, is_trashed, trashed_at")
          .eq("user_id", session?.user.id);

        // Filtrar por status de lixeira
        if (isTrashView) {
          query = query.eq("is_trashed", true);
        } else {
          query = query.eq("is_trashed", false);

          if (searchQuery) {
            query = query.ilike("name", `%${searchQuery}%`);
          } else if (!isFavoritesView) {
            // Aplicar filtro de pasta apenas quando não estiver na visualização de favoritos
            if (currentFolderId === null) {
              query = query.is("parent_id", null);
            } else {
              query = query.eq("parent_id", currentFolderId);
            }
          }
        }

        query = query.order("name", { ascending: sortBy.endsWith("asc") });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    });

    // Log para depuração
    console.log("FileExplorer - Current location:", location.pathname, location.search);
    console.log("FileExplorer - Filter param:", filterParam);
    console.log("FileExplorer - Is trash view:", isTrashView);
    console.log("FileExplorer - Is favorites view:", isFavoritesView);

    // Efeito para reagir às mudanças na URL
    useEffect(() => {
      console.log("URL changed, revalidating queries");
      queryClient.invalidateQueries({ queryKey: ["files"] });
    }, [location.search, queryClient]);

    const { data: files = [], isLoading: isFilesLoading } = useQuery({
      queryKey: ["files", sortBy, currentFolderId, searchQuery, isTrashView, isFavoritesView],
      queryFn: async () => {
        const [field, direction] = sortBy.split("_");
        let query = supabase
          .from("files")
          .select(
            "id, filename, content_type, size, created_at, updated_at, user_id, file_path, folder_id, is_favorite, category, is_trashed, trashed_at"
          )
          .eq("user_id", session?.user.id);

        // Filter by trash status
        if (isTrashView) {
          query = query.eq("is_trashed", true);
        } else {
          query = query.eq("is_trashed", false);

          // Filter by favorites if in favorites view
          if (isFavoritesView) {
            query = query.eq("is_favorite", true);
          }

          if (searchQuery) {
            query = query.ilike("filename", `%${searchQuery}%`);
          } else if (!isFavoritesView) {
            // Only apply folder filtering when not in favorites view
            if (currentFolderId === null) {
              query = query.is("folder_id", null);
            } else {
              query = query.eq("folder_id", currentFolderId);
            }
          }
        }

        query = query.order(field === "name" ? "filename" : "created_at", {
          ascending: direction === "asc",
        });

        const { data, error } = await query;
        if (error) throw error;

        const filesWithUrls = await Promise.all(
          (data || []).map(async (file) => {
            if (!file.file_path) {
              console.warn("File without file_path:", file.id, file.filename);
              return file;
            }

            try {
              const cacheKey = `url_${file.id}`;
              let url = sessionStorage.getItem(cacheKey);

              if (!url) {
                url = await getSignedUrlForFile(file.file_path);
                if (url) {
                  sessionStorage.setItem(cacheKey, url);
                  console.log("Cached URL for file:", file.filename);
                }
              } else {
                console.log("Using cached URL for file:", file.filename);
              }

              return {
                ...file,
                url: url || undefined,
              };
            } catch (error) {
              console.error(
                "Failed to get URL for file:",
                file.id,
                file.filename,
                error
              );
              return file;
            }
          })
        );

        return filesWithUrls;
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    });

    const handleFolderClick = async (folderId: string) => {
      try {
        const { data: folder } = await supabase
          .from("folders")
          .select("name, parent_id")
          .eq("id", folderId)
          .single();

        if (folder) {
          let path = folder.name;
          let parentId = folder.parent_id;

          while (parentId) {
            const { data: parentFolder } = await supabase
              .from("folders")
              .select("name, parent_id")
              .eq("id", parentId)
              .single();

            if (parentFolder) {
              path = `${parentFolder.name}/${path}`;
              parentId = parentFolder.parent_id;
            } else {
              break;
            }
          }

          setCurrentPath(path);
        }

        setCurrentFolderId(folderId);
        onFolderChange?.(folderId);
      } catch (error) {
        console.error("Error navigating to folder:", error);
      }
    };

    const handleBreadcrumbNavigate = async (path: string) => {
      if (path === "") {
        setCurrentFolderId(null);
        setCurrentPath("");
        onFolderChange?.(null);
        return;
      }

      const segments = path.split("/");
      const folderName = segments[segments.length - 1];

      try {
        const { data: folder } = await supabase
          .from("folders")
          .select("id")
          .eq("name", folderName)
          .single();

        if (folder) {
          setCurrentFolderId(folder.id);
          setCurrentPath(path);
          onFolderChange?.(folder.id);
        }
      } catch (error) {
        console.error("Error navigating via breadcrumb:", error);
      }
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
          icon: folder.icon,
          color: folder.color,
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
            const signedUrl = await getSignedUrlForFile(file.file_path);
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
            title: t("common.error"),
            description: t("fileExplorer.actions.downloadError"),
          });
        }
      },
      [previewUrls, getSignedUrlForFile, t, toast]
    );

    const handlePreview = useCallback(
      async (file: FileData) => {
        try {
          if (file.is_folder) {
            handleFolderClick(file.id);
            return;
          }

          let url = previewUrls[file.id];
          if (!url && file.file_path) {
            console.log("Getting URL for preview:", file.filename);
            const signedUrl = await getSignedUrlForFile(file.file_path);
            if (signedUrl) {
              url = signedUrl;
              setPreviewUrls((prev) => ({
                ...prev,
                [file.id]: signedUrl,
              }));
              console.log("Preview URL obtained for:", file.filename);
            } else {
              console.warn("Failed to get preview URL for:", file.filename);
            }
          }

          setSelectedFile({
            ...file,
            url,
          });
        } catch (error) {
          console.error("Preview error:", error, "for file:", file.filename);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Falha ao visualizar o arquivo",
          });
        }
      },
      [previewUrls, getSignedUrlForFile, handleFolderClick, toast]
    );

    const getFileIcon = (contentType: string) => {
      if (contentType.startsWith("image/")) return "🖼️";
      if (contentType.startsWith("video/")) return "🎥";
      if (contentType.startsWith("audio/")) return "🎵";
      if (contentType.startsWith("application/pdf")) return "📄";
      if (contentType.startsWith("application/msword")) return "����";
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

    const handleMoveToTrash = async (file: FileData) => {
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }

      try {
        if (file.is_folder) {
          // Mover pasta para a lixeira
          const { error } = await supabase
            .from("folders")
            .update({
              is_trashed: true,
              trashed_at: new Date().toISOString()
            })
            .eq("id", file.id);

          if (error) {
            toast({
              variant: "destructive",
              title: t("common.error"),
              description: t("fileExplorer.actions.moveToTrashError"),
            });
            return;
          }

          queryClient.invalidateQueries({ queryKey: ["folders"] });
        } else {
          // Mover arquivo para a lixeira
          const { error } = await supabase
            .from("files")
            .update({
              is_trashed: true,
              trashed_at: new Date().toISOString()
            })
            .eq("id", file.id);

          if (error) {
            toast({
              variant: "destructive",
              title: t("common.error"),
              description: t("fileExplorer.actions.moveToTrashError"),
            });
            return;
          }

          setPreviewUrls((prev) => {
            const newUrls = { ...prev };
            delete newUrls[file.id];
            return newUrls;
          });

          queryClient.invalidateQueries({ queryKey: ["files"] });
        }

        toast({
          title: t("common.success"),
          description: t("fileExplorer.actions.moveToTrashSuccess"),
        });
      } catch (error) {
        console.error("Erro ao mover para lixeira:", error);
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("fileExplorer.actions.moveToTrashError"),
        });
      }
    };

    const handleRestore = async (file: FileData) => {
      try {
        if (file.is_folder) {
          // Restaurar pasta da lixeira
          const { error } = await supabase
            .from("folders")
            .update({
              is_trashed: false,
              trashed_at: null
            })
            .eq("id", file.id);

          if (error) {
            toast({
              variant: "destructive",
              title: t("common.error"),
              description: t("fileExplorer.actions.restoreError"),
            });
            return;
          }

          queryClient.invalidateQueries({ queryKey: ["folders"] });
        } else {
          // Restaurar arquivo da lixeira
          const { error } = await supabase
            .from("files")
            .update({
              is_trashed: false,
              trashed_at: null
            })
            .eq("id", file.id);

          if (error) {
            toast({
              variant: "destructive",
              title: t("common.error"),
              description: t("fileExplorer.actions.restoreError"),
            });
            return;
          }

          queryClient.invalidateQueries({ queryKey: ["files"] });
        }

        toast({
          title: t("common.success"),
          description: t("fileExplorer.actions.restoreSuccess"),
        });
      } catch (error) {
        console.error("Erro ao restaurar da lixeira:", error);
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("fileExplorer.actions.restoreError"),
        });
      }
    };

    const handleEmptyTrash = async () => {
      // Confirmar com o usuário antes de esvaziar a lixeira
      if (!window.confirm(t("fileExplorer.confirmEmptyTrash"))) {
        return;
      }

      try {
        // Obter todos os arquivos na lixeira
        const { data: trashedFiles, error: fetchFilesError } = await supabase
          .from("files")
          .select("id, file_path")
          .eq("user_id", session?.user.id)
          .eq("is_trashed", true);

        if (fetchFilesError) throw fetchFilesError;

        // Obter todas as pastas na lixeira
        const { data: trashedFolders, error: fetchFoldersError } = await supabase
          .from("folders")
          .select("id")
          .eq("user_id", session?.user.id)
          .eq("is_trashed", true);

        if (fetchFoldersError) throw fetchFoldersError;

        let hasItemsToDelete = false;

        // Processar arquivos
        if (trashedFiles && trashedFiles.length > 0) {
          hasItemsToDelete = true;

          // Excluir arquivos do armazenamento
          const filePaths = trashedFiles
            .map((f) => f.file_path)
            .filter(Boolean);

          if (filePaths.length > 0) {
            await removeFiles(filePaths);
          }

          // Excluir registros do banco de dados
          const { error: deleteFilesError } = await supabase
            .from("files")
            .delete()
            .eq("is_trashed", true)
            .eq("user_id", session?.user.id);

          if (deleteFilesError) throw deleteFilesError;

          queryClient.invalidateQueries({ queryKey: ["files"] });
        }

        // Processar pastas
        if (trashedFolders && trashedFolders.length > 0) {
          hasItemsToDelete = true;

          // Para cada pasta na lixeira
          for (const folder of trashedFolders) {
            // Excluir arquivos dentro da pasta
            const { data: filesInFolder, error: filesInFolderError } = await supabase
              .from("files")
              .select("file_path")
              .eq("folder_id", folder.id);

            if (filesInFolderError) throw filesInFolderError;

            if (filesInFolder && filesInFolder.length > 0) {
              const filePaths = filesInFolder
                .map((f) => f.file_path)
                .filter(Boolean);

              if (filePaths.length > 0) {
                await removeFiles(filePaths);
              }

              // Excluir registros de arquivos
              await supabase
                .from("files")
                .delete()
                .eq("folder_id", folder.id);
            }
          }

          // Excluir todas as pastas na lixeira
          const { error: deleteFoldersError } = await supabase
            .from("folders")
            .delete()
            .eq("is_trashed", true)
            .eq("user_id", session?.user.id);

          if (deleteFoldersError) throw deleteFoldersError;

          queryClient.invalidateQueries({ queryKey: ["folders"] });
        }

        if (hasItemsToDelete) {
          toast({
            title: t("common.success"),
            description: t("fileExplorer.actions.emptyTrashSuccess"),
          });
        } else {
          toast({
            title: t("common.info"),
            description: t("fileExplorer.emptyState.trashEmpty"),
          });
        }
      } catch (error) {
        console.error("Erro ao esvaziar lixeira:", error);
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("fileExplorer.actions.emptyTrashError"),
        });
      }
    };

    const handleDelete = async (file: FileData) => {
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }

      // Se estiver na lixeira, confirmar antes de excluir permanentemente
      if (isTrashView) {
        if (!window.confirm(t("fileExplorer.confirmPermanentDelete"))) {
          return;
        }
      }

      if (file.is_folder) {
        try {
          const { data: filesInFolder, error: filesError } = await supabase
            .from("files")
            .select("*")
            .eq("folder_id", file.id);

          if (filesError) throw filesError;

          if (filesInFolder && filesInFolder.length > 0) {
            const filePaths = filesInFolder
              .map((f) => f.file_path)
              .filter(Boolean);
            if (filePaths.length > 0) {
              await removeFiles(filePaths);
            }

            const { error: filesDeleteError } = await supabase
              .from("files")
              .delete()
              .eq("folder_id", file.id);

            if (filesDeleteError) throw filesDeleteError;
          }

          const { data: subfolders, error: subfoldersError } = await supabase
            .from("folders")
            .select("*")
            .eq("parent_id", file.id);

          if (subfoldersError) throw subfoldersError;

          if (subfolders) {
            for (const subfolder of subfolders) {
              await handleDelete({
                ...subfolder,
                is_folder: true,
                content_type: "folder",
                filename: subfolder.name,
                size: 0,
                updated_at: subfolder.created_at,
                file_path: null,
                folder_id: subfolder.parent_id,
                is_favorite: false,
                category: "folder",
                url: null,
              });
            }
          }

          const { error: folderError } = await supabase
            .from("folders")
            .delete()
            .eq("id", file.id);

          if (folderError) throw folderError;

          queryClient.invalidateQueries({ queryKey: ["folders"] });
          toast({
            title: t("common.success"),
            description: t("fileExplorer.actions.deleteFolderSuccess"),
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("fileExplorer.actions.deleteFolderError"),
          });
        }
      } else {
        try {
          await removeFiles([file.file_path!]);

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
        } catch (error) {
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("fileExplorer.actions.deleteError"),
          });
        }
      }
    };

    const handleRename = async (file: FileData, newName: string) => {
      return new Promise<void>(async (resolve, reject) => {
        try {
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
              reject(error);
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
              reject(error);
              return;
            }

            queryClient.invalidateQueries({ queryKey: ["files"] });
            toast({
              title: t("common.success"),
              description: t("fileExplorer.actions.renameFileSuccess"),
            });
          }
          resolve();
        } catch (error) {
          console.error("Error renaming file:", error);
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("fileExplorer.actions.renameFileError"),
          });
          reject(error);
        }
      });
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

    const handleEditFolder = async (values: {
      name: string;
      icon: string;
      color: string;
    }) => {
      if (!selectedFolder) return;

      try {
        const { error } = await supabase
          .from("folders")
          .update({
            name: values.name,
            icon: values.icon,
            color: values.color,
          })
          .eq("id", selectedFolder.id);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ["folders"] });
        toast({
          title: t("common.success"),
          description: t("fileExplorer.editFolder.success"),
        });
        setIsEditFolderOpen(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("fileExplorer.editFolder.error"),
        });
      }
    };

    const MotionTableRow = React.forwardRef<
      HTMLTableRowElement,
      HTMLMotionProps<"tr">
    >((props, ref) => <motion.tr ref={ref} {...props} />);
    MotionTableRow.displayName = "MotionTableRow";

    return (
      <div className="space-y-2 w-full px-0">
        <div className="flex justify-between items-center">
          <FileViewOptions
            view={view}
            onViewChange={setView}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalFiles={items.length}
            currentPath={currentPath}
            onNavigate={handleBreadcrumbNavigate}
          />

          {isTrashView && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmptyTrash}
              className="ml-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("fileExplorer.contextMenu.emptyTrash")}
            </Button>
          )}
        </div>

        <div className="w-full" ref={ref}>
          {items.length === 0 && !isFilesLoading && !isFoldersLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-background/50 dark:bg-black/50 backdrop-blur-sm rounded-lg border border-border/50">
              {isTrashView ? (
                <Trash2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              ) : isFavoritesView ? (
                <Star className="h-16 w-16 text-muted-foreground/50 mb-4" />
              ) : (
                <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
              )}
              <h3 className="text-xl font-medium text-foreground/90 mb-2">
                {isTrashView
                  ? t("fileExplorer.emptyState.trashEmpty")
                  : isFavoritesView
                  ? t("fileExplorer.emptyState.favoritesEmpty")
                  : t("fileExplorer.emptyState.title")}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {isTrashView
                  ? t("fileExplorer.emptyState.trashDescription")
                  : isFavoritesView
                  ? t("fileExplorer.emptyState.favoritesDescription")
                  : t("fileExplorer.emptyState.description")}
              </p>
            </div>
          ) : view === "grid" ? (
            <FileGrid
              files={items}
              isLoading={isFoldersLoading || isFilesLoading}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={isTrashView ? handleDelete : handleMoveToTrash}
              onRestore={isTrashView ? handleRestore : undefined}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onEditFolder={(folder) => {
                setSelectedFolder(folder);
                setIsEditFolderOpen(true);
              }}
              isTrashView={isTrashView}
              isFavoritesView={isFavoritesView}
            />
          ) : (
            <FileList
              files={items}
              isLoading={isFoldersLoading || isFilesLoading}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={isTrashView ? handleDelete : handleMoveToTrash}
              onRestore={isTrashView ? handleRestore : undefined}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onEditFolder={(folder) => {
                setSelectedFolder(folder);
                setIsEditFolderOpen(true);
              }}
              isTrashView={isTrashView}
              isFavoritesView={isFavoritesView}
            />
          )}
        </div>

        {selectedFile && selectedFile.content_type === "application/pdf" ? (
          <PDFViewer
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDownload={() => handleDownload(selectedFile)}
            onShare={() => handleShare(selectedFile)}
          />
        ) : (
          selectedFile && (
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
          )
        )}

        {shareFile && (
          <ShareDialog
            file={shareFile}
            open={!!shareFile}
            onOpenChange={(open) => !open && setShareFile(null)}
          />
        )}

        <CreateFolderDialog
          open={isEditFolderOpen}
          onOpenChange={setIsEditFolderOpen}
          onSubmit={handleEditFolder}
          mode="edit"
          editFolder={
            selectedFolder
              ? {
                  id: selectedFolder.id,
                  name: selectedFolder.name || selectedFolder.filename,
                  icon: selectedFolder.icon,
                  color: selectedFolder.color,
                }
              : null
          }
        />
      </div>
    );
  }
);

FileExplorer.displayName = "FileExplorer";
