import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/utils/storage";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userEmail?: string | null;
  onAvatarChange: (url: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  userEmail,
  onAvatarChange,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("settings.sections.profile.invalidImageType"),
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("settings.sections.profile.imageTooLarge"),
      });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setIsUploading(true);

      // Generate a unique file path for the avatar
      const fileExt = file.name.split(".").pop();
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const filePath = `${userId}/profile.${fileExt}`;
      const bucketName = "avatars";

      // Upload the file directly to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      // Call the callback with the new URL
      onAvatarChange(data.publicUrl);

      toast({
        title: t("common.success"),
        description: t("settings.sections.profile.avatarUpdated"),
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("settings.sections.profile.avatarUpdateError"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="relative group">
        <Avatar className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-background shadow-md">
          <AvatarImage
            src={previewUrl || currentAvatarUrl || undefined}
            alt={userEmail || ""}
            className="w-full h-full object-cover"
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {userEmail?.[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
            isUploading && "opacity-100 cursor-wait"
          )}
          onClick={isUploading ? undefined : triggerFileInput}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        {/* Remove button */}
        {(previewUrl || currentAvatarUrl) && !isUploading && (
          <button
            type="button"
            className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
            onClick={handleRemoveAvatar}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.uploading")}
            </>
          ) : (
            t("settings.sections.profile.changeAvatar")
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("settings.sections.profile.avatarRequirements")}
        </p>
      </div>
    </div>
  );
}
