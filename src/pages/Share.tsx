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
  Loader2,
  FileIcon,
  File,
  Clock,
  ArrowLeft,
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



  const handleDownload = async () => {
    if (!shareData?.file_path) return;

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-muted/30">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <File className="h-16 w-16 text-muted-foreground opacity-20" />
        </div>
        <h2 className="text-xl font-medium text-muted-foreground animate-pulse">
          {t("common.loading")}...
        </h2>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="bg-card p-8 rounded-xl shadow-lg flex flex-col items-center max-w-md w-full">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <FileIcon className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("share.fileNotFound")}</h1>
          <p className="text-muted-foreground text-center mb-6">
            {t("share.fileNotFoundDescription") || "The file you're looking for may have been removed or the link has expired."}
          </p>
          <Button
            onClick={() => navigate("/")}
            className="gap-2"
            variant="default"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.goBack")}
          </Button>
        </div>
      </div>
    );
  }

  if (shareData.password && !isPasswordCorrect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="bg-card p-8 rounded-xl shadow-lg flex flex-col items-center max-w-md w-full">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("share.protectedFile")}</h1>
          <p className="text-muted-foreground text-center mb-6">
            {t("share.protectedFileDescription") || "This file is password protected. Please enter the password to access it."}
          </p>
          <form
            onSubmit={handlePasswordSubmit}
            className="w-full space-y-4"
          >
            <div className="relative">
              <Input
                type="password"
                placeholder={t("share.enterPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <Lock className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button type="submit" className="w-full">
              {t("common.continue")}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-lg w-full bg-card rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("share.sharedFile")}</h1>
          <div className="flex items-center gap-1 text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-medium">{t("share.encrypted")}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-5 bg-muted rounded-lg border border-border/50">
            <div className="bg-background p-3 rounded-md shadow-sm">
              <FileIcon className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-lg truncate">{shareData.filename}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{(shareData.size / 1024 / 1024).toFixed(2)} MB</span>
                {shareData.created_at && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(shareData.created_at).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            className="w-full gap-2 py-6 text-base"
            disabled={isDownloading}
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("share.decrypting")}
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                {t("share.downloadFile")}
              </>
            )}
          </Button>

          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {t("share.securityNote") || "This file is encrypted and secure. Only you and the sender can access its contents."}
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="text-muted-foreground hover:text-foreground gap-1"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("common.backToHome") || "Back to Home"}
      </Button>
    </div>
  );
};

export default Share;
