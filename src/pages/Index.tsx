
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Clock, Eye, Shield, LogOut, Sun, Moon, Share2, Trash2, Star, Video, Music, File } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MediaPreview from '@/components/MediaPreview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FileWithPreview extends File {
  preview?: string;
}

interface FileData {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  is_favorite: boolean;
  file_path: string;
  created_at: string;
}

interface ShareSettings {
  is_public: boolean;
  custom_url?: string;
  password?: string;
  expires_at?: string;
}

const Index = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    is_public: false,
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Toggle dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch user's files
  const { data: userFiles, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FileData[];
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          filename: file.name,
          file_path: filePath,
          content_type: file.type,
          size: file.size,
          user_id: session?.user.id,
        });
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao enviar arquivo: " + error.message,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileData: FileData) => {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([fileData.file_path]);
      
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileData.id);
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: "Sucesso",
        description: "Arquivo deletado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao deletar arquivo: " + error.message,
      });
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async ({ fileData, settings }: { fileData: FileData, settings: ShareSettings }) => {
      const { error } = await supabase
        .from('shared_files')
        .insert({
          file_path: fileData.file_path,
          shared_by: session?.user.id,
          is_public: settings.is_public,
          custom_url: settings.custom_url,
          password: settings.password,
          expires_at: settings.expires_at,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Arquivo compartilhado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao compartilhar arquivo: " + error.message,
      });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string, is_favorite: boolean }) => {
      const { error } = await supabase
        .from('files')
        .update({ is_favorite })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao sair.",
      });
    } else {
      navigate('/auth');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
    
    acceptedFiles.forEach(file => {
      uploadMutation.mutate(file);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
      'audio/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    }
  });

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('video')) return <Video className="h-6 w-6" />;
    if (contentType.startsWith('audio')) return <Music className="h-6 w-6" />;
    if (contentType.startsWith('image')) return <Eye className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border">
          <div className="space-y-2">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Compartilhamento Seguro
            </motion.h1>
            <p className="text-muted-foreground">
              Bem-vindo, {session?.user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-full"
            >
              {isDarkMode ? 
                <Sun className="h-5 w-5 text-yellow-500" /> : 
                <Moon className="h-5 w-5" />
              }
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Upload and Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <motion.div 
            className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border shadow-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              {...getRootProps()} 
              className={`
                p-8 border-2 border-dashed rounded-lg 
                transition-all duration-300 ease-in-out
                ${isDragActive ? 'border-primary bg-primary/10 scale-105' : 'border-border'}
                hover:border-primary hover:bg-primary/5
                cursor-pointer group
              `}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 
                    "Solte os arquivos aqui..." : 
                    "Arraste arquivos ou clique para selecionar"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporta imagens, vídeos, áudios e documentos
                </p>
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              { icon: Lock, title: "Criptografia", desc: "Arquivos criptografados" },
              { icon: Clock, title: "Links Temporários", desc: "Configure a expiração" },
              { icon: Eye, title: "Visualização", desc: "Prévia de mídia" },
              { icon: Shield, title: "Proteção", desc: "Senha para acesso" }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border hover:bg-card/70 transition-colors group"
              >
                <feature.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Files Table */}
        <motion.div 
          className="rounded-lg bg-card/50 backdrop-blur-sm border border-border p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold mb-4">Seus Arquivos</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="text-muted-foreground">Carregando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : userFiles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum arquivo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  userFiles?.map((file) => (
                    <TableRow key={file.id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.content_type)}
                          <Button
                            variant="link"
                            className="p-0 h-auto hover:no-underline"
                            onClick={() => {
                              setSelectedFile(file);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            {file.filename}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{file.content_type}</TableCell>
                      <TableCell className="text-muted-foreground">{formatFileSize(file.size)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              toggleFavoriteMutation.mutate({
                                id: file.id,
                                is_favorite: !file.is_favorite,
                              });
                            }}
                          >
                            <Star
                              className={`h-4 w-4 ${file.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                            />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setSelectedFile(file);
                                  setShareSettings({ is_public: false });
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Compartilhar Arquivo</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="public">Público</Label>
                                  <Switch
                                    id="public"
                                    checked={shareSettings.is_public}
                                    onCheckedChange={(checked) => 
                                      setShareSettings(prev => ({ ...prev, is_public: checked }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="custom-url">URL Personalizada</Label>
                                  <Input
                                    id="custom-url"
                                    placeholder="url-personalizada"
                                    value={shareSettings.custom_url || ''}
                                    onChange={(e) => 
                                      setShareSettings(prev => ({ ...prev, custom_url: e.target.value }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="password">Senha (opcional)</Label>
                                  <Input
                                    id="password"
                                    type="password"
                                    value={shareSettings.password || ''}
                                    onChange={(e) => 
                                      setShareSettings(prev => ({ ...prev, password: e.target.value }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="expires">Data de Expiração</Label>
                                  <Input
                                    id="expires"
                                    type="datetime-local"
                                    value={shareSettings.expires_at || ''}
                                    onChange={(e) => 
                                      setShareSettings(prev => ({ ...prev, expires_at: e.target.value }))
                                    }
                                  />
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    if (selectedFile) {
                                      shareMutation.mutate({
                                        fileData: selectedFile,
                                        settings: shareSettings,
                                      });
                                    }
                                  }}
                                >
                                  Compartilhar
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteMutation.mutate(file)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon(selectedFile?.content_type || '')}
                {selectedFile?.filename}
              </DialogTitle>
            </DialogHeader>
            {selectedFile && (
              <div className="mt-4">
                <MediaPreview
                  contentType={selectedFile.content_type}
                  url={supabase.storage.from('files').getPublicUrl(selectedFile.file_path).data.publicUrl}
                  filename={selectedFile.filename}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
