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
import { formatDate, formatFileSize } from "@/lib/format";
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
  RefreshCw,
  Plus,
  FolderPlus,
  FileUp,
  Grid,
  List,
  Copy,
  HelpCircle,
  Keyboard,
  MessageSquarePlus,
  MousePointerClick,
  ArrowUpDown,
  ExternalLink,
  Info,
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from "@/components/ui/context-menu";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import CreateFolderDialog from "@/components/CreateFolderDialog";

const Index = () => {
  const session = useAuthRedirect();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [view, setView] = useLocalStorage<"grid" | "list">("viewMode", "grid");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!session?.user?.id) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("files").insert({
        filename: file.name,
        file_path: filePath,
        content_type: file.type,
        size: file.size,
        user_id: session.user.id,
        folder_id: currentFolderId,
      });

      if (dbError) throw dbError;
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
        uploadMutation.mutate(file);
      });
    },
    [uploadMutation, uploadProgress, toast, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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

  const handleRefreshFiles = () => {
    queryClient.invalidateQueries({ queryKey: ["files"] });
    toast({
      title: t("dashboard.refresh.success"),
      description: t("dashboard.refresh.description"),
    });
  };

  const handleCreateFolder = () => {
    setIsCreateFolderOpen(true);
  };

  const handleUploadClick = () => {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleSelectAll = async () => {
    const { data: files } = await supabase
      .from("files")
      .select("id")
      .eq("user_id", session.user.id);

    if (files) {
      setSelectedItems(files.map((file) => file.id));
      toast({
        title: t("common.success"),
        description: t("dashboard.selection.allSelected"),
      });
    }
  };

  const handleSortFiles = async (sortBy: string) => {
    try {
      let query = supabase
        .from("files")
        .select("*")
        .eq("user_id", session.user.id);

      switch (sortBy) {
        case "nameAsc":
          query = query.order("filename", { ascending: true });
          break;
        case "nameDesc":
          query = query.order("filename", { ascending: false });
          break;
        case "dateAsc":
          query = query.order("created_at", { ascending: true });
          break;
        case "dateDesc":
          query = query.order("created_at", { ascending: false });
          break;
        case "sizeAsc":
          query = query.order("size", { ascending: true });
          break;
        case "sizeDesc":
          query = query.order("size", { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      queryClient.setQueryData(["files"], data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    }
  };

  const handleCopyPath = () => {
    const currentPath = window.location.href;
    navigator.clipboard.writeText(currentPath);
    toast({
      title: t("common.success"),
      description: t("dashboard.clipboard.pathCopied"),
    });
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  const handleKeyboardShortcuts = () => {
    toast({
      title: t("dashboard.contextMenu.shortcuts"),
      description: t("dashboard.shortcuts.comingSoon"),
    });
  };

  const handleHelp = () => {
    window.open("/help", "_blank");
  };

  const handleFeedback = () => {
    window.open("/feedback", "_blank");
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setView(newView);
  };

  const handleFileProperties = async () => {
    if (selectedItems.length === 1) {
      const { data: file, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", selectedItems[0])
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: error.message,
        });
        return;
      }

      // Aqui você pode abrir um modal com as propriedades do arquivo
      // Por enquanto vamos apenas mostrar um toast
      toast({
        title: file.filename,
        description: `${t(
          "fileExplorer.fileProperties.size"
        )}: ${formatFileSize(file.size)} | ${t(
          "fileExplorer.fileProperties.type"
        )}: ${file.content_type} | ${t(
          "fileExplorer.fileProperties.created"
        )}: ${formatDate(file.created_at)}`,
        duration: 5000,
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-screen w-full overflow-hidden">
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
              <motion.div
                className="bg-background/20 dark:bg-black/20 backdrop-blur-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
              >
                <div className="flex items-center justify-between px-6 h-[73px]">
                  <div className="flex items-center gap-4 flex-1">
                    <h1 className="text-xl font-semibold">
                      {t("dashboard.title")}
                    </h1>
                    <div className="relative flex-1 max-w-md">
                      <Input
                        placeholder={t("common.search")}
                        className="h-9 pl-9 bg-background/20 dark:bg-black/20 border-border"
                      />
                      <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-background/20 dark:hover:bg-white/10"
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-background/20 dark:bg-black/20 backdrop-blur-xl border-border"
                      >
                        <DropdownMenuLabel className="text-foreground">
                          {t("common.language")}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                          onClick={() => i18n.changeLanguage("pt-BR")}
                          className={cn(
                            "text-foreground/90 hover:bg-background/20 dark:hover:bg-white/10 cursor-pointer",
                            i18n.language === "pt-BR" && "bg-accent"
                          )}
                        >
                          🇧🇷 Português
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => i18n.changeLanguage("en")}
                          className={cn(
                            "text-foreground/90 hover:bg-background/20 dark:hover:bg-white/10 cursor-pointer",
                            i18n.language === "en" && "bg-accent"
                          )}
                        >
                          🇺🇸 English
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-background/20 dark:hover:bg-white/10"
                        >
                          {theme === "dark" ? (
                            <Moon className="h-4 w-4" />
                          ) : (
                            <Sun className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-background/20 dark:bg-black/20 backdrop-blur-xl border-border"
                      >
                        <DropdownMenuItem
                          onClick={() => setTheme("light")}
                          className="text-foreground/90 hover:bg-background/20 dark:hover:bg-white/10"
                        >
                          <Sun className="h-4 w-4 mr-2" />
                          {t("common.theme.light")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTheme("dark")}
                          className="text-foreground/90 hover:bg-background/20 dark:hover:bg-white/10"
                        >
                          <Moon className="h-4 w-4 mr-2" />
                          {t("common.theme.dark")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-background/20 dark:hover:bg-white/10 relative"
                        >
                          <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {session?.user?.user_metadata?.avatar_url ? (
                              <img
                                src={session.user.user_metadata.avatar_url}
                                alt={session.user.email || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium text-primary">
                                {session?.user?.email?.[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 bg-background/20 dark:bg-black/20 backdrop-blur-xl border-border"
                      >
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="relative h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {session?.user?.user_metadata?.avatar_url ? (
                              <img
                                src={session.user.user_metadata.avatar_url}
                                alt={session.user.email || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-primary">
                                {session?.user?.email?.[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {session?.user?.user_metadata?.full_name ||
                                session?.user?.email?.split("@")[0]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {session?.user?.email}
                            </span>
                          </div>
                        </div>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                          onClick={() => navigate("/settings/profile")}
                          className="text-foreground/90 hover:bg-background/20 dark:hover:bg-white/10"
                        >
                          <User className="h-4 w-4 mr-2" />
                          {t("settings.sections.profile.title")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/settings/appearance")}
                          className="text-foreground/90 hover:bg-background/20 dark:hover:bg-white/10"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {t("settings.sections.appearance.title")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/settings/security")}
                          className="text-foreground/90 hover:bg-background/20 dark:hover:bg-white/10"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {t("settings.sections.security.title")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {t("common.logout")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>

              <div className="flex-1 overflow-y-auto w-full">
                <div className="p-6 h-full">
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
                  >
                    <div className="space-y-1">
                      <h1 className="text-3xl font-bold">
                        {t("dashboard.welcome", {
                          name: session?.user.email?.split("@")[0],
                        })}
                      </h1>
                      <p className="text-muted-foreground">
                        {t("dashboard.uploadHint")}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: 0.4 }}
                  >
                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-8 w-8" />
                        <p className="text-sm font-medium">
                          {t("dashboard.dropzone.title")}
                        </p>
                        <p className="text-xs">
                          {t("dashboard.dropzone.subtitle")}
                        </p>
                      </div>
                    </div>

                    <div ref={ref}>
                      <FileExplorer onFolderChange={setCurrentFolderId} />
                    </div>
                  </motion.div>
                </div>
              </div>

              {isDragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                >
                  <div className="p-8 rounded-lg border-2 border-dashed border-primary flex flex-col items-center gap-4">
                    <Upload className="h-12 w-12 text-primary animate-bounce" />
                    <p className="text-lg font-medium">
                      {t("dashboard.dropzone.dragActive")}
                    </p>
                  </div>
                </motion.div>
              )}

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
                          <span className="text-primary">Upload complete!</span>
                        ) : (
                          "Uploading..."
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(uploadProgress)}%
                      </span>
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
            </div>
          </div>
        </SidebarProvider>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-background/95 dark:bg-black/95 backdrop-blur-xl border-border/50">
        <ContextMenuItem
          onClick={handleRefreshFiles}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          {t("dashboard.contextMenu.refresh")}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-border/50" />
        <ContextMenuItem
          onClick={handleCreateFolder}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <FolderPlus className="h-4 w-4" />
          {t("dashboard.contextMenu.createFolder")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleUploadClick}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <FileUp className="h-4 w-4" />
          {t("dashboard.contextMenu.uploadFile")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleSelectAll}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <MousePointerClick className="h-4 w-4" />
          {t("dashboard.contextMenu.selectAll")}
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground">
            <ArrowUpDown className="h-4 w-4" />
            {t("dashboard.contextMenu.sortBy")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuRadioGroup value={view}>
              <ContextMenuRadioItem
                onClick={() => handleSortFiles("nameAsc")}
                value="nameAsc"
              >
                {t("fileExplorer.sortBy.nameAsc")}
              </ContextMenuRadioItem>
              <ContextMenuRadioItem
                onClick={() => handleSortFiles("nameDesc")}
                value="nameDesc"
              >
                {t("fileExplorer.sortBy.nameDesc")}
              </ContextMenuRadioItem>
              <ContextMenuRadioItem
                onClick={() => handleSortFiles("dateDesc")}
                value="dateDesc"
              >
                {t("fileExplorer.sortBy.dateDesc")}
              </ContextMenuRadioItem>
              <ContextMenuRadioItem
                onClick={() => handleSortFiles("dateAsc")}
                value="dateAsc"
              >
                {t("fileExplorer.sortBy.dateAsc")}
              </ContextMenuRadioItem>
              <ContextMenuRadioItem
                onClick={() => handleSortFiles("sizeDesc")}
                value="sizeDesc"
              >
                {t("fileExplorer.sortBy.sizeDesc")}
              </ContextMenuRadioItem>
              <ContextMenuRadioItem
                onClick={() => handleSortFiles("sizeAsc")}
                value="sizeAsc"
              >
                {t("fileExplorer.sortBy.sizeAsc")}
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground">
            {view === "grid" ? (
              <Grid className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
            {t("dashboard.contextMenu.view")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuRadioGroup value={view}>
              <ContextMenuRadioItem
                onClick={() => setView("grid")}
                value="grid"
              >
                <Grid className="h-4 w-4 mr-2" />
                {t("dashboard.contextMenu.gridView")}
              </ContextMenuRadioItem>
              <ContextMenuRadioItem
                onClick={() => setView("list")}
                value="list"
              >
                <List className="h-4 w-4 mr-2" />
                {t("dashboard.contextMenu.listView")}
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator className="bg-border/50" />
        <ContextMenuItem
          onClick={handleOpenInNewTab}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          {t("dashboard.contextMenu.newTab")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleCopyPath}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <Copy className="h-4 w-4" />
          {t("dashboard.contextMenu.copyPath")}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-border/50" />
        <ContextMenuItem
          onClick={handleHelp}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          {t("dashboard.contextMenu.help")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleKeyboardShortcuts}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <Keyboard className="h-4 w-4" />
          {t("dashboard.contextMenu.shortcuts")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleFeedback}
          className="flex items-center gap-2 cursor-pointer text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {t("dashboard.contextMenu.feedback")}
        </ContextMenuItem>
      </ContextMenuContent>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={(open) => setIsCreateFolderOpen(open)}
        onSubmit={async (values) => {
          try {
            const { error } = await supabase.from("folders").insert({
              name: values.name,
              user_id: session?.user?.id,
              parent_id: currentFolderId,
              icon: values.icon,
              color: values.color,
              created_at: new Date().toISOString(),
            });

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ["folders"] });
            toast({
              title: t("common.success"),
              description: t("fileExplorer.actions.createFolderSuccess"),
            });
            setIsCreateFolderOpen(false);
          } catch (error) {
            toast({
              variant: "destructive",
              title: t("common.error"),
              description: t("fileExplorer.actions.createFolderError"),
            });
          }
        }}
      />
    </ContextMenu>
  );
};

export default Index;
