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
        title: "Error",
        description: "Failed to log out.",
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
      path: "/?action=new-folder",
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
    <Sidebar
      className={cn(
        "border-r border-border",
        "transition-[width] duration-300 bg-background/20 dark:bg-black/20 backdrop-blur-xl"
      )}
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-4">
        <motion.div layout className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className="text-lg font-semibold overflow-hidden whitespace-nowrap text-foreground"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                File Safari
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={cn(
                        "w-full transition-colors",
                        location.pathname + location.search === item.path &&
                          "bg-accent"
                      )}
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.views.title")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {viewItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={cn(
                        "w-full transition-colors",
                        location.pathname + location.search === item.path &&
                          "bg-accent"
                      )}
                      onClick={() => navigate(item.path)}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>
              {t("sidebar.categories.title")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {categoryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={cn(
                        "w-full transition-colors",
                        location.pathname + location.search === item.path &&
                          "bg-accent"
                      )}
                      onClick={() => navigate(item.path)}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.tools.title")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {toolItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={cn(
                        "w-full transition-colors",
                        location.pathname + location.search === item.path &&
                          "bg-accent"
                      )}
                      onClick={() => navigate(item.path)}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.system.title")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className={cn("px-2", isCollapsed && "px-1")}>
                <StorageQuota />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter
        className={cn("border-t border-border", isCollapsed ? "p-2" : "p-4")}
      >
        <div className="flex items-center justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSidebarToggle}
                className="h-8 w-8 hover:bg-background/20 dark:hover:bg-white/10"
              >
                <AnimatePresence mode="wait">
                  {isCollapsed ? (
                    <motion.div
                      key="expand"
                      initial={{ rotate: -180 }}
                      animate={{ rotate: 0 }}
                      exit={{ rotate: 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="collapse"
                      initial={{ rotate: 180 }}
                      animate={{ rotate: 0 }}
                      exit={{ rotate: -180 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronLeft className="h-4 w-4" />
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
  );
}
