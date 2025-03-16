import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { Upload, X, FileUp, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
// import GoogleDriveImport from "@/components/GoogleDriveImport";

interface FileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  error: string | null;
  status: "idle" | "uploading" | "success" | "error";
}

const FileUpload = ({ open, onOpenChange, onSuccess }: FileUploadProps) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      progress: 0,
      error: null,
      status: "idle" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const uploadFiles = async () => {
    if (!session?.user.id || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (const fileObj of files) {
      if (fileObj.status === "success") {
        successCount++;
        continue;
      }

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "uploading" } : f
          )
        );

        const { data, error } = await supabase.storage
          .from("files")
          .upload(
            `${session.user.id}/${fileObj.file.name}`,
            fileObj.file,
            {
              cacheControl: "3600",
              upsert: true,
              onUploadProgress: (progress) => {
                const percent = Math.round(
                  (progress.loaded / progress.total) * 100
                );
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fileObj.id ? { ...f, progress: percent } : f
                  )
                );
              },
            }
          );

        if (error) throw error;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from("files")
          .getPublicUrl(`${session.user.id}/${fileObj.file.name}`);

        // Insert file record in database
        const { error: dbError } = await supabase.from("files").insert({
          name: fileObj.file.name,
          size: fileObj.file.size,
          type: fileObj.file.type,
          path: `${session.user.id}/${fileObj.file.name}`,
          url: urlData.publicUrl,
          user_id: session.user.id,
        });

        if (dbError) throw dbError;

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id
              ? { ...f, status: "success", progress: 100 }
              : f
          )
        );
        successCount++;
      } catch (error) {
        console.error("Upload error:", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Upload failed",
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast({
        title: t("fileUpload.success"),
        description: t("fileUpload.successCount", {
          count: successCount,
          total: files.length,
        }),
      });
      onSuccess?.();
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("fileUpload.title")}</DialogTitle>
          <DialogDescription>
            {t("fileUpload.description")}
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? t("fileUpload.dropHere")
                : t("fileUpload.dragAndDrop")}
            </p>
            <Button variant="secondary" size="sm" className="mt-2">
              {t("fileUpload.browse")}
            </Button>
          </div>
        </div>

        {/* Remova estas linhas:
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs text-muted-foreground">{t("common.or")}</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <div className="flex justify-center">
          <GoogleDriveImport />
        </div>
        */}

        {files.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className="flex items-center justify-between p-2 border rounded-md bg-background"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileObj.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileObj.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {fileObj.status === "idle" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(fileObj.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {fileObj.status === "uploading" && (
                    <div className="w-20">
                      <Progress value={fileObj.progress} className="h-1.5" />
                    </div>
                  )}
                  {fileObj.status === "success" && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {fileObj.status === "error" && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-500">
                        {fileObj.error}
                      </span>
                      <X className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("fileUpload.uploading")}
              </>
            ) : (
              t("fileUpload.upload")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUpload;
