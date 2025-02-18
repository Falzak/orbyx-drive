
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
import { useToast } from "@/hooks/use-toast";
import { StorageProvider, StorageProviderConfig, StorageProviderDatabase } from "@/types/storage";

export const StorageProvidersPanel = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingProvider, setIsAddingProvider] = React.useState(false);
  const [newProvider, setNewProvider] = React.useState<Partial<StorageProviderDatabase>>({
    provider: "aws",
    is_active: false,
    credentials: {},
    name: "",
  });

  const { data: providers, isLoading } = useQuery({
    queryKey: ["storage-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_providers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as StorageProviderDatabase[]).map((provider) => ({
        ...provider,
        isActive: provider.is_active,
        createdAt: provider.created_at,
        updatedAt: provider.updated_at,
      })) as StorageProviderConfig[];
    },
  });

  const addProviderMutation = useMutation({
    mutationFn: async (provider: Partial<StorageProviderDatabase>) => {
      const { data, error } = await supabase
        .from("storage_providers")
        .insert([provider])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-providers"] });
      setIsAddingProvider(false);
      setNewProvider({ provider: "aws", is_active: false, credentials: {}, name: "" });
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
      toast({
        title: t("admin.storage.updateSuccess"),
        description: t("admin.storage.providerUpdated"),
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
      toast({
        title: t("admin.storage.deleteSuccess"),
        description: t("admin.storage.providerDeleted"),
      });
    },
  });

  const handleAddProvider = () => {
    addProviderMutation.mutate(newProvider);
  };

  const handleToggleProvider = (id: string, isActive: boolean) => {
    updateProviderMutation.mutate({
      id,
      data: { is_active: isActive },
    });
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
        <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
          <DialogTrigger asChild>
            <Button>{t("admin.storage.addProvider")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.storage.addProvider")}</DialogTitle>
              <DialogDescription>
                {t("admin.storage.addProviderDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.storage.provider")}</Label>
                <Select
                  value={newProvider.provider}
                  onValueChange={(value: StorageProvider) =>
                    setNewProvider({ ...newProvider, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aws">Amazon S3</SelectItem>
                    <SelectItem value="google">Google Cloud Storage</SelectItem>
                    <SelectItem value="backblaze">Backblaze B2</SelectItem>
                    <SelectItem value="wasabi">Wasabi</SelectItem>
                    <SelectItem value="cloudflare">Cloudflare R2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.storage.accessKeyId")}</Label>
                <Input
                  value={newProvider.credentials?.accessKeyId || ""}
                  onChange={(e) =>
                    setNewProvider({
                      ...newProvider,
                      credentials: {
                        ...newProvider.credentials,
                        accessKeyId: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.storage.secretAccessKey")}</Label>
                <Input
                  type="password"
                  value={newProvider.credentials?.secretAccessKey || ""}
                  onChange={(e) =>
                    setNewProvider({
                      ...newProvider,
                      credentials: {
                        ...newProvider.credentials,
                        secretAccessKey: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.storage.region")}</Label>
                <Input
                  value={newProvider.credentials?.region || ""}
                  onChange={(e) =>
                    setNewProvider({
                      ...newProvider,
                      credentials: {
                        ...newProvider.credentials,
                        region: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.storage.bucket")}</Label>
                <Input
                  value={newProvider.credentials?.bucket || ""}
                  onChange={(e) =>
                    setNewProvider({
                      ...newProvider,
                      credentials: {
                        ...newProvider.credentials,
                        bucket: e.target.value,
                      },
                    })
                  }
                />
              </div>
              {newProvider.provider === "cloudflare" && (
                <div className="space-y-2">
                  <Label>{t("admin.storage.accountId")}</Label>
                  <Input
                    value={newProvider.credentials?.accountId || ""}
                    onChange={(e) =>
                      setNewProvider({
                        ...newProvider,
                        credentials: {
                          ...newProvider.credentials,
                          accountId: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}
              {newProvider.provider === "google" && (
                <div className="space-y-2">
                  <Label>{t("admin.storage.projectId")}</Label>
                  <Input
                    value={newProvider.credentials?.projectId || ""}
                    onChange={(e) =>
                      setNewProvider({
                        ...newProvider,
                        credentials: {
                          ...newProvider.credentials,
                          projectId: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newProvider.isActive}
                  onCheckedChange={(checked) =>
                    setNewProvider({ ...newProvider, isActive: checked })
                  }
                />
                <Label>{t("admin.storage.isActive")}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingProvider(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddProvider}>
                {t("common.save")}
              </Button>
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
          {providers?.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{provider.name}</span>
                  <Switch
                    checked={provider.isActive}
                    onCheckedChange={(checked) =>
                      handleToggleProvider(provider.id, checked)
                    }
                  />
                </CardTitle>
                <CardDescription>
                  {t(`admin.storage.providers.${provider.provider}`)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("admin.storage.bucket")}
                    </span>
                    <span>{provider.credentials.bucket}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("admin.storage.region")}
                    </span>
                    <span>{provider.credentials.region}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    deleteProviderMutation.mutate(provider.id)
                  }
                >
                  {t("common.delete")}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // Open edit dialog
                  }}
                >
                  {t("common.edit")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
