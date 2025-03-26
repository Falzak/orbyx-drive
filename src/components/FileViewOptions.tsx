
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, Home, FileLock, Lock, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
// import GoogleDriveImport from "@/components/GoogleDriveImport";

interface FileViewOptionsProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  totalFiles: number;
  currentPath: string;
  onNavigate: (path: string) => void;
  onSecurityChange?: (options: SecurityOptions) => void;
  onCompressFiles?: (compress: boolean) => void;
}

export interface SecurityOptions {
  enhancedEncryption: boolean;
  passwordProtection: boolean;
  password?: string;
}

export function FileViewOptions({
  view,
  onViewChange,
  sortBy,
  onSortChange,
  totalFiles,
  currentPath,
  onNavigate,
  onSecurityChange,
  onCompressFiles,
}: FileViewOptionsProps) {
  const { t } = useTranslation();
  const pathSegments = currentPath.split("/").filter(Boolean);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [compressOpen, setCompressOpen] = useState(false);
  const [securityOptions, setSecurityOptions] = useState<SecurityOptions>({
    enhancedEncryption: false,
    passwordProtection: false,
    password: '',
  });
  const [compressionEnabled, setCompressionEnabled] = useState(false);

  const handleSecuritySubmit = () => {
    if (securityOptions.passwordProtection && (!securityOptions.password || securityOptions.password.length < 6)) {
      toast.error(t("security.passwordRequired"));
      return;
    }
    
    if (onSecurityChange) {
      onSecurityChange(securityOptions);
    }
    
    toast.success(t("security.settingsUpdated"));
    setSecurityOpen(false);
  };

  const handleCompressionSubmit = () => {
    if (onCompressFiles) {
      onCompressFiles(compressionEnabled);
    }
    
    toast.success(compressionEnabled 
      ? t("compression.enabled") 
      : t("compression.disabled")
    );
    setCompressOpen(false);
  };

  return (
    <div className="flex flex-col space-y-2 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => onNavigate("")}>
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathSegments.map((segment, index) => (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === pathSegments.length - 1 ? (
                      <BreadcrumbPage>{segment}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() =>
                          onNavigate(pathSegments.slice(0, index + 1).join("/"))
                        }
                      >
                        {segment}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="text-lg font-semibold">
            {t("fileExplorer.allFiles")} ({totalFiles})
          </h2>
          <Separator orientation="vertical" className="h-6" />
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={t("fileExplorer.sortBy.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">
                {t("fileExplorer.sortBy.nameAsc")}
              </SelectItem>
              <SelectItem value="name_desc">
                {t("fileExplorer.sortBy.nameDesc")}
              </SelectItem>
              <SelectItem value="date_asc">
                {t("fileExplorer.sortBy.dateAsc")}
              </SelectItem>
              <SelectItem value="date_desc">
                {t("fileExplorer.sortBy.dateDesc")}
              </SelectItem>
              <SelectItem value="size_asc">
                {t("fileExplorer.sortBy.sizeAsc")}
              </SelectItem>
              <SelectItem value="size_desc">
                {t("fileExplorer.sortBy.sizeDesc")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSecurityOpen(true)}
                >
                  <FileLock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurações de segurança</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCompressOpen(true)}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Compressão de arquivos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              view === "grid" && "bg-background shadow-sm"
            )}
            onClick={() => onViewChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              view === "list" && "bg-background shadow-sm"
            )}
            onClick={() => onViewChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Diálogo de configurações de segurança */}
      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações de Segurança</DialogTitle>
            <DialogDescription>
              Configure níveis adicionais de segurança para seus arquivos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enhanced" 
                checked={securityOptions.enhancedEncryption}
                onCheckedChange={(checked) => 
                  setSecurityOptions({
                    ...securityOptions,
                    enhancedEncryption: checked as boolean
                  })
                }
              />
              <Label htmlFor="enhanced">Habilitar criptografia em camadas</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="password" 
                checked={securityOptions.passwordProtection}
                onCheckedChange={(checked) => 
                  setSecurityOptions({
                    ...securityOptions,
                    passwordProtection: checked as boolean
                  })
                }
              />
              <Label htmlFor="password">Proteção com senha</Label>
            </div>
            
            {securityOptions.passwordProtection && (
              <div className="space-y-2">
                <Label htmlFor="password-input">Senha de criptografia</Label>
                <Input 
                  id="password-input" 
                  type="password" 
                  placeholder="Digite uma senha forte"
                  value={securityOptions.password || ''}
                  onChange={(e) => 
                    setSecurityOptions({
                      ...securityOptions,
                      password: e.target.value
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSecurityOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSecuritySubmit}>
              Aplicar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de compressão de arquivos */}
      <Dialog open={compressOpen} onOpenChange={setCompressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compressão de Arquivos</DialogTitle>
            <DialogDescription>
              Configure as opções de compressão para upload de arquivos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="compression" 
                checked={compressionEnabled}
                onCheckedChange={(checked) => setCompressionEnabled(checked as boolean)}
              />
              <Label htmlFor="compression">Habilitar compressão de arquivos</Label>
            </div>
            
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm">
                A compressão de arquivos reduz o tamanho de armazenamento, economizando espaço e acelerando uploads/downloads.
              </p>
              <p className="text-sm mt-2">
                Recomendado para arquivos de texto, documentos e imagens não-comprimidas.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompressOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCompressionSubmit}>
              Aplicar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
