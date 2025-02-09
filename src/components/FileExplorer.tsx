import React, { useState, useEffect, useCallback } from "react";
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

export function FileExplorer() {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Memoized function to get signed URL
  const getSignedUrl = useCallback(async (filePath: string) => {
    const { data } = await supabase.storage
      .from("files")
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  }, []);

  // Query with URL pre-fetching
  const { data: files = [] } = useQuery<FileData[]>({
    queryKey: ["files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Pre-fetch URLs for all files
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

  // Atualiza o selectedFile quando os arquivos são atualizados
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

  // Handle download
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

  // Handle preview
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
    // Se o arquivo a ser deletado é o selecionado, fecha o preview primeiro
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

    // Remove a URL do preview do estado
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

  // Motion table row component with forwardRef
  interface MotionTableRowProps extends HTMLMotionProps<"tr"> {
    layoutId?: string;
    layout?: boolean;
  }

  const MotionTableRow = React.forwardRef<
    HTMLTableRowElement,
    MotionTableRowProps
  >((props, ref) => <motion.tr ref={ref} {...props} />);
  MotionTableRow.displayName = "MotionTableRow";

  // FileContextMenu with forwardRef
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
      <ContextMenuContent className="w-48 bg-black/20 backdrop-blur-xl border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <ContextMenuItem
          onClick={() => handlePreview(file)}
          className="text-white/90 hover:bg-white/10 hover:text-white !cursor-pointer transition-colors"
        >
          <FileIcon className="h-4 w-4 mr-2" />
          Preview
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleDownload(file)}
          className="text-white/90 hover:bg-white/10 hover:text-white !cursor-pointer transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => navigate(`/share/${file.id}`)}
          className="text-white/90 hover:bg-white/10 hover:text-white !cursor-pointer transition-colors"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-white/20" />
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
          className="text-white/90 hover:bg-white/10 hover:text-white !cursor-pointer transition-colors"
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
          className="text-white/90 hover:bg-white/10 hover:text-white !cursor-pointer transition-colors"
        >
          <Edit className="h-4 w-4 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-white/20" />
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

  const renderGridView = (files: FileData[]) => (
    <motion.div
      layout
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4"
    >
      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <motion.div
            key={file.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <FileContextMenu file={file}>
              <div>
                <Card
                  className="overflow-hidden cursor-pointer border transition-shadow duration-200 hover:shadow-lg"
                  onClick={() => handlePreview(file)}
                >
                  <div className="aspect-square relative bg-gradient-to-b from-muted/5 to-muted/20">
                    {file.content_type?.startsWith("image/") ? (
                      <div className="w-full h-full">
                        {previewUrls[file.id] ? (
                          <img
                            src={previewUrls[file.id]}
                            alt={file.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">
                          {getFileIcon(file.content_type)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-card border-t">
                    <p className="font-medium truncate text-sm">
                      {file.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </Card>
              </div>
            </FileContextMenu>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );

  const renderListView = (files: FileData[]) => (
    <motion.div layout className="p-2">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[45%]">Name</TableHead>
              <TableHead className="w-[15%]">Size</TableHead>
              <TableHead className="w-[15%]">Type</TableHead>
              <TableHead className="w-[25%]">Modified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <motion.tr
                  key={file.id}
                  layout
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handlePreview(file)}
                  className="cursor-pointer transition-colors hover:bg-muted/5"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-gradient-to-b from-muted/5 to-muted/20 flex items-center justify-center shrink-0">
                        {file.content_type?.startsWith("image/") &&
                        previewUrls[file.id] ? (
                          <img
                            src={previewUrls[file.id]}
                            alt={file.filename}
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <span className="text-2xl">
                            {getFileIcon(file.content_type)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate text-sm">
                          {file.filename}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Added {formatDate(file.created_at)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-muted/30 px-2 py-1 text-xs font-medium ring-1 ring-inset ring-muted">
                      {file.content_type.split("/").pop()?.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(file.created_at)}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col prevent-flicker">
      <div className="flex items-center justify-between px-4 h-14 border-b">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>All Files</span>
          <ChevronRight className="h-4 w-4" />
          <span>Documents</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {viewMode === "grid" ? renderGridView(files) : renderListView(files)}
      </ScrollArea>

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
