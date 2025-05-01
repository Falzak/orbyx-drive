import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FileExplorer } from "@/components/FileExplorer";

import {
  Upload,
  Settings,
  LogOut,
  Sun,
  Moon,
  User,
  Search,
  Globe,
  Shield,
  Plus,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { WorkspaceContextMenu } from "@/components/context-menu/workspace-context-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { CreateTextFileDialog } from "@/components/CreateTextFileDialog";
import FileUpload from "@/components/FileUpload";
import { uploadFile } from "@/utils/storage";

const Index = () => {
  const session = useAuthRedirect();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();


  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateTextFileOpen, setIsCreateTextFileOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentUpload, setCurrentUpload] = useState<{
    id: string;
    abort: () => void;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Log para depuração
  console.log("Index component - Current location:", location.pathname, location.search);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!session?.user?.id) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      try {
        // Upload file using storage provider
        await uploadFile(file, filePath);

        // Add entry to database
        const { error: dbError } = await supabase.from("files").insert({
          filename: file.name,
          file_path: filePath,
          content_type: file.type,
          size: file.size,
          user_id: session.user.id,
          folder_id: currentFolderId,
        });

        if (dbError) throw dbError;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({
        title: t("common.success"),
        description: t("dashboard.uploadSuccess"),
        duration: 3000,
      });
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1000);
    },
    onError: (error) => {
      setUploadProgress(null);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("dashboard.uploadError", { error: error.message }),
        duration: 5000,
      });
    },
  });

  useEffect(() => {
    let progressInterval: number | undefined;
    let cleanupTimeout: number | undefined;

    if (uploadMutation.isPending) {
      setUploadProgress(0);
      progressInterval = window.setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 90) return prev;
          const increment = Math.max(1, 10 * (1 - prev / 90));
          return prev + increment;
        });
      }, 200);
    } else if (uploadMutation.isSuccess) {
      setUploadProgress(100);
      cleanupTimeout = window.setTimeout(() => {
        setUploadProgress(null);
      }, 1500);
    } else if (uploadMutation.isError || !uploadMutation.isPending) {
      cleanupTimeout = window.setTimeout(() => {
        setUploadProgress(null);
      }, 500);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (cleanupTimeout) clearTimeout(cleanupTimeout);
    };
  }, [
    uploadMutation.isPending,
    uploadMutation.isSuccess,
    uploadMutation.isError,
  ]);

  const handleCancelUpload = useCallback(() => {
    if (currentUpload) {
      currentUpload.abort();
      setCurrentUpload(null);
      setUploadProgress(null);
      toast({
        title: t("dashboard.upload.cancelled"),
        description: t("dashboard.upload.cancelledDescription"),
      });
    }
  }, [currentUpload, toast, t]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (uploadProgress !== null) {
        toast({
          title: t("dashboard.uploadInProgress"),
          description: t("dashboard.uploadWait"),
          duration: 3000,
        });
        return;
      }

      acceptedFiles.forEach((file) => {
        const abortController = new AbortController();
        setCurrentUpload({
          id: crypto.randomUUID(),
          abort: () => abortController.abort(),
        });

        uploadMutation.mutate(file, {
          onSuccess: () => {
            setCurrentUpload(null);
          },
          onError: () => {
            setCurrentUpload(null);
          },
        });
      });
    },
    [uploadMutation, uploadProgress, toast, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // Desabilita o clique para abrir o seletor de arquivo
    accept: {
      "image/*": [],
      "video/*": [],
      "audio/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
    },
  });

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t("common.logoutError"),
      });
    } else {
      navigate("/auth");
    }
  };

  const handleCreateFolder = () => {
    setIsCreateFolderOpen(true);
  };

  const handleCreateTextFile = () => {
    setIsCreateTextFileOpen(true);
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };

  const handleSelectAll = async () => {
    // Implementação simplificada - apenas mostra um toast
    toast({
      title: t("common.success"),
      description: t("dashboard.selection.allSelected"),
    });

    // A seleção real é feita pelo componente FileExplorer
    queryClient.invalidateQueries({ queryKey: ["files"] });
  };





  return (
    <>
      <div {...getRootProps()} className="h-screen w-full relative">
        <input {...getInputProps()} />
        <WorkspaceContextMenu
          onCreateFolder={handleCreateFolder}
          onCreateTextFile={handleCreateTextFile}
          onUploadFile={handleUploadClick}
          onSelectAll={handleSelectAll}
        >
          <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
              <AppSidebar onSearch={setSearchQuery} />
              <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
                {/* Overlay do Dashboard */}
                <AnimatePresence>
                  {isDragActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 bg-background/50 backdrop-blur-sm border-2 border-primary/20 border-dashed rounded-lg z-50 m-2"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-background/95 dark:bg-black/95 backdrop-blur-xl p-6 rounded-lg shadow-lg border border-border/50">
                          <Upload className="h-10 w-10 mx-auto mb-3 text-primary animate-bounce" />
                          <p className="text-base font-medium text-foreground">
                            {t("fileExplorer.dropzone.title")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t("fileExplorer.dropzone.subtitle")}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto w-full">
                  <div className="p-6 h-full">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    >
                      <div ref={ref}>
                        <FileExplorer
                          onFolderChange={setCurrentFolderId}
                          searchQuery={searchQuery}
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </SidebarProvider>
        </WorkspaceContextMenu>

        {/* Progress overlay com botão de cancelar */}
        {uploadProgress !== null && (
          <AnimatePresence mode="wait">
            <motion.div
              key="upload-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-4 right-4 w-80 p-4 bg-card rounded-lg shadow-lg border z-50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {uploadProgress >= 100 ? (
                    <span className="text-primary">
                      {t("dashboard.upload.complete")}
                    </span>
                  ) : (
                    t("dashboard.upload.uploading")
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
                  {uploadProgress < 100 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelUpload}
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {t("dashboard.upload.cancel")}
                    </Button>
                  )}
                </div>
              </div>
              <Progress
                value={uploadProgress}
                className={cn(
                  "h-2 transition-colors",
                  uploadProgress >= 100 && "bg-primary/10"
                )}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Botão de upload manual */}
        <Button
          onClick={() => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.multiple = true;
            fileInput.accept = [
              "image/*",
              "video/*",
              "audio/*",
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ].join(",");

            fileInput.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) {
                onDrop(Array.from(files));
              }
            };

            fileInput.click();
          }}
          className="fixed right-4 bottom-4 shadow-lg"
        >
          <Upload className="h-4 w-4 mr-2" />
          {t("dashboard.upload.button")}
        </Button>
      </div>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onCreateFolder={async (values) => {
          try {
            await supabase.from("folders").insert({
              name: values.name,
              icon: values.icon,
              color: values.color,
              user_id: session?.user.id,
              parent_id: currentFolderId,
            });

            queryClient.invalidateQueries({ queryKey: ["folders"] });
            toast({
              title: t("common.success"),
              description: t("dashboard.folder.createSuccess"),
            });
          } catch (error) {
            toast({
              variant: "destructive",
              title: t("common.error"),
              description: t("common.error"),
            });
          }
        }}
      />

      <CreateTextFileDialog
        open={isCreateTextFileOpen}
        onOpenChange={setIsCreateTextFileOpen}
        currentFolderId={currentFolderId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["files"] });
        }}
      />

      <FileUpload
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["files"] });
          toast({
            title: t("common.success"),
            description: t("fileUpload.success"),
          });
        }}
      />
    </>
  );
};

export default Index;
