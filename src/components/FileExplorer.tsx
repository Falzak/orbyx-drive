import React, { useState, useCallback } from "react";
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

export function FileExplorer() {
  const { session } = useAuth();
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [view, setView] = useLocalStorage<"grid" | "list">("file-view", "grid");
  const [sortBy, setSortBy] = useLocalStorage<string>("file-sort", "date_desc");
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createFolder = async (name: string, parentId: string | null = null) => {
    const { error } = await supabase.from("folders").insert({
      name,
      parent_id: parentId,
      user_id: session?.user.id,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["folders"] });
  };

  const getSignedUrl = useCallback(async (filePath: string) => {
    const { data } = await supabase.storage
      .from("files")
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  }, []);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files", sortBy],
    queryFn: async () => {
      const [field, direction] = sortBy.split("_");
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", session?.user.id)
        .order(field === "name" ? "filename" : "created_at", {
          ascending: direction === "asc",
        });

      if (error) throw error;

      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          try {
            const url = await getSignedUrl(file.file_path);
            if (url) {
              setPreviewUrls((prev) => ({
                ...prev,
                [file.id]: url,
              }));
            }
          } catch (error) {
            console.error("Failed to get signed URL for file:", file.id);
          }
          return file;
        })
      );

      return filesWithUrls;
    },
  });

  useEffect(() => {
    if (selectedFile) {
      const updatedFile = files.find((file) => file.id === selectedFile.id);
      if (!updatedFile) {
        setSelectedFile(null);
      } else if (updatedFile && previewUrls[updatedFile.id]) {
        setSelectedFile({
          ...updatedFile,
          url: previewUrls[updatedFile.id],
        });
      }
    }
  }, [files, previewUrls, selectedFile]);

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

    const { error: storageError } = await supabase.storage
      .from("files")
      .remove([file.file_path]);

    if (storageError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete file.",
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
        title: "Error",
        description: "Failed to delete file record.",
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
      title: "Success",
      description: "File deleted successfully.",
    });
  };

  const handleRename = async (file: FileData, newName: string) => {
    const { error } = await supabase
      .from("files")
      .update({ filename: newName })
      .eq("id", file.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to rename file.",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["files"] });
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
      <ContextMenuContent className="min-w-[12rem] bg-background/80 dark:bg-black/80 backdrop-blur-xl border-border shadow-lg rounded-lg">
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
      <FileViewOptions
        view={view}
        onViewChange={setView}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalFiles={files.length}
      />

      <div className="w-full">
        {view === "grid" ? (
          <div className="min-h-[400px] w-full">
            <FileGrid
              files={files}
              isLoading={isLoading}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onShare={(file) => navigate(`/share/${file.id}`)}
              onDelete={handleDelete}
              onRename={handleRename}
              onToggleFavorite={async (file) => {
                const { error } = await supabase
                  .from("files")
                  .update({
                    is_favorite: !file.is_favorite,
                  })
                  .eq("id", file.id);

                if (!error) {
                  queryClient.invalidateQueries({ queryKey: ["files"] });
                }
              }}
            />
          </div>
        ) : (
          <div className="min-h-[400px] w-full">
            <FileList
              files={files}
              isLoading={isLoading}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onShare={(file) => navigate(`/share/${file.id}`)}
              onDelete={handleDelete}
              onRename={handleRename}
              onToggleFavorite={async (file) => {
                const { error } = await supabase
                  .from("files")
                  .update({
                    is_favorite: !file.is_favorite,
                  })
                  .eq("id", file.id);

                if (!error) {
                  queryClient.invalidateQueries({ queryKey: ["files"] });
                }
              }}
            />
          </div>
        )}
      </div>

      {selectedFile && (
        <MediaPreview
          file={{
            ...selectedFile,
            url: selectedFile.url || undefined,
          }}
          onClose={() => {
            setSelectedFile(null);
          }}
          onDownload={async () => {
            if (selectedFile.url) {
              window.open(selectedFile.url, "_blank");
            }
          }}
          onShare={() => {
            navigate(`/share/${selectedFile.id}`);
          }}
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
            }
          }}
        />
      )}
    </div>
  );
}
