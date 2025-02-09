
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, File, Grid, List as ListIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Folder {
  id: string;
  name: string;
  created_at: string;
}

interface FileItem {
  id: string;
  filename: string;
  content_type: string;
  created_at: string;
  folder_id: string | null;
}

export function FileExplorer() {
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'grid';
  const currentFolder = searchParams.get('folder');
  const { toast } = useToast();
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', currentFolder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('parent_id', currentFolder)
        .order('name');
      
      if (error) throw error;
      return data as Folder[];
    },
  });

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['files', currentFolder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', currentFolder)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FileItem[];
    },
  });

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a folder name",
      });
      return;
    }

    const { error } = await supabase
      .from('folders')
      .insert({
        name: newFolderName,
        parent_id: currentFolder,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder",
      });
    } else {
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
      setIsNewFolderDialogOpen(false);
      setNewFolderName('');
    }
  };

  if (foldersLoading || filesLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Files and Folders</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewFolderDialogOpen(true)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('view', 'grid');
              window.history.pushState({}, '', `?${params.toString()}`);
            }}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('view', 'list');
              window.history.pushState({}, '', `?${params.toString()}`);
            }}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={cn(
        "grid gap-4",
        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
      )}>
        {folders?.map((folder) => (
          <Card key={folder.id} className={cn(
            "group hover:border-primary transition-colors",
            viewMode === 'list' && "flex items-center"
          )}>
            <CardHeader className={cn(viewMode === 'list' && "flex-1")}>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-500" />
                {folder.name}
              </CardTitle>
            </CardHeader>
            {viewMode === 'grid' && (
              <CardFooter className="text-sm text-muted-foreground">
                Created {new Date(folder.created_at).toLocaleDateString()}
              </CardFooter>
            )}
          </Card>
        ))}

        {files?.map((file) => (
          <Card key={file.id} className={cn(
            "group hover:border-primary transition-colors",
            viewMode === 'list' && "flex items-center"
          )}>
            <CardHeader className={cn(viewMode === 'list' && "flex-1")}>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5 text-gray-500" />
                {file.filename}
              </CardTitle>
            </CardHeader>
            {viewMode === 'grid' && (
              <CardFooter className="text-sm text-muted-foreground">
                Created {new Date(file.created_at).toLocaleDateString()}
              </CardFooter>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
