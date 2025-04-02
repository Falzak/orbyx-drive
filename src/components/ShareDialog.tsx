
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { FileData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Link, Trash, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { encryptData, decryptData } from "@/utils/encryption";
import { useTranslation } from "react-i18next";

interface ShareDialogProps {
  file: FileData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ file, open, onOpenChange }: ShareDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const { data: existingShare, isLoading: isLoadingShare } = useQuery({
    queryKey: ['shared-file', file.file_path],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_files")
        .select("*")
        .eq("file_path", file.file_path)
        .maybeSingle();

      if (error) {
        console.error("Error fetching share:", error);
        return null;
      }

      if (data && data.encrypted_password) {
        try {
          data.password = decryptData(data.encrypted_password);
        } catch (decryptError) {
          console.error("Error decrypting password:", decryptError);
        }
      }

      return data;
    },
  });

  useEffect(() => {
    if (existingShare) {
      setIsPublic(existingShare.is_public);
      setPassword(existingShare.password || "");
      setExpiresAt(existingShare.expires_at || "");
      setIsEncrypted(true);
      setShareUrl(`${window.location.origin}/share/${existingShare.id}`);
    }
  }, [existingShare]);

  const handleShare = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const shareData: any = {
        file_path: file.file_path,
        shared_by: user.id,
        is_public: isPublic,
        is_encrypted: isEncrypted,
      };

      if (password) {
        shareData.encrypted_password = encryptData(password);
        shareData.password = null;
      } else {
        shareData.encrypted_password = null;
        shareData.password = null;
      }

      const { data, error } = await supabase
        .from("shared_files")
        .upsert(shareData)
        .select()
        .single();

      if (error) throw error;

      const newShareUrl = `${window.location.origin}/share/${data.id}`;
      setShareUrl(newShareUrl);
      queryClient.invalidateQueries({ queryKey: ['shared-file', file.file_path] });

      toast({
        title: t("share.dialog.linkCreated"),
        description: t("share.dialog.encryptedLinkGenerated"),
      });
    } catch (error) {
      console.error("Share error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("share.dialog.clipboardError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSharing = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("shared_files")
        .delete()
        .eq("file_path", file.file_path);

      if (error) throw error;

      setShareUrl("");
      queryClient.invalidateQueries({ queryKey: ['shared-file', file.file_path] });

      toast({
        title: t("share.dialog.stopSharing"),
        description: t("share.dialog.stopSharingError"),
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Stop sharing error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("share.dialog.stopSharingError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t("share.dialog.linkCopied"),
        description: t("share.dialog.clipboardSuccess"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("share.dialog.clipboardError"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {existingShare ? t("share.dialog.manageSharing") : t("share.dialog.shareFile")}
            <ShieldCheck className="h-4 w-4 text-primary" />
          </DialogTitle>
          <DialogDescription>
            {existingShare 
              ? t("share.dialog.secureSharing")
              : t("share.dialog.secureOptions")}
          </DialogDescription>
        </DialogHeader>
        
        {existingShare ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">{t("share.dialog.sharingLink")}</p>
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-transparent"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("share.dialog.sharingSettings")}</p>
              <div className="space-y-1">
                <p className="text-sm">{isPublic ? t("share.dialog.accessPublic") : t("share.dialog.accessProtected")}</p>
                {existingShare.encrypted_password && <p className="text-sm">{t("share.dialog.passwordProtected")}</p>}
                <p className="text-sm flex items-center gap-1">
                  {t("share.dialog.encryptionEnabled")}
                  <span className="text-primary flex items-center">
                    <ShieldCheck className="h-3 w-3 inline ml-1" />
                  </span>
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleStopSharing}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  {t("share.dialog.stopSharing")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="public">{t("share.dialog.publicLink")}</Label>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="encrypted" className="flex items-center gap-1">
                {t("share.dialog.aesEncryption")}
                <span className="text-xs text-muted-foreground">{t("share.dialog.recommended")}</span>
              </Label>
              <Switch
                id="encrypted"
                checked={isEncrypted}
                onCheckedChange={setIsEncrypted}
                disabled={true}
              />
            </div>

            {!isPublic && (
              <div className="grid gap-2">
                <Label htmlFor="password">{t("share.dialog.protectionPassword")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("share.dialog.passwordOptional")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("share.dialog.passwordEncrypted")}
                </p>
              </div>
            )}

            <Button
              onClick={handleShare}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  {t("share.dialog.generateSecureLink")}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
