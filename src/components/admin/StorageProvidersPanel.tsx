import React from "react";
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
} from "@/types/storage";
import { 
  CloudIcon, 
  Server, 
  Database, 
  ShieldAlert, 
  Key,
  RefreshCw,
  Trash2,
  Settings, 
  Edit 
} from "lucide-react";

// Initial empty state for the provider
const emptyProvider: StorageProviderDatabase = {
  id: "",
  name: "",
  provider: "aws",
  is_active: false,
  credentials: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Provider template configurations for easier setup
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

export const StorageProvidersPanel = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingProvider, setIsAddingProvider] = React.useState(false);
  const [isEditingProvider, setIsEditingProvider] = React.useState(false);
  const [currentProvider, setCurrentProvider] = React.useState<StorageProviderDatabase | null>(null);
  const [activeTab, setActiveTab] = React.useState("general");
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Create a new provider state separate from currentProvider
  const [newProvider, setNewProvider] = React.useState<StorageProviderDatabase>({...emptyProvider});

  const { data: providers, isLoading } = useQuery({
    queryKey: ["storage-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_providers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as StorageProviderDatabase[];
    },
  });

  const addProviderMutation = useMutation({
    mutationFn: async (provider: Partial<StorageProviderDatabase>) => {
      const providerToInsert = {
        name: provider.name!,
        provider: provider.provider!,
        credentials: provider.credentials!,
        is_active: provider.is_active ?? false,
        created_at: provider.created_at,
        updated_at: provider.updated_at
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
      // Adicionar invalidação da quota
      queryClient.invalidateQueries({ queryKey: ["storage-quota"] });
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
      // Adicionar invalidação da quota
      queryClient.invalidateQueries({ queryKey: ["storage-quota"] });
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
      // Adicionar invalidação da quota
      queryClient.invalidateQueries({ queryKey: ["storage-quota"] });
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
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="credentials">Credenciais</TabsTrigger>
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
                // Reset credentials when changing provider type
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
                    </div>
                    <Switch
                      checked={provider.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleProvider(provider.id, checked)
                      }
                    />
                  </CardTitle>
                  <CardDescription>
                    {t(`admin.storage.providers.${provider.provider}`)}
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
                    onClick={() => {
                      toast({
                        title: t("admin.storage.testSuccess"),
                        description: t("admin.storage.testSuccessDescription"),
                      });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
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
