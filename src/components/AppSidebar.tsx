import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FolderOpen,
  Star,
  Settings,
  LogOut,
  Upload,
  FolderPlus,
  Sun,
  Moon,
  User,
  Search,
  RefreshCw,
  Globe,
  Check,
  FileUp,
  Import,
  Trash2,
  Menu,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/FileUpload";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/App";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import StorageQuota from "@/components/StorageQuota";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppSidebarProps {
  onSearch?: (query: string) => void;
}

const LANGUAGES = [
  {
    code: "en",
    name: "English",
    flag: "🇺🇸",
  },
  {
    code: "pt-BR",
    name: "Português",
    flag: "🇧🇷",
  },
] as const;

export function AppSidebar({ onSearch }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  const searchParams = new URLSearchParams(location.search);
  const filterParam = searchParams.get('filter');

  const { session } = useAuth();
  
  // Usar o contexto da sidebar
  const { state, isMobile, openMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const { t, i18n } = useTranslation();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Função para alternar a sidebar em dispositivos móveis
  const toggleMobileSidebar = () => {
    setOpenMobile(!openMobile);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleRefreshFiles = () => {
    queryClient.invalidateQueries({ queryKey: ["files"] });
  };

  const handleCreateFolder = async (values: {
    name: string;
    icon: string;
    color: string;
  }) => {
    try {
      const { error } = await supabase.from("folders").insert({
        name: values.name,
        icon: values.icon,
        color: values.color,
        user_id: session?.user.id,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast({
        title: t("common.success"),
        description: t("fileExplorer.createFolder.success"),
      });
      setIsCreateFolderOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("fileExplorer.createFolder.error"),
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const menuItems = [
    {
      title: t("sidebar.mainItems.allFiles"),
      icon: FolderOpen,
      path: "/dashboard",
    },
    {
      title: t("sidebar.mainItems.favorites"),
      icon: Star,
      path: "/dashboard?filter=favorites",
    },
    {
      title: t("sidebar.mainItems.trash"),
      icon: Trash2,
      path: "/dashboard?filter=trash",
    },
    {
      title: t("sidebar.tools.uploadFiles"),
      icon: Upload,
      onClick: () => setIsUploadDialogOpen(true),
    },
    {
      title: t("sidebar.tools.newFolder"),
      icon: FolderPlus,
      onClick: () => setIsCreateFolderOpen(true),
    },
  ];

  return (
    <>
      {/* Botão de menu móvel - só aparece em dispositivos móveis */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50 md:hidden bg-background/50 backdrop-blur-sm border shadow-sm"
          onClick={toggleMobileSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Overlay para quando a sidebar está aberta no mobile */}
      <AnimatePresence>
        {isMobile && openMobile && (
          <motion.div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenMobile(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        className={cn(
          "border-r border-border/10",
          "transition-all duration-300 ease-in-out",
          "bg-gradient-to-b from-background/80 to-background/60",
          "dark:from-black/80 dark:to-black/60",
          "backdrop-blur-2xl",
          "shadow-[1px_0_30px_-10px_rgba(0,0,0,0.08)]",
          "dark:shadow-[1px_0_30px_-10px_rgba(255,255,255,0.03)]",
          isCollapsed ? "w-16" : "w-64"
        )}
        variant="sidebar"
        collapsible="icon"
      >
        <SidebarHeader className="border-b border-border/5 p-4 space-y-4">
          <motion.div layout className="flex items-center gap-3">
            <div className="relative">
              <img src="/drive.svg" alt="Orbyx Drive" className="h-6 w-6" />
              <div className="absolute inset-0 animate-pulse-slow blur-md bg-primary/30 rounded-full" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="text-lg font-semibold text-foreground/90"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Orbyx Drive
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {!isCollapsed && (
            <div className="space-y-2">
              <Input
                type="search"
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={handleSearchChange}
                className="h-9"
              />

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-1 h-8"
                  onClick={handleRefreshFiles}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-1 h-8 relative group"
                    >
                      <Globe className="h-4 w-4 group-hover:text-foreground/80 transition-colors" />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
                        <span className="text-[8px]">
                          {
                            LANGUAGES.find(
                              (lang) => lang.code === i18n.language
                            )?.flag
                          }
                        </span>
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 p-2 bg-background/60 dark:bg-black/60 backdrop-blur-xl border-border/50"
                  >
                    <DropdownMenuLabel className="text-xs font-medium text-foreground/70 px-2 pb-2">
                      {t("common.language")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50 -mx-2" />
                    {LANGUAGES.map((language) => (
                      <DropdownMenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={cn(
                          "gap-2 p-2 cursor-pointer text-sm",
                          "hover:bg-accent/50 focus:bg-accent/50",
                          "transition-colors duration-150",
                          i18n.language === language.code &&
                            "bg-accent/30 font-medium"
                        )}
                      >
                        <span className="text-base">{language.flag}</span>
                        <span className="flex-1">{language.name}</span>
                        {i18n.language === language.code && (
                          <Check className="h-4 w-4 text-foreground/70" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-1 h-8"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="space-y-1 p-2">
                  {menuItems.map((item) => (
                    <Tooltip key={item.title}>
                      <TooltipTrigger asChild>
                        {item.onClick ? (
                          <Button
                            variant="ghost"
                            size={isCollapsed ? "icon" : "default"}
                            className={cn(
                              "w-full justify-start gap-3 transition-all duration-200",
                              "group relative overflow-hidden",
                              isCollapsed ? "h-10 w-10 p-0" : "h-10 px-3"
                            )}
                            onClick={item.onClick}
                            data-sidebar="menu-button"
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                "text-muted-foreground"
                              )}
                            />
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 truncate text-sm"
                              >
                                {item.title}
                              </motion.span>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size={isCollapsed ? "icon" : "default"}
                            className={cn(
                              "w-full justify-start gap-3 transition-all duration-200",
                              "group relative overflow-hidden",
                              isCollapsed ? "h-10 w-10 p-0" : "h-10 px-3"
                            )}
                            asChild
                            data-sidebar="menu-button"
                            data-active={
                              (item.path === "/dashboard" && !filterParam) ||
                              (item.path?.includes(filterParam || "") && filterParam)
                            }
                          >
                            <Link to={item.path!}>
                              <item.icon
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  ((item.path === "/dashboard" && !filterParam) ||
                                   (item.path?.includes(filterParam || "") && filterParam))
                                    ? "text-accent-foreground"
                                    : "text-muted-foreground"
                                )}
                              />
                              {!isCollapsed && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex-1 truncate text-sm"
                                >
                                  {item.title}
                                </motion.span>
                              )}
                            </Link>
                          </Button>
                        )}
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent
                          side="right"
                          className="bg-background/60 backdrop-blur-xl border-border/50"
                        >
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/5 p-4 space-y-4">
          <StorageQuota collapsed={isCollapsed} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full gap-3 h-auto p-2",
                  isCollapsed ? "justify-center" : "justify-start",
                  "group relative overflow-hidden",
                  "ring-1 ring-border/10 hover:ring-border/20 dark:ring-border/5 dark:hover:ring-border/30"
                )}
                data-sidebar="menu-button"
              >
                <Avatar
                  className={cn(
                    "h-8 w-8 ring-2 ring-border/50 group-hover:ring-border/80 dark:ring-border/30 dark:group-hover:ring-primary/40",
                    "transition-all duration-200 group-hover:scale-105",
                    "border-2 border-background",
                    isCollapsed && "h-6 w-6"
                  )}
                >
                  <AvatarImage
                    src={session?.user?.user_metadata?.avatar_url}
                    alt={session?.user?.email || ""}
                    className="group-hover:scale-105 transition-transform duration-200"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-200">
                    {session?.user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start flex-1 min-w-0 group-hover:translate-x-0.5 transition-transform duration-200">
                    <span className="text-sm font-medium truncate w-full text-foreground/90 group-hover:text-foreground transition-colors duration-200">
                      {session?.user?.user_metadata?.full_name ||
                        session?.user?.email?.split("@")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full group-hover:text-muted-foreground/80 transition-colors duration-200">
                      {session?.user?.email}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? "center" : "start"}
              className="w-80 p-2 bg-background/80 dark:bg-background/90 backdrop-blur-xl border-border/50 dark:border-border/30 dark:shadow-lg dark:shadow-primary/5"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="relative group">
                    <Avatar className="h-16 w-16 ring-2 ring-border/50 dark:ring-border/70 transition-all duration-200 group-hover:ring-border/80 dark:group-hover:ring-primary/50 group-hover:scale-105 border-2 border-background">
                      <AvatarImage
                        src={session?.user?.user_metadata?.avatar_url}
                        alt={session?.user?.email || ""}
                        className="group-hover:scale-105 transition-transform duration-200"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl group-hover:bg-primary/20 transition-colors duration-200">
                        {session?.user?.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <span className="text-base font-medium truncate text-foreground">
                      {session?.user?.user_metadata?.full_name ||
                        session?.user?.email?.split("@")[0]}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {session?.user?.email}
                    </span>
                  </div>
                </div>
              </motion.div>

              <DropdownMenuSeparator className="bg-border/10" />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <DropdownMenuGroup className="p-2">
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="gap-3 p-3 cursor-pointer group transition-all duration-200 rounded-lg"
                    data-sidebar="menu-button"
                  >
                    <div className="relative">
                      <Settings className="h-4 w-4 group-hover:scale-105 transition-transform duration-200" />
                      <div className="absolute inset-0 blur-sm bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {t("settings.title")}
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:translate-x-0.5 transition-transform duration-200">
                        Preferências, segurança e mais
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </motion.div>

              <DropdownMenuSeparator className="bg-border/10" />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="p-2"
              >
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-3 p-3 cursor-pointer text-destructive focus:text-destructive group transition-all duration-200 rounded-lg"
                  data-sidebar="menu-button"
                >
                  <div className="relative">
                    <LogOut className="h-4 w-4 group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 blur-sm bg-destructive/20 dark:bg-destructive/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                      {t("common.logout")}
                    </span>
                    <span className="text-xs text-destructive/70 group-hover:translate-x-0.5 transition-transform duration-200">
                      {t("common.logoutDescription")}
                    </span>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onCreateFolder={handleCreateFolder}
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
}
