
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileData } from "@/types";
import { Download, Share2, Star, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

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
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const renderPreview = () => {
    if (file.content_type.startsWith("image/")) {
      return (
        <img
          src={file.url}
          alt={file.filename}
          className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
          style={{ 
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
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
      <DialogContent className="max-w-7xl w-full bg-transparent border-none p-0">
        <div className="absolute right-4 top-4 flex items-center gap-2 z-50 bg-background/30 backdrop-blur-md rounded-lg p-2">
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className="hover:bg-background/20"
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
              className="hover:bg-background/20"
            >
              <Share2 size={20} />
            </Button>
          )}
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              className="hover:bg-background/20"
            >
              <Download size={20} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClose?.()}
            className="hover:bg-background/20"
          >
            <X size={20} />
          </Button>
        </div>

        {file.content_type.startsWith("image/") && (
          <div className="absolute left-4 top-4 flex items-center gap-2 z-50 bg-background/30 backdrop-blur-md rounded-lg p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="hover:bg-background/20"
            >
              <ZoomIn size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="hover:bg-background/20"
            >
              <ZoomOut size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="hover:bg-background/20"
            >
              <RotateCw size={20} />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center h-full">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreview;
