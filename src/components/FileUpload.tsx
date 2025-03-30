
import React, { useCallback, useState, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { uploadFile } from "@/utils/storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/App";
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  Shield,
  XCircle,
  Loader2,
  FileWarning,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onComplete?: () => void;
  folderPath?: string;
  allowedFileTypes?: string[];
  maxSize?: number; // em bytes
  folderId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const FileUpload = ({
  onComplete,
  folderPath = "",
  allowedFileTypes,
  maxSize = 50 * 1024 * 1024, // 50MB padrão
  folderId,
  open,
  onOpenChange,
  onSuccess,
}: FileUploadProps) => {
  const { t } = useTranslation();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    { file: File; id?: string; success: boolean; error?: string; securityScan?: { isScanning: boolean; isThreat: boolean; details?: any } }[]
  >([]);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [securityThreatDetails, setSecurityThreatDetails] = useState<any>(null);

  // Configurar mutação
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!session?.user?.id) throw new Error("User not authenticated");

      setProgress(0);
      const fileExt = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      try {
        // Upload do arquivo para o storage
        const uploadPath = await uploadFile(file, filePath, {
          onUploadProgress: (progress) => {
            setProgress(progress);
          },
        });

        if (!uploadPath) throw new Error("Upload failed");

        // Salvar referência no banco de dados
        const { data: fileData, error: dbError } = await supabase
          .from("files")
          .insert({
            filename: file.name,
            file_path: uploadPath,
            content_type: file.type,
            size: file.size,
            user_id: session.user.id,
            folder_id: folderId,
          })
          .select("id")
          .single();

        if (dbError) throw dbError;

        setProgress(100);
        return { file, id: fileData.id, path: uploadPath };
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    onSuccess: async (result) => {
      setUploadedFiles((prev) => [
        ...prev.filter((f) => f.file.name !== result.file.name),
        { file: result.file, id: result.id, success: true, securityScan: { isScanning: true, isThreat: false } },
      ]);

      // Iniciar verificação de segurança
      try {
        // Obter URL do arquivo
        const { data: urlData } = await supabase.storage.from("files").getPublicUrl(result.path);
        
        if (urlData && urlData.publicUrl) {
          // Chamar a função de verificação de vírus
          const virusScanResponse = await supabase.functions.invoke("virus-scan", {
            body: { fileUrl: urlData.publicUrl, fileId: result.id },
          });
          
          if (virusScanResponse.error) {
            console.error("Virus scan error:", virusScanResponse.error);
            setUploadedFiles((prev) => 
              prev.map((f) => 
                f.file.name === result.file.name 
                  ? { ...f, securityScan: { isScanning: false, isThreat: false, error: virusScanResponse.error } }
                  : f
              )
            );
          } else {
            const scanResult = virusScanResponse.data;
            const isThreat = scanResult.isThreat;
            
            setUploadedFiles((prev) => 
              prev.map((f) => 
                f.file.name === result.file.name 
                  ? { ...f, securityScan: { isScanning: false, isThreat, details: scanResult } }
                  : f
              )
            );
            
            if (isThreat) {
              setSecurityThreatDetails(scanResult);
              setShowSecurityAlert(true);
            }
          }
        }
      } catch (error) {
        console.error("Security scan error:", error);
        setUploadedFiles((prev) => 
          prev.map((f) => 
            f.file.name === result.file.name 
              ? { ...f, securityScan: { isScanning: false, isThreat: false, error: "Scan failed" } }
              : f
          )
        );
      }

      queryClient.invalidateQueries({ queryKey: ["files"] });
      if (onSuccess) onSuccess();
    },
    onError: (error, variables) => {
      setUploadedFiles((prev) => [
        ...prev.filter((f) => f.file.name !== variables.name),
        { file: variables, success: false, error: error.message },
      ]);
      setProgress(null);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Adiciona arquivos à lista
      setUploadedFiles((prev) => [
        ...prev,
        ...acceptedFiles.map((file) => ({ file, success: false })),
      ]);

      // Inicia o upload para cada arquivo
      acceptedFiles.forEach((file) => {
        uploadMutation.mutate(file);
      });
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: allowedFileTypes
      ? allowedFileTypes.reduce((acc, type) => {
          acc[type] = [];
          return acc;
        }, {} as Record<string, string[]>)
      : undefined,
  });

  const hasThreatDetected = useMemo(() => {
    return uploadedFiles.some((file) => file.securityScan?.isThreat);
  }, [uploadedFiles]);

  const hasError = useMemo(() => {
    return uploadedFiles.some((file) => !file.success && file.error);
  }, [uploadedFiles]);

  const isAllComplete = useMemo(() => {
    return (
      uploadedFiles.length > 0 &&
      uploadedFiles.every(
        (file) => file.success && (file.securityScan ? !file.securityScan.isScanning : true)
      )
    );
  }, [uploadedFiles]);

  const renderFileItem = (fileItem: typeof uploadedFiles[0]) => {
    return (
      <div
        key={fileItem.file.name}
        className="flex items-center justify-between p-2 my-1 rounded bg-background border"
      >
        <div className="flex items-center">
          <div className="mr-2">
            {fileItem.success ? (
              fileItem.securityScan?.isScanning ? (
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              ) : fileItem.securityScan?.isThreat ? (
                <FileWarning className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-primary" />
              )
            ) : fileItem.error ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            )}
          </div>
          <div className="truncate max-w-[200px]">
            <p
              className={cn(
                "text-sm",
                fileItem.securityScan?.isThreat && "text-destructive"
              )}
            >
              {fileItem.file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(fileItem.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <div>
          {fileItem.success ? (
            fileItem.securityScan?.isScanning ? (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-yellow-800 dark:text-yellow-200">
                {t("fileUpload.scanning")}
              </span>
            ) : fileItem.securityScan?.isThreat ? (
              <span className="text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-red-800 dark:text-red-200">
                {t("fileUpload.securityThreat")}
              </span>
            ) : (
              <CheckCircle className="h-4 w-4 text-primary" />
            )
          ) : fileItem.error ? (
            <span className="text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-red-800 dark:text-red-200">
              {t("common.error")}
            </span>
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    );
  };

  // Handle Dialog rendering if the component is used as a dialog
  if (open !== undefined) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("fileUpload.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("fileUpload.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <Card
              className={cn(
                "p-6 border-dashed",
                isDragActive && "border-primary",
                hasError && "border-destructive",
                hasThreatDetected && "border-orange-500"
              )}
            >
              <div
                {...getRootProps()}
                className={cn(
                  "flex flex-col items-center justify-center space-y-4 p-4 text-center cursor-pointer",
                  isDragActive && "bg-primary/10 rounded-lg"
                )}
              >
                <input {...getInputProps()} />

                <div
                  className={cn(
                    "p-3 rounded-full bg-primary/10",
                    isDragActive && "bg-primary/20"
                  )}
                >
                  {hasThreatDetected ? (
                    <Shield className="h-8 w-8 text-orange-500" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium">
                    {t("fileUpload.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? t("fileUpload.dropHere")
                      : t("fileUpload.dragAndDrop")}
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput instanceof HTMLInputElement) {
                      fileInput.click();
                    }
                  }}
                >
                  {t("fileUpload.browse")}
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    {t("fileUpload.successCount", {
                      count: uploadedFiles.filter((f) => f.success).length,
                      total: uploadedFiles.length,
                    })}
                  </p>
                  {/* Lista de arquivos */}
                  <div className="space-y-1">
                    {uploadedFiles.map(renderFileItem)}
                  </div>

                  {/* Alertas */}
                  {hasThreatDetected && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t("fileUpload.securityAlert")}</AlertTitle>
                      <AlertDescription>
                        {t("fileUpload.threatDetected")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Botão para concluir */}
                  {isAllComplete && onComplete && (
                    <div className="mt-4 flex justify-end">
                      <Button onClick={onComplete}>
                        {t("common.continue")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            {uploadedFiles.some(f => f.success) && (
              <AlertDialogAction onClick={onSuccess}>
                {t("common.continue")}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <>
      <Card
        className={cn(
          "p-6 border-dashed",
          isDragActive && "border-primary",
          hasError && "border-destructive",
          hasThreatDetected && "border-orange-500"
        )}
      >
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center space-y-4 p-4 text-center cursor-pointer",
            isDragActive && "bg-primary/10 rounded-lg"
          )}
        >
          <input {...getInputProps()} />

          <div
            className={cn(
              "p-3 rounded-full bg-primary/10",
              isDragActive && "bg-primary/20"
            )}
          >
            {hasThreatDetected ? (
              <Shield className="h-8 w-8 text-orange-500" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium">
              {t("fileUpload.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? t("fileUpload.dropHere")
                : t("fileUpload.dragAndDrop")}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              const fileInput = document.querySelector('input[type="file"]');
              if (fileInput instanceof HTMLInputElement) {
                fileInput.click();
              }
            }}
          >
            {t("fileUpload.browse")}
          </Button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              {t("fileUpload.successCount", {
                count: uploadedFiles.filter((f) => f.success).length,
                total: uploadedFiles.length,
              })}
            </p>
            {/* Lista de arquivos */}
            <div className="space-y-1">
              {uploadedFiles.map(renderFileItem)}
            </div>

            {/* Alertas */}
            {hasThreatDetected && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t("fileUpload.securityAlert")}</AlertTitle>
                <AlertDescription>
                  {t("fileUpload.threatDetected")}
                </AlertDescription>
              </Alert>
            )}

            {/* Botão para concluir */}
            {isAllComplete && onComplete && (
              <div className="mt-4 flex justify-end">
                <Button onClick={onComplete}>
                  {t("common.continue")}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Diálogo de alerta de segurança */}
      <AlertDialog open={showSecurityAlert} onOpenChange={setShowSecurityAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              {t("fileUpload.securityThreat")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("fileUpload.threatDetected")}
              {securityThreatDetails && (
                <div className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                  <p>
                    <span className="font-medium">
                      {securityThreatDetails.stats.malicious}
                    </span>{" "}
                    {t("fileUpload.maliciousDetections")}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowSecurityAlert(false)}>
              {t("common.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
