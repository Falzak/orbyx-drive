import React, { useState, useEffect, useRef } from "react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Download,
  Share2,
  Star,
  ZoomIn,
  ZoomOut,
  RotateCw,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const mediaControlsClass = "group relative w-full max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl overflow-hidden";
const controlsOverlayClass = "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 via-transparent to-black/50 pointer-events-none";

interface MediaPreviewProps {
  file: {
    id: string;
    filename: string;
    content_type: string;
    url?: string;
    is_favorite?: boolean;
  };
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
}

export default function MediaPreview({
  file,
  onClose,
  onDownload,
  onShare,
  onToggleFavorite,
}: MediaPreviewProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [audioIsMuted, setAudioIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => prev + 90);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const toggleAudioPlay = () => {
    if (audioRef.current) {
      if (audioIsPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioIsPlaying(!audioIsPlaying);
    }
  };

  const toggleAudioMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioIsMuted;
      setAudioIsMuted(!audioIsMuted);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleVideoSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const handleAudioSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      audioRef.current.currentTime = percentage * audioRef.current.duration;
    }
  };

  // Reset states when file changes
  useEffect(() => {
    if (file.url) {
      setIsLoading(true);
      setLoadError(false);
      setScale(1);
      setRotation(0);
    }
  }, [file.url]);

  return (
    <AlertDialog open={true} onOpenChange={() => onClose()}>
      <AlertDialogContent className="max-w-none w-screen h-screen p-0 gap-0 bg-transparent border-none shadow-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Barra de ferramentas */}
            <div className="fixed top-6 inset-x-0 z-30 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-background/90 dark:bg-black/90 backdrop-blur-xl shadow-lg border border-border/50">
              {file.content_type?.startsWith("image/") && !loadError && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    className="hover:bg-accent hover:text-accent-foreground active:bg-accent/80 rounded-full text-foreground/80 transition-all"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    className="hover:bg-accent hover:text-accent-foreground active:bg-accent/80 rounded-full text-foreground/80 transition-all"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRotate}
                    className="hover:bg-accent hover:text-accent-foreground active:bg-accent/80 rounded-full text-foreground/80 transition-all"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-4 bg-border/50" />
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-accent hover:text-accent-foreground active:bg-accent/80 rounded-full text-foreground/80 transition-all"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="bg-background/80 dark:bg-black/80 backdrop-blur-xl shadow-lg rounded-lg"
                >
                  {onDownload && (
                    <DropdownMenuItem
                      onClick={onDownload}
                      className="text-foreground/80 hover:bg-accent hover:text-accent-foreground !cursor-pointer transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem
                      onClick={onShare}
                      className="text-foreground/80 hover:bg-accent hover:text-accent-foreground !cursor-pointer transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                  )}
                  {onToggleFavorite && (
                    <>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem
                        onClick={onToggleFavorite}
                        className="text-foreground/80 hover:bg-accent hover:text-accent-foreground !cursor-pointer transition-colors"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4 mr-2",
                            file.is_favorite && "fill-yellow-400"
                          )}
                        />
                        {file.is_favorite
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-px h-4 bg-border/50" />

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-accent hover:text-accent-foreground active:bg-accent/80 rounded-full text-foreground/80 transition-all"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Nome do arquivo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 inset-x-0 z-30 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-300"
            >
            <div className="px-4 py-2.5 rounded-full bg-background/90 dark:bg-black/90 backdrop-blur-xl text-sm font-medium text-foreground/90 shadow-lg border border-border/50">
              <span className="drop-shadow-sm">{file.filename}</span>
            </div>
          </motion.div>

          {/* Área de conteúdo */}
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-8 h-8 border-2 border-border/50 border-t-foreground rounded-full animate-spin" />
              </motion.div>
            )}

            {loadError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-4 p-8 rounded-lg bg-background/80 dark:bg-black/80 backdrop-blur-xl shadow-lg"
              >
                <FileIcon className="w-12 h-12 text-foreground/80" />
                <p className="text-foreground/80 text-sm">
                  Erro ao carregar o arquivo
                </p>
              </motion.div>
            ) : file.content_type?.startsWith("image/") && file.url ? (
              <motion.div
                key="image-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease-out",
                }}
              >
                <motion.img
                  key={`image-${file.id}`}
                  src={file.url}
                  alt={file.filename}
                  className={cn(
                    "max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg select-none shadow-2xl",
                    isLoading && "opacity-0"
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isLoading ? 0 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onLoad={() => {
                    setIsLoading(false);
                    setLoadError(false);
                  }}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                  }}
                  draggable={false}
                />
              </motion.div>
            ) : file.content_type?.startsWith("video/") && file.url ? (
                <motion.div
                  key="video"
                  className={mediaControlsClass}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <video
                  ref={videoRef}
                  src={file.url}
                  className="w-full h-full object-contain"
                  onLoadedData={() => setIsLoading(false)}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                  }}
                  />
                  <div className={controlsOverlayClass} />
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex flex-col gap-2">
                    <div 
                      className="w-full bg-white/20 rounded-full h-1 overflow-hidden cursor-pointer"
                      onClick={handleVideoSeek}
                    >
                    <div 
                      className="bg-primary h-full transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                    </div>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlay}
                      className="h-8 w-8 rounded-full hover:bg-white/20"
                      >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                      </Button>
                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="h-8 w-8 rounded-full hover:bg-white/20"
                      >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4 text-white" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-white" />
                      )}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="h-8 w-8 rounded-full hover:bg-white/20"
                    >
                      {isFullscreen ? (
                      <Minimize className="h-4 w-4 text-white" />
                      ) : (
                      <Maximize className="h-4 w-4 text-white" />
                      )}
                    </Button>
                    </div>
                  </div>
                  </div>
                </motion.div>
            ) : file.content_type?.startsWith("audio/") && file.url ? (
                <motion.div
                  key="audio"
                    className="w-full max-w-md p-8 rounded-lg bg-background/80 dark:bg-black/80 backdrop-blur-xl shadow-2xl group opacity-70 hover:opacity-100 transition-opacity duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                  <Music className="w-16 h-16 mx-auto mb-4 text-foreground/80" />
                  <audio
                    ref={audioRef}
                    src={file.url}
                    className="hidden"
                    onLoadedData={() => setIsLoading(false)}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onPlay={() => setAudioIsPlaying(true)}
                    onPause={() => setAudioIsPlaying(false)}
                    onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-foreground/20 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-150"
                      style={{ width: `${audioProgress}%` }}
                    />
                    </div>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleAudioPlay}
                      className="h-8 w-8 rounded-full hover:bg-foreground/20"
                      >
                      {audioIsPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      </Button>
                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleAudioMute}
                      className="h-8 w-8 rounded-full hover:bg-foreground/20"
                      >
                      {audioIsMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                      </Button>
                    </div>
                    </div>
                  </div>
                  </div>
                </motion.div>
            ) : (
              <motion.div
                key="file"
                className="text-center p-8 rounded-lg bg-background/80 dark:bg-black/80 backdrop-blur-xl shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <FileIcon className="w-16 h-16 mx-auto mb-4 text-foreground/80" />
                <p className="text-lg font-medium text-foreground/80">
                  {file.filename}
                </p>
                <p className="text-sm text-foreground/60">
                  Este tipo de arquivo não pode ser visualizado
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FileIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function Music(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
