import {
  FolderOpen,
  Image,
  FileText,
  Video,
  Music,
  Star,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Upload,
  Tag,
  Clock,
  Filter,
  Users,
  Share2,
  Shield,
  Trash2,
  FolderPlus,
  Grid,
  List,
  LayoutGrid,
  Box,
  Download,
  Sun,
  Moon,
  User,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/App";
import StorageQuota from "@/components/StorageQuota";
import { useTranslation } from "react-i18next";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const { state, toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const isCollapsed = state === "collapsed";
  const { t } = useTranslation();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  // Salvar o estado no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleSidebarToggle = () => {
    toggleSidebar();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("common.logoutError"),
      });
    } else {
      navigate("/auth");
    }
  };

  const mainItems = [
    {
      title: t("sidebar.mainItems.allFiles"),
      icon: FolderOpen,
      path: "/",
    },
    {
      title: t("sidebar.mainItems.recent"),
      icon: Clock,
      path: "/?filter=recent",
      badge: recentFiles.length,
    },
    {
      title: t("sidebar.mainItems.shared"),
      icon: Share2,
      path: "/?filter=shared",
    },
    {
      title: t("sidebar.mainItems.favorites"),
      icon: Star,
      path: "/?filter=favorites",
    },
  ];

  const viewItems = [
    {
      title: t("sidebar.views.gridView"),
      icon: LayoutGrid,
      path: "/?view=grid",
    },
    {
      title: t("sidebar.views.listView"),
      icon: List,
      path: "/?view=list",
    },
  ];

  const categoryItems = [
    {
      title: t("sidebar.categories.images"),
      icon: Image,
      path: "/?category=images",
    },
    {
      title: t("sidebar.categories.documents"),
      icon: FileText,
      path: "/?category=documents",
    },
    {
      title: t("sidebar.categories.videos"),
      icon: Video,
      path: "/?category=videos",
    },
    {
      title: t("sidebar.categories.audio"),
      icon: Music,
      path: "/?category=audio",
    },
  ];

  const toolItems = [
    {
      title: t("sidebar.tools.uploadFiles"),
      icon: Upload,
      path: "/?action=upload",
    },
    {
      title: t("sidebar.tools.newFolder"),
      icon: FolderPlus,
      onClick: () => setIsCreateFolderOpen(true),
    },
    {
      title: t("sidebar.tools.bulkActions"),
      icon: Box,
      path: "/?action=bulk",
    },
    {
      title: t("sidebar.tools.downloadAll"),
      icon: Download,
      path: "/?action=download-all",
    },
  ];

  return (
    <>
      <Sidebar
        className={cn(
          "border-r border-border/5",
          "transition-all duration-300 ease-in-out",
          "bg-background/95 dark:bg-black/95",
          "backdrop-blur-2xl",
          "shadow-[1px_0_30px_-10px_rgba(0,0,0,0.08)] dark:shadow-[1px_0_30px_-10px_rgba(255,255,255,0.03)]",
          isCollapsed && "w-[70px] md:w-[80px]"
        )}
        variant="sidebar"
        collapsible="icon"
      >
        <SidebarHeader className="border-b border-border/5 p-4 bg-background/95 dark:bg-black/95">
          <motion.div layout className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary shrink-0 drop-shadow-[0_0_15px_rgba(var(--primary))] animate-pulse" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="text-xl font-semibold overflow-hidden whitespace-nowrap text-foreground"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  File Safari
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </SidebarHeader>

        <SidebarContent className="py-2">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <SidebarGroup className="px-2">
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "w-full transition-all duration-200",
                              "p-3 md:p-3.5",
                              "hover:bg-accent/20 hover:text-accent-foreground active:bg-accent/30",
                              "group relative overflow-hidden rounded-xl",
                              location.pathname + location.search ===
                                item.path &&
                                "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => navigate(item.path)}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                className={cn(
                                  "h-5 w-5 shrink-0 transition-transform duration-200",
                                  "group-hover:scale-110",
                                  isCollapsed && "w-6 h-6"
                                )}
                              />
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    className="flex-1 truncate text-base"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {item.title}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {item.badge && !isCollapsed && (
                                <Badge
                                  variant="secondary"
                                  className="ml-auto bg-primary/20 text-primary hover:bg-primary/30 h-6 px-2"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent
                            side="right"
                            className="flex items-center gap-2"
                          >
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="h-5 px-1.5">
                                {item.badge}
                              </Badge>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-4 opacity-5" />

            <SidebarGroup className="px-2">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 px-3 uppercase tracking-wider mb-2">
                      {t("sidebar.views.title")}
                    </SidebarGroupLabel>
                  </motion.div>
                )}
              </AnimatePresence>
              <SidebarGroupContent>
                <SidebarMenu>
                  {viewItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "w-full transition-all duration-200",
                              "p-3 md:p-3.5",
                              "hover:bg-accent/20 hover:text-accent-foreground active:bg-accent/30",
                              "group relative overflow-hidden rounded-xl",
                              location.pathname + location.search ===
                                item.path &&
                                "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => navigate(item.path)}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                className={cn(
                                  "h-5 w-5 shrink-0 transition-transform duration-200",
                                  "group-hover:scale-110",
                                  isCollapsed && "w-6 h-6"
                                )}
                              />
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    className="flex-1 truncate text-base"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {item.title}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-4 opacity-5" />

            <SidebarGroup className="px-2">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 px-3 uppercase tracking-wider mb-2">
                      {t("sidebar.categories.title")}
                    </SidebarGroupLabel>
                  </motion.div>
                )}
              </AnimatePresence>
              <SidebarGroupContent>
                <SidebarMenu>
                  {categoryItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "w-full transition-all duration-200",
                              "p-3 md:p-3.5",
                              "hover:bg-accent/20 hover:text-accent-foreground active:bg-accent/30",
                              "group relative overflow-hidden rounded-xl",
                              location.pathname + location.search ===
                                item.path &&
                                "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => navigate(item.path)}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                className={cn(
                                  "h-5 w-5 shrink-0 transition-transform duration-200",
                                  "group-hover:scale-110",
                                  isCollapsed && "w-6 h-6"
                                )}
                              />
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    className="flex-1 truncate text-base"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {item.title}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-4 opacity-5" />

            <SidebarGroup className="px-2">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 px-3 uppercase tracking-wider mb-2">
                      {t("sidebar.tools.title")}
                    </SidebarGroupLabel>
                  </motion.div>
                )}
              </AnimatePresence>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "w-full transition-all duration-200",
                              "p-3 md:p-3.5",
                              "hover:bg-accent/20 hover:text-accent-foreground active:bg-accent/30",
                              "group relative overflow-hidden rounded-xl",
                              location.pathname + location.search ===
                                item.path &&
                                "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={
                              item.onClick ||
                              (item.path
                                ? () => navigate(item.path)
                                : undefined)
                            }
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                className={cn(
                                  "h-5 w-5 shrink-0 transition-transform duration-200",
                                  "group-hover:scale-110",
                                  isCollapsed && "w-6 h-6"
                                )}
                              />
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    className="flex-1 truncate text-base"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {item.title}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-4 opacity-5" />

            <SidebarGroup className="px-2">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 px-3 uppercase tracking-wider mb-2">
                      {t("sidebar.system.title")}
                    </SidebarGroupLabel>
                  </motion.div>
                )}
              </AnimatePresence>
              <SidebarGroupContent>
                <div className={cn("px-2", isCollapsed && "px-1")}>
                  <StorageQuota collapsed={isCollapsed} />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter
          className={cn(
            "border-t border-border/5 bg-background/95 dark:bg-black/95",
            isCollapsed ? "p-2" : "p-4"
          )}
        >
          <div className="flex items-center justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSidebarToggle}
                  className={cn(
                    "h-9 w-9 rounded-xl",
                    "hover:bg-accent/20 hover:text-accent-foreground active:bg-accent/30",
                    "transition-all duration-200"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isCollapsed ? (
                      <motion.div
                        key="expand"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 180, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapse"
                        initial={{ rotate: 180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -180, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>{t("sidebar.expandSidebar")}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={(open) => setIsCreateFolderOpen(open)}
        onSubmit={async (values) => {
          const { error } = await supabase.from("folders").insert({
            name: values.name,
            user_id: session?.user?.id,
            icon: values.icon,
            color: values.color,
          });

          if (error) {
            toast({
              variant: "destructive",
              title: t("common.error"),
              description: t("fileExplorer.actions.createFolderError"),
            });
          } else {
            toast({
              title: t("common.success"),
              description: t("fileExplorer.actions.createFolderSuccess"),
            });
            setIsCreateFolderOpen(false);
          }
        }}
      />
    </>
  );
}
