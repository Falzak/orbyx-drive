import { FileData } from "@/types";
import { LucideIcon } from "lucide-react";

export type MenuActionType = 
  | 'preview' 
  | 'download' 
  | 'share' 
  | 'favorite' 
  | 'unfavorite'
  | 'rename'
  | 'editFolder'
  | 'moveToTrash'
  | 'restore'
  | 'delete';

export type MenuActionCategory = 
  | 'primary'
  | 'secondary'
  | 'destructive';

export interface MenuAction {
  id: MenuActionType;
  label: string;
  icon: LucideIcon;
  category: MenuActionCategory;
  shortcut?: string;
  condition?: (file: FileData, context: MenuContext) => boolean;
  action: (file: FileData, context: MenuContext) => void;
  className?: string;
}

export interface MenuContext {
  isTrashView: boolean;
  isFavoritesView: boolean;
  handlers: {
    onPreview: (file: FileData) => void;
    onDownload: (file: FileData) => void;
    onShare: (file: FileData) => void;
    onDelete: (file: FileData) => void;
    onRestore?: (file: FileData) => void;
    onRename: (file: FileData, newName: string) => Promise<void>;
    onToggleFavorite: (file: FileData) => void;
    onEditFolder?: (folder: FileData) => void;
  };
  openRenameDialog: () => void;
}

export interface MenuSection {
  id: string;
  actions: MenuAction[];
}
