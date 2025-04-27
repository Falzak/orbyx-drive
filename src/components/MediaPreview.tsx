import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { FileData } from "@/types";

interface MediaPreviewProps {
  file: FileData;
  onClose: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  file,
  onClose,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const filename = file.name;

  useEffect(() => {
    const generatePreviewUrl = async () => {
      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        if (file.type.startsWith('image')) {
          setMediaType('image');
        } else if (file.type.startsWith('video')) {
          setMediaType('video');
        } else {
          setMediaType(null);
          toast({
            title: t("common.error"),
            description: t("mediaPreview.unsupportedFormat"),
          });
          onClose();
        }
      } catch (error) {
        console.error("Error generating preview URL:", error);
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("mediaPreview.previewError"),
        });
        onClose();
      }
    };

    generatePreviewUrl();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, t, toast, onClose]);

  return (
    <>
      <Dialog open={!!file} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 flex flex-col border-0">
          <DialogHeader className="p-4">
            <DialogTitle>{filename}</DialogTitle>
            <DialogDescription>
              {t("mediaPreview.previewing")} {file.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center bg-black/90">
            {mediaType === 'image' && previewUrl && (
              <img
                src={previewUrl}
                alt={filename}
                className="max-w-full max-h-full object-contain"
                onClick={() => setShowFullScreen(true)}
                style={{ cursor: 'pointer' }}
              />
            )}
            {mediaType === 'video' && previewUrl && (
              <video
                src={previewUrl}
                controls
                autoPlay
                className="max-w-full max-h-full"
              />
            )}
            {!mediaType && (
              <div className="text-white text-lg">
                {t("mediaPreview.unsupported")}
              </div>
            )}
          </div>
          <DialogFooter className="p-4">
            <Button onClick={onClose}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showFullScreen} onOpenChange={setShowFullScreen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 flex items-center justify-center border-0 bg-black/95">
          {mediaType === 'image' && (
            <img
              src={previewUrl}
              alt={filename}
              className="max-w-full max-h-full object-contain"
            />
          )}
          {mediaType === 'video' && (
            <video
              src={previewUrl}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaPreview;
