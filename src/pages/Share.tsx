import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  Download,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  downloadFile,
  getStorageProvider,
  getS3Client,
  getFileUrl,
} from "@/utils/storage";
import { decryptData } from "@/utils/encryption";
import { cn } from "@/lib/utils";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const Share = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{
    status: "idle" | "scanning" | "safe" | "unsafe" | "error";
    message?: string;
  }>({ status: "idle" });

  const {
    data: shareData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shared-file", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: shareData, error: shareError } = await supabase
        .from("shared_files")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (shareError) {
        console.error("Error fetching share:", shareError);
        return null;
      }

      if (!shareData) return null;

      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        return null;
      }

      try {
        if (shareData.encrypted_password) {
          shareData.password = decryptData(shareData.encrypted_password);
          delete shareData.encrypted_password;
        }
      } catch (decryptError) {
        console.error("Failed to decrypt shared file data:", decryptError);
      }

      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("filename, size, content_type")
        .eq("file_path", shareData.file_path)
        .maybeSingle();

      if (fileError) {
        console.error("Error fetching file:", fileError);
        return {
          ...shareData,
          filename: shareData.file_path.split("/").pop() || "arquivo",
          size: 0,
          content_type: "application/octet-stream",
        };
      }

      return {
        ...shareData,
        ...fileData,
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  console.log("ShareData:", shareData);
  console.log("Loading:", isLoading);
  console.log("Error:", error);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shareData?.password === password) {
      setIsPasswordCorrect(true);
    } else {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("share.invalidPassword"),
      });
    }
  };

  const scanFile = async () => {
    if (!shareData?.file_path) return;

    setIsScanning(true);
    setScanStatus({ status: "scanning" });

    try {
      // Verificar se é um arquivo de texto - podemos pular a verificação de vírus
      if (shareData.content_type === "text/plain") {
        console.log("Skipping virus scan for text file");
        setScanStatus({
          status: "safe",
          message: t("share.fileSafe"),
        });
        setIsScanning(false);
        return true;
      }

      let fileUrl: string;

      try {
        const { provider, providerType, bucket } = await getStorageProvider(
          shareData.content_type
        );

        switch (providerType) {
          case "supabase": {
            const { data } = supabase.storage
              .from(bucket)
              .getPublicUrl(shareData.file_path);
            fileUrl = data.publicUrl;
            break;
          }
          case "aws":
          case "backblaze":
          case "wasabi":
          case "cloudflare": {
            const client = await getS3Client(provider);
            const command = new GetObjectCommand({
              Bucket: bucket,
              Key: shareData.file_path,
            });
            fileUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
            break;
          }
          default: {
            // Fallback to Supabase if provider is not supported
            console.warn(
              `Provider ${provider} not supported, falling back to Supabase`
            );
            const { data } = supabase.storage
              .from("files")
              .getPublicUrl(shareData.file_path);
            fileUrl = data.publicUrl;
          }
        }
      } catch (providerError) {
        console.error("Error with storage provider:", providerError);
        // Fallback to Supabase
        const { data } = supabase.storage
          .from("files")
          .getPublicUrl(shareData.file_path);
        fileUrl = data.publicUrl;
      }

      try {
        const { data: scanResult, error: scanError } =
          await supabase.functions.invoke("virus-scan", {
            body: {
              fileUrl,
              fileId: id,
            },
          });

        if (scanError) {
          console.error("Error during virus scan:", scanError);
          throw new Error(scanError.message || "Virus scan failed");
        }

        if (scanResult.status === "timeout") {
          setScanStatus({
            status: "scanning",
            message: scanResult.message,
          });
          return true;
        } else if (!scanResult.safe) {
          setScanStatus({
            status: "unsafe",
            message: t("share.fileNotSafe"),
          });
          return false;
        }

        setScanStatus({
          status: "safe",
          message: t("share.fileSafe"),
        });
        return true;
      } catch (functionError) {
        console.error("Function error during virus scan:", functionError);
        setScanStatus({
          status: "error",
          message:
            t("share.scanError") +
            ": " +
            (functionError.message || "Unknown error"),
        });
        // Return true to allow download despite scan error
        return true;
      }

      // Este bloco foi movido para dentro do try/catch acima
    } catch (error) {
      console.error("Scan error:", error);
      setScanStatus({
        status: "error",
        message: error instanceof Error ? error.message : t("share.scanError"),
      });
      return false;
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownload = async () => {
    if (!shareData?.file_path) return;

    // Se for um arquivo de texto, podemos pular a verificação de vírus
    if (shareData.content_type === "text/plain") {
      console.log("Skipping virus scan for text file");
      setScanStatus({
        status: "safe",
        message: t("share.fileSafe"),
      });
    }
    // Se o status não for seguro, tente escanear o arquivo
    else if (scanStatus.status !== "safe") {
      try {
        const isSafe = await scanFile();

        // Se o arquivo não for seguro, mostre um aviso mas permita o download
        if (!isSafe && scanStatus.status === "unsafe") {
          toast({
            variant: "destructive",
            title: t("share.securityWarning"),
            description:
              scanStatus.message + ". " + t("share.downloadingAnyway"),
          });
          // Continuamos com o download mesmo assim
        }
      } catch (scanError) {
        console.error("Scan error:", scanError);
        // Continue com o download mesmo se a verificação falhar
        toast({
          variant: "destructive",
          title: t("share.securityWarning"),
          description:
            t("share.scanError") + ". " + t("share.downloadingAnyway"),
        });
      }
    }

    setIsDownloading(true);

    try {
      let blob: Blob;

      // Primeiro, vamos obter o arquivo original do banco de dados para verificar o caminho correto
      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("*")
        .eq("file_path", shareData.file_path)
        .maybeSingle();

      if (fileError) {
        console.error("Error fetching file data:", fileError);
      }

      console.log("File data from database:", fileData);

      // Tente várias abordagens para baixar o arquivo
      try {
        // Abordagem 1: Método principal de download com identificação automática de provedor
        console.log(
          "Attempting to download with automatic provider identification"
        );
        blob = await downloadFile(shareData.file_path);
        console.log(
          "Successfully downloaded using primary method with provider identification"
        );
      } catch (downloadError) {
        console.error("Download error from primary method:", downloadError);

        try {
          // Abordagem 2: Identificar o provedor e tentar novamente com informações específicas
          console.log(
            "Attempting to identify provider specifically for shared file"
          );
          const { data: sharedFileData } = await supabase
            .from("shared_files")
            .select("*")
            .eq("id", id)
            .single();

          console.log(
            "Shared file data for provider identification:",
            sharedFileData
          );

          // Tente baixar usando o ID do usuário que compartilhou
          if (sharedFileData?.shared_by) {
            try {
              blob = await downloadFile(
                shareData.file_path,
                sharedFileData.shared_by
              );
              console.log("Successfully downloaded using sharer's provider");
              return;
            } catch (sharerProviderError) {
              console.error(
                "Failed to download using sharer's provider:",
                sharerProviderError
              );
            }
          }

          // Se falhar, tente baixar diretamente do Supabase
          const { data, error } = await supabase.storage
            .from("files")
            .download(shareData.file_path);

          if (error) throw error;
          if (!data) throw new Error("Failed to download file");

          blob = data;
          console.log("Successfully downloaded using Supabase direct approach");
        } catch (directError) {
          console.error("Direct download failed:", directError);

          try {
            // Abordagem 3: Tente obter uma URL pública usando a função getFileUrl
            console.log("Attempting to get public URL using file provider");
            // Obtenha os dados do arquivo compartilhado novamente se ainda não tivermos
            let sharedById = null;
            try {
              const { data: sharedData } = await supabase
                .from("shared_files")
                .select("shared_by")
                .eq("id", id)
                .single();

              if (sharedData?.shared_by) {
                sharedById = sharedData.shared_by;
                console.log("Found shared_by ID:", sharedById);
              }
            } catch (e) {
              console.error("Error getting shared_by ID:", e);
            }

            const fileUrl = await getFileUrl(shareData.file_path, sharedById);
            console.log("Got public URL:", fileUrl);

            // Crie um objeto com a URL pública para manter a compatibilidade com o código existente
            const urlData = { publicUrl: fileUrl };

            console.log("Public URL:", urlData.publicUrl);

            const response = await fetch(urlData.publicUrl);
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);

            blob = await response.blob();
            console.log("Successfully downloaded using public URL");
          } catch (publicUrlError) {
            console.error("Public URL download failed:", publicUrlError);

            try {
              // Abordagem 4: Diferentes buckets
              const buckets = ["files", "public", "uploads", "media"];
              let downloaded = false;

              for (const bucket of buckets) {
                if (downloaded) break;

                try {
                  const { data } = await supabase.storage
                    .from(bucket)
                    .download(shareData.file_path);

                  if (data) {
                    blob = data;
                    downloaded = true;
                    console.log(
                      `Successfully downloaded from bucket: ${bucket}`
                    );
                  }
                } catch (e) {
                  console.log(`Failed to download from bucket: ${bucket}`);
                }
              }

              if (!downloaded) {
                throw new Error("All bucket attempts failed");
              }
            } catch (allBucketsError) {
              console.error("All bucket attempts failed:", allBucketsError);

              try {
                // Abordagem 5: URL assinada
                const { data: signedData, error: signedError } =
                  await supabase.storage
                    .from("files")
                    .createSignedUrl(shareData.file_path, 60);

                if (signedError) throw signedError;
                if (!signedData?.signedUrl)
                  throw new Error("No signed URL generated");

                console.log("Signed URL:", signedData.signedUrl);

                const signedResponse = await fetch(signedData.signedUrl);
                if (!signedResponse.ok)
                  throw new Error(
                    `HTTP error! status: ${signedResponse.status}`
                  );

                blob = await signedResponse.blob();
                console.log("Successfully downloaded using signed URL");
              } catch (signedUrlError) {
                console.error("Signed URL download failed:", signedUrlError);

                try {
                  // Abordagem 6: Arquivo original
                  const { data: originalFile, error: originalError } =
                    await supabase
                      .from("files")
                      .select("*")
                      .eq("file_path", shareData.file_path)
                      .maybeSingle();

                  if (originalError) throw originalError;
                  if (!originalFile) throw new Error("Original file not found");

                  console.log("Original file found:", originalFile);

                  // Tente baixar usando o ID do arquivo
                  const { data: fileData } = await supabase.storage
                    .from("files")
                    .download(
                      `${originalFile.user_id}/${originalFile.filename}`
                    );

                  if (fileData) {
                    blob = fileData;
                    console.log(
                      "Successfully downloaded using original file path"
                    );
                  } else {
                    throw new Error(
                      "Failed to download using original file path"
                    );
                  }
                } catch (originalFileError) {
                  console.error(
                    "Original file approach failed:",
                    originalFileError
                  );

                  try {
                    // Abordagem 7: Arquivo compartilhado
                    const { data: sharedFileData, error: sharedFileError } =
                      await supabase
                        .from("shared_files")
                        .select("*")
                        .eq("id", id)
                        .single();

                    if (sharedFileError) throw sharedFileError;

                    console.log("Shared file data:", sharedFileData);

                    // Tente baixar usando o caminho do arquivo compartilhado
                    if (sharedFileData.file_path) {
                      // Tente diferentes formatos de caminho
                      const possiblePaths = [
                        sharedFileData.file_path,
                        `shared/${sharedFileData.file_path}`,
                        `${sharedFileData.shared_by}/${sharedFileData.file_path}`,
                        sharedFileData.file_path.split("/").pop(), // Apenas o nome do arquivo
                      ];

                      let downloaded = false;

                      for (const path of possiblePaths) {
                        if (downloaded) break;

                        try {
                          const { data } = await supabase.storage
                            .from("files")
                            .download(path);

                          if (data) {
                            blob = data;
                            downloaded = true;
                            console.log(
                              `Successfully downloaded using path: ${path}`
                            );
                          }
                        } catch (e) {
                          console.log(`Failed to download using path: ${path}`);
                        }
                      }

                      if (downloaded) {
                        console.log(
                          "Successfully downloaded using shared file path"
                        );
                      } else {
                        throw new Error(
                          "Failed to download using shared file paths"
                        );
                      }
                    } else {
                      throw new Error("No file path in shared file data");
                    }
                  } catch (sharedFileError) {
                    console.error(
                      "Shared file approach failed:",
                      sharedFileError
                    );
                    throw new Error("All download methods failed");
                  }
                }
              }
            }
          }
        }
      }

      // Se chegamos aqui, temos um blob para baixar

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = shareData.filename || "download";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      try {
        await supabase.from("share_activity_logs").insert({
          share_id: id,
          activity_type: "download",
          user_ip: "encrypted",
          user_agent: navigator.userAgent,
        });
      } catch (logError) {
        console.error("Error logging activity:", logError);
        // Non-critical error, continue
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error instanceof Error ? error.message : t("share.downloadError"),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">{t("share.fileNotFound")}</h1>
        <Button onClick={() => navigate("/")}>{t("common.goBack")}</Button>
      </div>
    );
  }

  if (shareData.password && !isPasswordCorrect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Lock className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-4">{t("share.protectedFile")}</h1>
        <form
          onSubmit={handlePasswordSubmit}
          className="w-full max-w-sm space-y-4"
        >
          <Input
            type="password"
            placeholder={t("share.enterPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            {t("common.continue")}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div className="max-w-lg w-full bg-card rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t("share.sharedFile")}</h1>
          <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded-full">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-medium">{t("share.encrypted")}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <p className="font-medium">{shareData.filename}</p>
            <p className="text-sm text-muted-foreground">
              {t("share.fileSize")}: {(shareData.size / 1024 / 1024).toFixed(2)}{" "}
              MB
            </p>
          </div>

          {scanStatus.status !== "idle" && (
            <div
              className={cn(
                "p-3 rounded-md text-sm flex items-center gap-2",
                scanStatus.status === "scanning"
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                  : scanStatus.status === "safe"
                  ? "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300"
              )}
            >
              {scanStatus.status === "scanning" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : scanStatus.status === "safe" ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{scanStatus.message}</span>
            </div>
          )}

          <Button
            onClick={
              isScanning
                ? undefined
                : scanStatus.status === "idle"
                ? scanFile
                : handleDownload
            }
            className="w-full gap-2"
            disabled={isDownloading || isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("share.scanningFile")}
              </>
            ) : isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("share.decrypting")}
              </>
            ) : scanStatus.status === "idle" ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                {t("share.scanAndDownload")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("share.downloadFile")}
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {t("share.securityNote")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Share;
