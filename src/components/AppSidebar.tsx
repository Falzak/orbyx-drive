
import { 
  FolderOpen, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Star, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out.",
      });
    } else {
      navigate('/auth');
    }
  };

  const items = [
    {
      title: "All Files",
      icon: FolderOpen,
      action: () => navigate('/'),
    },
    {
      title: "Images",
      icon: Image,
      action: () => navigate('/?category=image'),
    },
    {
      title: "Documents",
      icon: FileText,
      action: () => navigate('/?category=document'),
    },
    {
      title: "Videos",
      icon: Video,
      action: () => navigate('/?category=video'),
    },
    {
      title: "Audio",
      icon: Music,
      action: () => navigate('/?category=audio'),
    },
    {
      title: "Favorites",
      icon: Star,
      action: () => navigate('/?favorites=true'),
    },
    {
      title: "Settings",
      icon: Settings,
      action: () => navigate('/settings'),
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.action}>
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
