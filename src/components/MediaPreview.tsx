
import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileData } from "@/types";
import { downloadFile } from "@/utils/storage";
import { 
  Download, Share2, Star, X, ZoomIn, ZoomOut, 
  RotateCw, File, FileText, Lock, Unlock, Archive, FileLock
} from "lucide-react";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [canPreview, setCanPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Check if this is a previewable document
    const isPdf = file.content_type === 'application/pdf';
    const isOffice = file.content_type.includes('officedocument') || 
                    file.content_type === 'application/msword';
    
    setCanPreview(isPdf || isOffice);

    if (isPdf && file.url) {
      // For PDFs, we can directly use the URL
      setDocumentUrl(file.url);
    }
    
    // For other document types, we load the document in progress steps
    // to show a loading indicator to the user
    if (isOffice && !documentUrl) {
      loadDocument();
    }
  }, [file]);
  
  const loadDocument = async () => {
    setIsLoading(true);
    
    try {
      // Simulated loading progress for UX
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      
      // Download the file and create a blob URL
      const blob = await downloadFile(file.file_path!);
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
      
      // Clear interval and set to 100%
      clearInterval(interval);
      setLoadingProgress(100);
      
      // Cleanup function to revoke the object URL when done
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error("Error loading document:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    } else if (file.content_type === "application/pdf") {
      return documentUrl ? (
        <iframe
          ref={iframeRef}
          src={`${documentUrl}#view=FitH`}
          className="w-full h-[80vh]"
          title={`PDF Preview: ${file.filename}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <FileText size={64} className="text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">
            Visualização não disponível
          </p>
        </div>
      );
    } else if (file.content_type.includes('officedocument') || file.content_type === 'application/msword') {
      if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-[80vh] w-full">
            <FileText size={64} className="text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-2">
              Carregando documento...
            </p>
            <div className="w-64">
              <Progress value={loadingProgress} className="h-2" />
            </div>
          </div>
        );
      }
      
      return documentUrl ? (
        <div className="h-[80vh] w-full bg-muted/20 rounded-md">
          <Tabs defaultValue="preview" className="w-full h-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="preview">Visualização</TabsTrigger>
              <TabsTrigger value="download">Baixar</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="w-full h-[calc(80vh-40px)]">
              <iframe
                ref={iframeRef}
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`}
                className="w-full h-full"
                title={`Document Preview: ${file.filename}`}
              />
            </TabsContent>
            <TabsContent value="download" className="flex items-center justify-center h-[calc(80vh-40px)]">
              <div className="flex flex-col items-center p-8">
                <FileText size={64} className="text-primary mb-4" />
                <h3 className="text-xl font-medium mb-2">{file.filename}</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Este documento pode ser baixado para visualização completa.
                </p>
                <Button onClick={onDownload} className="gap-2">
                  <Download size={16} />
                  Baixar documento
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <FileText size={64} className="text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">
            Visualização não disponível
          </p>
          <Button onClick={loadDocument} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <File size={64} className="text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">
            Visualização não disponível para este tipo de arquivo
          </p>
        </div>
      );
    }
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
