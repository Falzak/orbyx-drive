
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileData } from "@/types";
import { Download, Share2, Star, X } from "lucide-react";

export interface MediaPreviewProps {
  file: FileData;
  onClose?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  file,
  onClose,
  onDownload,
  onShare,
  onToggleFavorite,
}) => {
  const renderPreview = () => {
    if (file.content_type.startsWith("image/")) {
      return (
        <img
          src={file.url}
          alt={file.filename}
          className="max-w-full max-h-[80vh] object-contain"
        />
      );
    } else if (file.content_type.startsWith("video/")) {
      return (
        <video
          src={file.url}
          controls
          className="max-w-full max-h-[80vh]"
        >
          Your browser does not support the video tag.
        </video>
      );
    } else if (file.content_type.startsWith("audio/")) {
      return (
        <audio
          src={file.url}
          controls
          className="w-full"
        >
          Your browser does not support the audio tag.
        </audio>
      );
    }
    return null;
  };

  return (
    <Dialog open onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-7xl w-full">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className="hover:bg-background/80"
            >
              <Star
                className={file.is_favorite ? "fill-yellow-400" : ""}
                size={20}
              />
            </Button>
          )}
          {onShare && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              className="hover:bg-background/80"
            >
              <Share2 size={20} />
            </Button>
          )}
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              className="hover:bg-background/80"
            >
              <Download size={20} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClose?.()}
            className="hover:bg-background/80"
          >
            <X size={20} />
          </Button>
        </div>
        <div className="flex items-center justify-center p-4 mt-8">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreview;
