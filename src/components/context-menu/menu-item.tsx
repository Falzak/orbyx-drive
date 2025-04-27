import React from "react";
import { ContextMenuItem, ContextMenuShortcut } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { MenuAction } from "./types";
import { useTranslation } from "react-i18next";

interface MenuItemProps {
  action: MenuAction;
  onClick: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({ action, onClick }) => {
  const { t } = useTranslation();
  const Icon = action.icon;

  return (
    <ContextMenuItem
      onClick={onClick}
      className={cn(
        "group rounded-md flex items-center",
        action.className
      )}
    >
      <Icon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
      <span className="flex-1 group-hover:translate-x-0.5 transition-transform duration-200">
        {t(action.label)}
      </span>
      {action.shortcut && (
        <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>
      )}
    </ContextMenuItem>
  );
};
