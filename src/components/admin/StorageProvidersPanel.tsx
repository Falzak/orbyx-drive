import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  StorageProvider,
  StorageProviderDatabase,
  FileTypeMapping,
  UsageMetrics
} from "@/types/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CloudIcon, 
  Server, 
  Database, 
  ShieldAlert, 
  Key,
  RefreshCw,
  Trash2,
  Settings, 
  Edit,
  BarChart,
  Plus,
  ArrowRightLeft,
  FileIcon,
  PieChart,
  Loader
} from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  testProviderConnection, 
  migrateFiles, 
  getProviderUsageStats 
} from "@/utils/storage";

const emptyProvider: StorageProviderDatabase = {
  id: "",
  name: "",
  provider: "aws",
  is_active: false,
  credentials: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  priority: 0,
  description: "",
  file_type_patterns: [],
  is_backup: false,
  client_id: null
};

const providerTemplates = {
  aws: {
    provider: "aws",
    fields: [
      { name: "accessKeyId", label: "Access Key ID", type: "text", required: true },
      { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
      { name: "region", label: "Region", type: "text", required: true, placeholder: "us-east-1" },
      { name: "bucket", label: "Bucket Name", type: "text", required: true },
      { name: "endpoint", label: "Custom Endpoint", type: "text", required: false },
    ]
  },
  google: {
    provider: "google",
    fields: [
      { name: "projectId", label: "Project ID", type: "text", required: true },
      { name: "clientEmail", label: "Client Email", type: "text", required: true },
      { name: "privateKey", label: "Private Key", type: "textarea", required: true },
      { name: "bucket", label: "Bucket Name", type: "text", required: true },
    ]
  },
  backblaze: {
    provider: "backblaze",
    fields: [
      { name: "keyId", label: "Key ID", type: "text", required: true },
      { name: "applicationKey", label: "Application Key", type: "password", required: true },
      { name: "endpoint", label: "Endpoint", type: "text", required: true, placeholder: "https://s3.us-west-001.backblazeb2.com" },
      { name: "bucket", label: "Bucket Name", type: "text", required: true },
    ]
  },
  wasabi: {
    provider: "wasabi",
    fields: [
      { name: "accessKeyId", label: "Access Key", type: "text", required: true },
      { name: "secretAccessKey", label: "Secret Key", type: "password", required: true },
      { name: "region", label: "Region", type: "text", required: true, placeholder: "us-east-1" },
      { name: "bucket", label: "Bucket Name", type: "text", required: true },
      { name: "endpoint", label: "Endpoint", type: "text", required: false, placeholder: "s3.wasabisys.com" },
    ]
  },
  cloudflare: {
    provider: "cloudflare",
    fields: [
      { name: "accountId", label: "Account ID", type: "text", required: true },
      { name: "accessKeyId", label: "Access Key ID", type: "text", required: true },
      { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
      { name: "bucket", label: "Bucket Name", type: "text", required: true },
      { name: "endpoint", label: "Custom Endpoint", type: "text", required: false, placeholder: "https://{account-id}.r2.cloudflarestorage.com" },
    ]
  }
};

const fileTypePatterns = [
  { name: "All files", value: "*", description: "Match all file types" },
  { name: "Images", value: "image/*", description: "All image formats (JPEG, PNG, etc.)" },
  { name: "Documents", value: "application/pdf", description: "PDF documents" },
  { name: "Videos", value: "video/*", description: "All video formats" },
  { name: "Audio", value: "audio/*", description: "All audio formats" },
  { name: "Text", value: "text/*", description: "Text files (txt, md, etc.)" },
];

export const StorageProvidersPanel = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<StorageProviderDatabase | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSource, setMigrationSource] = useState<string | null>(null);
  const [migrationTarget, setMigrationTarget] = useState<string | null>(null);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");

  const [newProvider, setNewProvider] = useState<StorageProviderDatabase>({...emptyProvider});

  const { data: providers, isLoading } = useQuery({
    queryKey: ["storage-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_providers")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;

      return data as StorageProviderDatabase[];
    },
  });

  const { data: usageMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["storage-usage-metrics"],
    queryFn: async () => {
      if (!providers) return {};
      
      const metrics: Record<string, UsageMetrics> = {};
      
      for (const provider of providers) {
        try {
          const stats = await getProviderUsageStats(provider.id);
          metrics[provider.id] = stats;
        } catch (error) {
          console.error(`Error fetching metrics for ${provider.name}:`, error);
          metrics[provider.id] = {
            totalStorage: 0,
            filesCount: 0,
            lastUpdated: new Date().toISOString(),
          };
        }
      }
      
      return metrics;
    },
    enabled: !!providers,
  });

  const addProviderMutation = useMutation({
    mutationFn: async (provider: Partial<StorageProviderDatabase>) => {
      const providerToInsert = {
        name: provider.name!,
        provider: provider.provider!,
        credentials: provider.credentials!,
        is_active: provider.is_active ?? false,
        priority: provider.priority ?? 0,
        description: provider.description ?? "",
        file_type_patterns: provider.file_type_patterns ?? [],
        is_backup: provider.is_backup ?? false,
        client_id: provider.client_id ?? null,
      };

      const { data, error } = await supabase
        .from("storage_providers")
        .insert(providerToInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-providers"] });
      queryClient.invalidateQueries({ queryKey: ["storage-quota"] });
      queryClient.invalidateQueries({ queryKey: ["storage-usage-metrics"] });
      setIsAddingProvider(false);
      setNewProvider({...emptyProvider});
      toast({
        title: t("admin.storage.addSuccess"),
        description: t("admin.storage.providerAdded"),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<StorageProviderDatabase>;
    }) => {
      const { error } = await supabase
        .from("storage_providers")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-providers"] });
      queryClient.invalidateQueries({ queryKey: ["storage-quota"] });
      queryClient.invalidateQueries({ queryKey: ["storage-usage-metrics"] });
      setIsEditingProvider(false);
      setCurrentProvider(null);
      toast({
        title: t("admin.storage.updateSuccess"),
        description: t("admin.storage.providerUpdated"),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("storage_providers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-providers"] });
      queryClient.invalidateQueries({ queryKey: ["storage-quota"] });
      queryClient.invalidateQueries({ queryKey: ["storage-usage-metrics"] });
      toast({
        title: t("admin.storage.deleteSuccess"),
        description: t("admin.storage.providerDeleted"),
      });
    },
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const providerType = newProvider.provider;
    const template = providerTemplates[providerType];

    if (!newProvider.name) {
      errors.name = t("admin.storage.errors.nameRequired");
    }

    template.fields
      .filter(field => field.required)
      .forEach(field => {
        if (!newProvider.credentials[field.name]) {
          errors[field.name] = t("admin.storage.errors.fieldRequired", { field: field.label });
        }
      });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProvider = () => {
    if (!validateForm()) {
      return;
    }

    const { id, created_at, updated_at, ...providerData } = newProvider;
    addProviderMutation.mutate(providerData);
  };

  const handleToggleProvider = (id: string, is_active: boolean) => {
    updateProviderMutation.mutate({
      id,
      data: { is_active },
    });
  };

  const handleEditProvider = (provider: StorageProviderDatabase) => {
    setCurrentProvider(provider);
    setNewProvider({...provider});
    setIsEditingProvider(true);
    setActiveTab("general");
    setFormErrors({});
  };

  const handleUpdateProvider = () => {
    if (!validateForm() || !currentProvider) {
      return;
    }

    const { id, created_at, updated_at, ...updatedData } = newProvider;
    updateProviderMutation.mutate({
      id: currentProvider.id,
      data: updatedData,
    });
  };

  const handleTestConnection = async (provider: StorageProviderDatabase) => {
    setIsTestingConnection(true);
    try {
      const result = await testProviderConnection(provider);
      if (result) {
        toast({
          title: t("admin.storage.testSuccess"),
          description: t("admin.storage.testSuccessDescription"),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("admin.storage.testFailure"),
          description: t("admin.storage.testFailureDescription"),
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("admin.storage.testError"),
        description: (error as Error).message,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleStartMigration = async () => {
    if (!migrationSource || !migrationTarget) {
      toast({
        variant: "destructive",
        title: t("admin.storage.migrationError"),
        description: t("admin.storage.selectSourceAndTarget"),
      });
      return;
    }

    setIsMigrating(true);
    try {
      const result = await migrateFiles(migrationSource, migrationTarget);
      setMigrationResult(result);
      
      if (result.success) {
        toast({
          title: t("admin.storage.migrationSuccess"),
          description: t("admin.storage.migrationSuccessDescription", { 
            count: result.migratedFiles 
          }),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("admin.storage.migrationPartial"),
          description: t("admin.storage.migrationPartialDescription", { 
            success: result.migratedFiles,
            failed: result.failedFiles
          }),
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["storage-usage-metrics"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("admin.storage.migrationError"),
        description: (error as Error).message,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleAddFileTypeMapping = () => {
    if (!selectedFileType || !selectedProvider) {
      toast({
        variant: "destructive",
        title: t("admin.storage.mappingError"),
        description: t("admin.storage.selectFileTypeAndProvider"),
      });
      return;
    }

    const targetProvider = providers?.find(p => p.id === selectedProvider);
    if (!targetProvider) return;

    const newMapping: FileTypeMapping = {
      type: 'mime',
      pattern: selectedFileType,
      providerId: selectedProvider
    };

    const updatedMappings = [...(targetProvider.file_type_patterns || []), newMapping];

    updateProviderMutation.mutate({
      id: selectedProvider,
      data: { file_type_patterns: updatedMappings }
    });

    setMappingDialogOpen(false);
    setSelectedFileType("");
    setSelectedProvider("");
  };

  const handleRemoveFileTypeMapping = (providerId: string, index: number) => {
    const targetProvider = providers?.find(p => p.id === providerId);
    if (!targetProvider || !targetProvider.file_type_patterns) return;

    const updatedMappings = [...targetProvider.file_type_patterns];
    updatedMappings.splice(index, 1);

    updateProviderMutation.mutate({
      id: providerId,
      data: { file_type_patterns: updatedMappings }
    });
  };

  const handleCloseDialog = () => {
    setIsAddingProvider(false);
    setIsEditingProvider(false);
    setCurrentProvider(null);
    setNewProvider({...emptyProvider});
    setActiveTab("general");
    setFormErrors({});
  };

  const getProviderIcon = (provider: StorageProvider) => {
    switch (provider) {
      case 'aws':
        return <CloudIcon className="h-5 w-5 text-orange-500" />;
      case 'google':
        return <CloudIcon className="h-5 w-5 text-blue-500" />;
      case 'backblaze':
        return <Database className="h-5 w-5 text-red-500" />;
      case 'wasabi':
        return <Server className="h-5 w-5 text-green-500" />;
      case 'cloudflare':
        return <CloudIcon className="h-5 w-5 text-orange-400" />;
      default:
        return <Server className="h-5 w-5" />;
    }
  };

  const renderProviderForm = () => {
    const providerType = newProvider.provider;
    const template = providerTemplates[providerType];
    
    return (
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="credentials">Credenciais</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
          <TabsTrigger value="mappings">Mapeamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.storage.providerName")}</Label>
            <Input
              value={newProvider.name}
              onChange={(e) =>
                setNewProvider({ ...newProvider, name: e.target.value })
              }
              placeholder="Meu provedor de armazenamento"
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && (
              <p className="text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("admin.storage.provider")}</Label>
            <Select
              value={newProvider.provider}
              onValueChange={(value: StorageProvider) => {
                setNewProvider({ 
                  ...newProvider, 
                  provider: value,
                  credentials: {} 
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aws">
                  <div className="flex items-center gap-2">
                    <CloudIcon className="h-4 w-4 text-orange-500" />
                    Amazon S3
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex items-center gap-2">
                    <CloudIcon className="h-4 w-4 text-blue-500" />
                    Google Cloud Storage
                  </div>
                </SelectItem>
                <SelectItem value="backblaze">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-red-500" />
                    Backblaze B2
                  </div>
                </SelectItem>
                <SelectItem value="wasabi">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-green-500" />
                    Wasabi
                  </div>
                </SelectItem>
                <SelectItem value="cloudflare">
                  <div className="flex items-center gap-2">
                    <CloudIcon className="h-4 w-4 text-orange-400" />
                    Cloudflare R2
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>{t("admin.storage.description")}</Label>
            <Textarea
              value={newProvider.description || ''}
              onChange={(e) =>
                setNewProvider({ ...newProvider, description: e.target.value })
              }
              placeholder="Descrição do provedor e seu propósito"
            />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Switch
              checked={newProvider.is_active}
              onCheckedChange={(checked) =>
                setNewProvider({ ...newProvider, is_active: checked })
              }
            />
            <Label>{t("admin.storage.isActive")}</Label>
          </div>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          {template.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  value={newProvider.credentials[field.name] || ''}
                  onChange={(e) =>
                    setNewProvider({
                      ...newProvider,
                      credentials: {
                        ...newProvider.credentials,
                        [field.name]: e.target.value,
                      },
                    })
                  }
                  placeholder={field.placeholder}
                  className={formErrors[field.name] ? "border-red-500" : ""}
                  rows={4}
                />
              ) : (
                <Input
                  type={field.type}
                  value={newProvider.credentials[field.name] || ''}
                  onChange={(e) =>
                    setNewProvider({
                      ...newProvider,
                      credentials: {
                        ...newProvider.credentials,
                        [field.name]: e.target.value,
                      },
                    })
                  }
                  placeholder={field.placeholder}
                  className={formErrors[field.name] ? "border-red-500" : ""}
                />
              )}
              {formErrors[field.name] && (
                <p className="text-sm text-red-500">{formErrors[field.name]}</p>
              )}
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Input
              type="number"
              value={newProvider.priority || 0}
              onChange={(e) =>
                setNewProvider({ ...newProvider, priority: parseInt(e.target.value) || 0 })
              }
              placeholder="10"
            />
            <p className="text-sm text-muted-foreground">
              Provedores com maior prioridade serão usados primeiro quando compatíveis.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={newProvider.is_backup || false}
              onCheckedChange={(checked) =>
                setNewProvider({ ...newProvider, is_backup: checked })
              }
            />
            <div>
              <Label>Usar como backup</Label>
              <p className="text-sm text-muted-foreground">
                Arquivos enviados para outros provedores serão automaticamente copiados para este provedor.
              </p>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <Label>ID do Cliente (opcional)</Label>
            <Input
              value={newProvider.client_id || ''}
              onChange={(e) =>
                setNewProvider({ ...newProvider, client_id: e.target.value })
              }
              placeholder="cliente-123"
            />
            <p className="text-sm text-muted-foreground">
              Use para direcionar arquivos de clientes específicos para este provedor.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="mappings" className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="text-sm font-medium">Mapeamentos de Tipo de Arquivo</h3>
            <p className="text-sm text-muted-foreground">
              Define quais tipos de arquivo serão armazenados neste provedor.
              Se não houver mapeamentos, o sistema usará a prioridade do provedor.
            </p>
            
            {newProvider.file_type_patterns && newProvider.file_type_patterns.length > 0 ? (
              <div className="space-y-2">
                {newProvider.file_type_patterns.map((mapping, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      <span className="text-sm">{mapping.pattern}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedMappings = [...newProvider.file_type_patterns || []];
                        updatedMappings.splice(index, 1);
                        setNewProvider({
                          ...newProvider,
                          file_type_patterns: updatedMappings
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">Nenhum mapeamento configurado</p>
              </div>
            )}
            
            <div className="pt-2">
              <div className="grid grid-cols-3 gap-2">
                <Select 
                  onValueChange={(value) => {
                    const newMapping: FileTypeMapping = {
                      type: 'mime',
                      pattern: value,
                      providerId: newProvider.id || null
                    };
                    
                    setNewProvider({
                      ...newProvider,
                      file_type_patterns: [...(newProvider.file_type_patterns || []), newMapping]
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypePatterns.map(pattern => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        <div className="flex flex-col">
                          <span>{pattern.name}</span>
                          <span className="text-xs text-muted-foreground">{pattern.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.storage.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.storage.description")}
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Migrar Arquivos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Migrar Arquivos entre Provedores</DialogTitle>
                <DialogDescription>
                  Selecione os provedores de origem e destino para migrar arquivos.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Select value={migrationSource || ''} onValueChange={setMigrationSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers?.filter(p => p.is_active).map(provider => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              {getProviderIcon(provider.provider)}
                              {provider.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Select value={migrationTarget || ''} onValueChange={setMigrationTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers?.filter(p => p.is_active && p.id !== migrationSource).map(provider => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              {getProviderIcon(provider.provider)}
                              {provider.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {migrationResult && (
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                    <h4 className="font-medium">Resultado da migração</h4>
                    <div className="space-y-1 text-sm">
                      <p>Total de arquivos: {migrationResult.totalFiles}</p>
                      <p>Migrados com sucesso: {migrationResult.migratedFiles}</p>
                      <p>Falhas: {migrationResult.failedFiles}</p>
                      {migrationResult.errors.length > 0 && (
                        <div>
                          <p className="font-medium">Erros:</p>
                          <ul className="list-disc pl-4">
                            {migrationResult.errors.slice(0, 3).map((error: string, i: number) => (
                              <li key={i} className="text-xs truncate">{error}</li>
                            ))}
                            {migrationResult.errors.length > 3 && (
                              <li className="text-xs">E mais {migrationResult.errors.length - 3} erros...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMigrationDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleStartMigration} 
                  disabled={!migrationSource || !migrationTarget || isMigrating}
                >
                  {isMigrating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Migrando...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Iniciar Migração
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileIcon className="h-4 w-4 mr-2" />
                Mapear Tipos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Mapear Tipos de Arquivo para Provedores</DialogTitle>
                <DialogDescription>
                  Configure quais tipos de arquivo serão armazenados em cada provedor.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Arquivo</Label>
                    <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {fileTypePatterns.map(pattern => (
                          <SelectItem key={pattern.value} value={pattern.value}>
                            {pattern.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Provedor</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar provedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers?.filter(p => p.is_active).map(provider => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              {getProviderIcon(provider.provider)}
                              {provider.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-2">Mapeamentos Existentes</h4>
                  
                  {providers?.some(p => p.file_type_patterns && p.file_type_patterns.length > 0) ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provedor</TableHead>
                          <TableHead>Tipo de Arquivo</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providers?.filter(p => p.file_type_patterns && p.file_type_patterns.length > 0).map(provider => (
                          provider.file_type_patterns?.map((mapping, index) => (
                            <TableRow key={`${provider.id}-${index}`}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {getProviderIcon(provider.provider)}
                                  <span className="text-xs">{provider.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs">{mapping.pattern}</span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFileTypeMapping(provider.id, index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4 bg-muted/50 rounded-md">
                      <p className="text-sm text-muted-foreground">Nenhum mapeamento configurado</p>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setMappingDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddFileTypeMapping} 
                  disabled={!selectedFileType || !selectedProvider}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Mapeamento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddingProvider} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddingProvider(true)}>
                {t("admin.storage.addProvider")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center gap-2">
                    {getProviderIcon(newProvider.provider)}
                    {t("admin.storage.addProvider")}
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {t("admin.storage.addProviderDescription")}
                </DialogDescription>
              </DialogHeader>
              {renderProviderForm()}
              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleAddProvider}>{t("common.save")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditingProvider} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  {getProviderIcon(newProvider.provider)}
                  {t("admin.storage.editProvider")}
                </div>
              </DialogTitle>
              <DialogDescription>
                {t("admin.storage.editProviderDescription")}
              </DialogDescription>
            </DialogHeader>
            {renderProviderForm()}
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleUpdateProvider}>{t("common.update")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!isLoading && providers && providers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total de Provedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{providers.length}</div>
                <div className="flex space-x-1">
                  <Badge variant="outline" className="bg-green-50">
                    {providers.filter(p => p.is_active).length} Ativos
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Uso de Armazenamento</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <div className="h-8 flex items-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-muted-foreground text-sm">Carregando métricas...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatFileSize(
                      Object.values(usageMetrics || {}).reduce(
                        (total, metrics) => total + (metrics?.totalStorage || 0), 
                        0
                      )
                    )}
                  </div>
                  <Progress 
                    value={75} 
                    className="h-2" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Arquivos Armazenados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <div className="h-8 flex items-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-muted-foreground text-sm">Carregando métricas...</span>
                </div>
              ) : (
                <div className="text-3xl font-bold">
                  {Object.values(usageMetrics || {}).reduce(
                    (total, metrics) => total + (metrics?.filesCount || 0), 
                    0
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-1/3 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {providers && providers.length > 0 ? (
            providers.map((provider) => (
              <Card key={provider.id} className="overflow-hidden">
                <CardHeader className="bg-muted/20">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(provider.provider)}
                      <span>{provider.name}</span>
                      {provider.is_backup && (
                        <Badge variant="outline" className="bg-blue-50 ml-2">Backup</Badge>
                      )}
                    </div>
                    <Switch
                      checked={provider.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleProvider(provider.id, checked)
                      }
                    />
                  </CardTitle>
                  <CardDescription>
                    {provider.description || t(`admin.storage.providers.${provider.provider}`)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        {t("admin.storage.bucket")}
                      </p>
                      <p className="font-medium">{provider.credentials.bucket || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        {t("admin.storage.region")}
                      </p>
                      <p className="font-medium">{provider.credentials.region || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        {t("admin.storage.status")}
                      </p>
                      <div className="flex items-center">
                        <div 
                          className={`w-2 h-2 rounded-full mr-2 ${
                            provider.is_active ? "bg-green-500" : "bg-gray-400"
                          }`} 
                        />
                        <span>{provider.is_active ? t("admin.storage.active") : t("admin.storage.inactive")}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        {t("admin.storage.lastUpdated")}
                      </p>
                      <p className="font-medium">
                        {new Date(provider.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Métricas de uso</p>
                    </div>
                    
                    {isLoadingMetrics ? (
                      <div className="flex items-center">
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-muted-foreground text-sm">Carregando métricas...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Armazenamento</p>
                          <p className="text-lg font-semibold">
                            {formatFileSize(usageMetrics?.[provider.id]?.totalStorage || 0)}
                          </p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">Arquivos</p>
                          <p className="text-lg font-semibold">
                            {usageMetrics?.[provider.id]?.filesCount || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {provider.file_type_patterns && provider.file_type_patterns.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Mapeamentos de tipo de arquivo</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {provider.file_type_patterns.map((mapping, index) => (
                          <Badge key={index} variant="outline" className="bg-muted/40">
                            {mapping.pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 bg-muted/10 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProviderMutation.mutate(provider.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t("common.delete")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleEditProvider(provider);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleTestConnection(provider)}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? (
                      <Loader className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    {t("admin.storage.test")}
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card className="p-6 flex items-center justify-center flex-col">
              <Server className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">
                {t("admin.storage.noProviders")}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {t("admin.storage.noProvidersDescription")}
              </p>
              <Button onClick={() => setIsAddingProvider(true)}>
                {t("admin.storage.addFirstProvider")}
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
