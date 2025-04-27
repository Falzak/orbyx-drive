import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileData, FolderData } from "@/types";
import { cn } from "@/lib/utils";

export interface FileListProps {
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

const FileList: React.FC<FileListProps> = ({
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
  const [fileToDelete, setFileToDelete] = React.useState<FileData | null>(
    null
  );
  const [showRenameDialog, setShowRenameDialog] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState<FileData | null>(
    null
  );
  const [newFileName, setNewFileName] = React.useState("");

  const handleDeleteFile = async () => {
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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fileList.name")}</TableHead>
            <TableHead>{t("fileList.lastModified")}</TableHead>
            <TableHead className="text-right">{t("fileList.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                <Button variant="ghost" onClick={() => onFileClick(file)}>
                  {file.name}
                </Button>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(file.updated_at), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-right">
                {showContextMenuButton && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onToggleFavorite(file)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {t("fileList.toggleFavorite")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setFileToRename(file);
                          setNewFileName(file.name);
                          setShowRenameDialog(true);
                        }}
                      >
                        {t("fileList.rename")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setFileToDelete(file);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("fileList.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("fileList.deleteConfirmation")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("fileList.deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFile} className="bg-red-500 text-red-50">
              {t("fileList.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("fileList.renameFile")}</DialogTitle>
            <DialogDescription>
              {t("fileList.enterNewName")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowRenameDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (fileToRename) {
                  handleRenameFile(fileToRename, newFileName);
                }
              }}
            >
              {t("fileList.rename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileList;
