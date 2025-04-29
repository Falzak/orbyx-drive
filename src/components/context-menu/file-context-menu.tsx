import React, { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FileData } from "@/types";
import { MenuContext } from "./types";
import { getFilteredActions, getActionsByCategory } from "./menu-actions";
import { MenuItem } from "./menu-item";
import { MenuHeader } from "./menu-header";
import { RenameFileDialog } from "@/components/RenameFileDialog";

interface FileContextMenuProps {
  file: FileData;
  children: React.ReactNode;
  onPreview: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onRestore?: (file: FileData) => void;
  onRename: (file: FileData, newName: string) => Promise<void>;
  onToggleFavorite: (file: FileData) => void;
  onEditFolder?: (folder: FileData) => void;
  isTrashView?: boolean;
  isFavoritesView?: boolean;
}

export const FileContextMenu = React.forwardRef<
  HTMLDivElement,
  FileContextMenuProps
>(
  (
    {
      file,
      children,
      onPreview,
      onDownload,
      onShare,
      onDelete,
      onRestore,
      onRename,
      onToggleFavorite,
      onEditFolder,
      isTrashView = false,
      isFavoritesView = false,
    },
    ref
  ) => {
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

    // Criar o contexto do menu
    const menuContext: MenuContext = {
      isTrashView,
      isFavoritesView,
      handlers: {
        onPreview,
        onDownload,
        onShare,
        onDelete,
        onRestore,
        onRename,
        onToggleFavorite,
        onEditFolder,
      },
      openRenameDialog: () => setIsRenameDialogOpen(true),
    };

    // Obter ações filtradas e agrupadas
    const filteredActions = getFilteredActions(file, menuContext);
    const actionsByCategory = getActionsByCategory(filteredActions);

    // Verificar se há ações em cada categoria
    const hasActions = {
      primary: !!actionsByCategory.primary?.length,
      secondary: !!actionsByCategory.secondary?.length,
      destructive: !!actionsByCategory.destructive?.length,
    };

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent
          className="w-80 divide-y divide-border/30 overflow-visible"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
            {/* Cabeçalho com informações do arquivo */}
            <MenuHeader file={file} />

            {/* Ações primárias */}
            {hasActions.primary && (
              <div className="p-1.5">
                {actionsByCategory.primary.map((action) => (
                  <MenuItem
                    key={action.id}
                    action={action}
                    onClick={() => action.action(file, menuContext)}
                  />
                ))}
              </div>
            )}

            {/* Ações secundárias */}
            {hasActions.secondary && (
              <div className="p-1.5">
                {actionsByCategory.secondary.map((action) => (
                  <MenuItem
                    key={action.id}
                    action={action}
                    onClick={() => action.action(file, menuContext)}
                  />
                ))}
              </div>
            )}

            {/* Ações destrutivas */}
            {hasActions.destructive && (
              <div className="p-1.5">
                {actionsByCategory.destructive.map((action) => (
                  <MenuItem
                    key={action.id}
                    action={action}
                    onClick={() => action.action(file, menuContext)}
                  />
                ))}
              </div>
            )}
          </ContextMenuContent>

          {/* Diálogo de renomeação */}
          <RenameFileDialog
            file={file}
            open={isRenameDialogOpen}
            onOpenChange={setIsRenameDialogOpen}
            onRename={onRename}
          />
        </ContextMenu>
    );
  }
);

FileContextMenu.displayName = "FileContextMenu";
