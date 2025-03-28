import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileData } from "@/types";
import { downloadFile } from "@/utils/storage";
import { Download, Share2, X, FileText } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

export interface PDFViewerProps {
  file: FileData;
  onClose?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onClose,
  onDownload,
  onShare,
}) => {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const loadPDF = async () => {
    setIsLoading(true);

    try {
      // Mostrar progresso para melhor UX
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Fazer download do arquivo e criar uma URL Blob
      const blob = await downloadFile(file.file_path!);
      // Garantir que o tipo MIME correto seja definido
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      setDocumentUrl(url);

      // Limpar intervalo e definir 100%
      clearInterval(interval);
      setLoadingProgress(100);

      // Função de limpeza para revogar a URL do objeto quando terminar
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error("Erro ao carregar PDF:", error);
      toast({
        title: "Erro ao carregar PDF",
        description: "Não foi possível carregar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (file.url) {
      // Se já temos uma URL, use-a diretamente
      setDocumentUrl(file.url);
    } else if (file.file_path) {
      // Caso contrário, carregue o PDF
      loadPDF();
    }
  }, [file]);

  const handlePdfLoadError = () => {
    console.error("PDF falhou ao carregar no visualizador");
    toast({
      title: "Erro na visualização do PDF",
      description:
        "Não foi possível visualizar o PDF. Tente baixá-lo para visualizar.",
      variant: "destructive",
    });
  };

  const renderPDFContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] w-full">
          <FileText size={64} className="text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground mb-2">
            Carregando PDF...
          </p>
          <div className="w-64">
            <Progress value={loadingProgress} className="h-2" />
          </div>
        </div>
      );
    }

    return documentUrl ? (
      <div className="w-full h-[80vh] flex flex-col">
        <object
          data={documentUrl}
          type="application/pdf"
          className="w-full h-full"
          onError={handlePdfLoadError}
        >
          <embed
            src={documentUrl}
            type="application/pdf"
            className="w-full h-full"
          />
          <div className="flex flex-col items-center justify-center h-full p-8">
            <FileText size={64} className="text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              Seu navegador não suporta a visualização de PDF.
            </p>
            <Button onClick={onDownload} className="gap-2">
              <Download size={16} />
              Baixar PDF
            </Button>
          </div>
        </object>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <FileText size={64} className="text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground">
          Visualização não disponível
        </p>
        <Button onClick={loadPDF} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-7xl w-full bg-transparent border-none p-0">
        <VisuallyHidden>
          <DialogTitle>Visualização de PDF: {file.filename}</DialogTitle>
          <DialogDescription>
            Visualizador de PDF para {file.filename}
          </DialogDescription>
        </VisuallyHidden>

        <div className="absolute right-4 top-4 flex items-center gap-2 z-50 bg-background/30 backdrop-blur-md rounded-lg p-2">
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

        <div className="flex items-center justify-center h-full">
          {renderPDFContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
