
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <motion.h1 
            className="text-4xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Compartilhamento Seguro de Arquivos
          </motion.h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        <motion.p 
          className="text-muted-foreground text-lg mb-8 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Bem-vindo, {session?.user.email}!
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <motion.div 
            className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div 
              {...getRootProps()} 
              className={`
                p-8 border-2 border-dashed rounded-lg 
                transition-colors duration-200 ease-in-out
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}
                hover:border-primary hover:bg-primary/5
                cursor-pointer
              `}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg mb-2">
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

          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Lock className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Criptografia</h3>
              <p className="text-sm text-muted-foreground">Arquivos criptografados</p>
            </div>
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Clock className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Links Temporários</h3>
              <p className="text-sm text-muted-foreground">Configure a expiração</p>
            </div>
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Eye className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Visualização</h3>
              <p className="text-sm text-muted-foreground">Prévia de mídia</p>
            </div>
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Shield className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Proteção</h3>
              <p className="text-sm text-muted-foreground">Senha para acesso</p>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="rounded-lg bg-card/50 backdrop-blur-sm border border-border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl font-semibold mb-4">Seus Arquivos</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : userFiles?.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.content_type)}
                      {file.filename}
                    </div>
                  </TableCell>
                  <TableCell>{file.content_type}</TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>{new Date(file.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
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
                        onClick={() => deleteMutation.mutate(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
