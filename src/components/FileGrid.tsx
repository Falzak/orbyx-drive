import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Star, Trash2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FileData, FolderData } from "@/types";
import { MediaPreview } from "./MediaPreview";
import { FileIcon } from "./FileIcon";
import { ContextMenuButton } from "./context-menu/context-menu-button";

export interface FileGridProps {
  files: FileData[];
  onDeleteFile: (file: FileData) => Promise<void>;
  onRenameFile: (file: FileData, newName: string) => Promise<void>;
  onToggleFavorite: (file: FileData) => Promise<void>;
  onFileClick: (file: FileData) => void;
  onFolderClick?: (folder: FolderData) => void;
  onAddToFolder?: (files: FileData[], folderId: string | null) => void;
  folders?: FolderData[];
  currentFolder?: FolderData | null;
  showContextMenuButton?: boolean;
}

const FileGrid: React.FC<FileGridProps> = ({
  files,
  onDeleteFile,
  onRenameFile,
  onToggleFavorite,
  onFileClick,
  onFolderClick,
  onAddToFolder,
  folders,
  currentFolder,
  showContextMenuButton = true,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showRenameDialog, setShowRenameDialog] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<FileData | null>(null);
  const [fileToRename, setFileToRename] = React.useState<FileData | null>(null);
  const [newFileName, setNewFileName] = React.useState("");

  const handleDeleteClick = (file: FileData) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  const handleRenameClick = (file: FileData) => {
    setFileToRename(file);
    setNewFileName(file.name);
    setShowRenameDialog(true);
  };

  const confirmDeleteFile = async () => {
    if (fileToDelete) {
      await onDeleteFile(fileToDelete);
      setShowDeleteDialog(false);
      setFileToDelete(null);
    }
  };

  const handleRenameFile = async (file: FileData, newName: string) => {
    await onRenameFile(file, newName);
    setShowRenameDialog(false);
    setFileToRename(null);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file) => (
        <Card
          key={file.id}
          className="border-primary/10 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium truncate">
              <button
                onClick={() => onFileClick(file)}
                className="w-full text-left"
              >
                {file.name}
              </button>
            </CardTitle>
            {showContextMenuButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-7 w-7 rounded-full p-0 data-[state=open]:bg-secondary"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onToggleFavorite(file)}>
                    <Star className="mr-2 h-4 w-4" />
                    <span>{t("file.favorite")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRenameClick(file)}>
                    <span>{t("file.rename")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeleteClick(file)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{t("file.delete")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!showContextMenuButton && (
              <ContextMenuButton
                file={file}
                onDeleteFile={onDeleteFile}
                onRenameFile={onRenameFile}
                onToggleFavorite={onToggleFavorite}
              />
            )}
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <MediaPreview file={file} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground justify-between items-center p-2 bg-muted/50">
            <span>
              {t("file.lastModified")}{" "}
              {formatDistanceToNow(new Date(file.updated_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {file.is_favorite && (
              <Badge variant="secondary">{t("file.favorite")}</Badge>
            )}
          </CardFooter>
        </Card>
      ))}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("file.deleteConfirmationTitle")}</DialogTitle>
            <DialogDescription>
              {t("file.deleteConfirmationDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFile}>
              {t("file.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("file.renameFile")}</DialogTitle>
            <DialogDescription>
              {t("file.enterNewName")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t("file.name")}
              </Label>
              <Input
                id="name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowRenameDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => fileToRename && handleRenameFile(fileToRename, newFileName)}>
              {t("file.rename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileGrid;
