import { FileData } from "@/types";
import {
  Download,
  Share2,
  Star,
  Trash2,
  Edit,
  FileIcon,
  RotateCcw,
  ExternalLink,
  Copy,
  Pencil,
  FolderEdit
} from "lucide-react";
import { MenuAction, MenuContext } from "./types";

// Função auxiliar para verificar se um arquivo é visualizável
const isPreviewableFile = (contentType: string): boolean => {
  return (
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/") ||
    contentType === "text/plain" ||
    contentType === "application/pdf"
  );
};

// Definição das ações do menu
export const getMenuActions = (): MenuAction[] => [
  // Ações primárias
  {
    id: 'preview',
    label: 'fileExplorer.contextMenu.open',
    icon: FileIcon,
    category: 'primary',
    condition: (file, _) => !file.is_folder && isPreviewableFile(file.content_type),
    action: (file, context) => context.handlers.onPreview(file),
  },
  {
    id: 'download',
    label: 'fileExplorer.contextMenu.download',
    icon: Download,
    category: 'primary',
    condition: (file, _) => !file.is_folder,
    action: (file, context) => context.handlers.onDownload(file),
  },
  {
    id: 'share',
    label: 'fileExplorer.contextMenu.share',
    icon: Share2,
    category: 'primary',
    action: (file, context) => context.handlers.onShare(file),
  },

  // Ações secundárias
  {
    id: 'favorite',
    label: 'fileExplorer.contextMenu.favorite',
    icon: Star,
    category: 'secondary',
    condition: (file, _) => !file.is_favorite,
    action: (file, context) => context.handlers.onToggleFavorite(file),
  },
  {
    id: 'unfavorite',
    label: 'fileExplorer.contextMenu.unfavorite',
    icon: Star,
    category: 'secondary',
    condition: (file, _) => file.is_favorite,
    action: (file, context) => context.handlers.onToggleFavorite(file),
    className: 'fill-yellow-400',
  },
  {
    id: 'rename',
    label: 'fileExplorer.contextMenu.rename',
    icon: Pencil,
    category: 'secondary',
    condition: (file, _) => !file.is_folder,
    action: (_, context) => context.openRenameDialog(),
  },
  {
    id: 'editFolder',
    label: 'fileExplorer.contextMenu.editFolder',
    icon: FolderEdit,
    category: 'secondary',
    condition: (file, context) => file.is_folder && !!context.handlers.onEditFolder,
    action: (file, context) => context.handlers.onEditFolder?.(file),
  },

  // Ações destrutivas
  {
    id: 'moveToTrash',
    label: 'fileExplorer.contextMenu.moveToTrash',
    icon: Trash2,
    category: 'destructive',
    condition: (_, context) => !context.isTrashView,
    action: (file, context) => context.handlers.onDelete(file),
  },
  {
    id: 'restore',
    label: 'fileExplorer.contextMenu.restore',
    icon: RotateCcw,
    category: 'destructive',
    condition: (_, context) => context.isTrashView && !!context.handlers.onRestore,
    action: (file, context) => context.handlers.onRestore?.(file),
    className: 'text-primary hover:bg-primary/10 hover:text-primary',
  },
  {
    id: 'delete',
    label: 'fileExplorer.contextMenu.deletePermanently',
    icon: Trash2,
    category: 'destructive',
    condition: (_, context) => context.isTrashView,
    action: (file, context) => context.handlers.onDelete(file),
    className: 'text-destructive hover:bg-destructive/10 hover:text-destructive',
  },
];

// Função para filtrar ações com base no arquivo e contexto
export const getFilteredActions = (
  file: FileData,
  context: MenuContext
): MenuAction[] => {
  return getMenuActions().filter(action => {
    if (action.condition) {
      return action.condition(file, context);
    }
    return true;
  });
};

// Função para agrupar ações por categoria
export const getActionsByCategory = (
  actions: MenuAction[]
): Record<string, MenuAction[]> => {
  return actions.reduce((acc, action) => {
    const category = action.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {} as Record<string, MenuAction[]>);
};
