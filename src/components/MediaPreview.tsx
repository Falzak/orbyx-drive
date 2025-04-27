import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileData } from "@/types";
import { downloadFile } from "@/utils/storage";
import {
  Download,
  Share2,
  Star,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  File,
  FileText,
  Sun,
  Moon,
  Copy,
} from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [textContent, setTextContent] = useState<string>("");
  const [textTheme, setTextTheme] = useState<"light" | "dark">("light");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const loadDocument = async () => {
    setIsLoading(true);

    try {
      // Simulated loading progress for UX
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
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

      // If it's a text file, read the content
      if (file.content_type === "text/plain") {
        const text = await blob.text();
        setTextContent(text);
      }

      // Clear interval and set to 100%
      clearInterval(interval);
      setLoadingProgress(100);

      // Cleanup function to revoke the object URL when done
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error("Error loading document:", error);
      toast({
        title: "Erro ao carregar documento",
        description: "Não foi possível carregar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if this is a previewable document
    const isOffice =
      file.content_type.includes("officedocument") ||
      file.content_type === "application/msword";

    const isTextFile = file.content_type === "text/plain";

    setCanPreview(isOffice || isTextFile);

    // Validar se temos uma URL de imagem
    if (file.content_type.startsWith("image/") && !file.url) {
      toast({
        title: "Erro de visualização",
        description: "URL da imagem não disponível. Tente recarregar a página.",
        variant: "destructive",
      });
    }

    // For office documents and text files, we load the document in progress steps
    // to show a loading indicator to the user
    if ((isOffice || isTextFile) && !documentUrl) {
      loadDocument();
    }
  }, [file, documentUrl]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const renderPreview = () => {
    if (file.content_type.startsWith("image/")) {
      return file.url ? (
        <img
          src={file.url}
          alt={file.filename}
          className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          onError={(e) => {
            console.error("Image failed to load:", file.url);
            toast({
              title: "Erro ao carregar imagem",
              description:
                "Não foi possível carregar a imagem. Tente recarregar a página.",
              variant: "destructive",
            });
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <File size={64} className="text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">
            Visualização não disponível
          </p>
        </div>
      );
    } else if (file.content_type.startsWith("video/")) {
      return (
        <video src={file.url} controls className="max-w-full max-h-[80vh]">
          Your browser does not support the video tag.
        </video>
      );
    } else if (file.content_type.startsWith("audio/")) {
      return (
        <audio src={file.url} controls className="w-full">
          Your browser does not support the audio tag.
        </audio>
      );
    } else if (
      file.content_type.includes("officedocument") ||
      file.content_type === "application/msword" ||
      file.content_type === "text/plain"
    ) {
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
        <div
          className={cn(
            "h-[80vh] w-full",
            file.content_type === "text/plain"
              ? "bg-background"
              : "bg-muted/20 rounded-md"
          )}
        >
          {file.content_type === "text/plain" ? (
            <div className="w-full h-full bg-background overflow-auto">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-2 bg-muted/30 border-b border-border/50 sticky top-0 z-10 pr-14">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleZoomOut}
                      title="Diminuir zoom"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScale(1)}
                      title="Restaurar zoom"
                    >
                      <span className="text-xs font-medium">
                        {Math.round(scale * 100)}%
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleZoomIn}
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setTextTheme(textTheme === "light" ? "dark" : "light")
                      }
                      title={
                        textTheme === "light" ? "Modo escuro" : "Modo claro"
                      }
                    >
                      {textTheme === "light" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={onDownload}
                      title="Baixar arquivo"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(textContent);
                        toast({
                          title: "Texto copiado",
                          description:
                            "O conteúdo do arquivo foi copiado para a área de transferência.",
                        });
                      }}
                      title="Copiar conteúdo"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 max-w-[40%] overflow-hidden">
                    <Badge
                      variant="outline"
                      className="text-xs font-normal flex-shrink-0"
                    >
                      {file.content_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {file.filename} - {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden relative">
                  <div
                    className={cn(
                      "flex-1 p-4 pt-6 pb-8 font-mono text-sm overflow-auto",
                      textTheme === "dark"
                        ? "bg-zinc-900 text-zinc-100"
                        : "bg-white text-zinc-800"
                    )}
                    style={{ fontSize: `${14 * scale}px` }}
                  >
                    {textContent.split("\n").map((line, index) => (
                      <div key={index} className="flex hover:bg-muted/10">
                        <div
                          className={cn(
                            "select-none text-right pr-4 w-12 flex-shrink-0 tabular-nums",
                            textTheme === "dark"
                              ? "text-zinc-500"
                              : "text-zinc-400"
                          )}
                        >
                          {index + 1}
                        </div>
                        <pre className="whitespace-pre-wrap flex-1">
                          {line || " "}
                        </pre>
                      </div>
                    ))}
                  </div>
                  <div
                    className={cn(
                      "px-4 py-1.5 text-xs border-t flex justify-between items-center sticky bottom-0 z-10",
                      textTheme === "dark"
                        ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                    )}
                  >
                    <div>
                      {textContent.split("\n").length} linhas |{" "}
                      {textContent.trim().split(/\s+/).length} palavras |{" "}
                      {textContent.length} caracteres
                    </div>
                    <div>Codificação: UTF-8</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="preview" className="w-full h-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="preview">Visualização</TabsTrigger>
                <TabsTrigger value="download">Baixar</TabsTrigger>
              </TabsList>
              <TabsContent
                value="preview"
                className="w-full h-[calc(80vh-40px)]"
              >
                <iframe
                  ref={iframeRef}
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                    documentUrl
                  )}`}
                  className="w-full h-full"
                  title={`Document Preview: ${file.filename}`}
                />
              </TabsContent>
              <TabsContent
                value="download"
                className="flex items-center justify-center h-[calc(80vh-40px)]"
              >
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
          )}
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
      <DialogContent
        className={cn(
          "max-w-7xl w-full border-none p-0",
          file.content_type === "text/plain"
            ? "bg-background"
            : "bg-transparent"
        )}
        closeButtonClassName="z-50 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
      >
        <VisuallyHidden>
          <DialogTitle>Visualização: {file.filename}</DialogTitle>
          <DialogDescription>
            Visualizador de arquivos para {file.content_type}
          </DialogDescription>
        </VisuallyHidden>

        {file.content_type === "text/plain" ? (
          <div className="absolute right-4 top-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClose?.()}
              className="bg-background/90 hover:bg-background shadow-sm backdrop-blur-sm rounded-full h-8 w-8 flex items-center justify-center border border-border/50"
            >
              <X size={18} />
            </Button>
          </div>
        ) : (
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
        )}

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
