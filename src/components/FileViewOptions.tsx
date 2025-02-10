import React from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FileViewOptionsProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  totalFiles: number;
}

export function FileViewOptions({
  view,
  onViewChange,
  sortBy,
  onSortChange,
  totalFiles,
}: FileViewOptionsProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-10 bg-background/20 dark:bg-black/20 backdrop-blur-xl border-b border-border">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {t("fileExplorer.allFiles")} ({totalFiles})
            </h2>
            <Separator orientation="vertical" className="h-6" />
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue
                  placeholder={t("fileExplorer.sortBy.placeholder")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">
                  {t("fileExplorer.sortBy.nameAsc")}
                </SelectItem>
                <SelectItem value="name_desc">
                  {t("fileExplorer.sortBy.nameDesc")}
                </SelectItem>
                <SelectItem value="date_asc">
                  {t("fileExplorer.sortBy.dateAsc")}
                </SelectItem>
                <SelectItem value="date_desc">
                  {t("fileExplorer.sortBy.dateDesc")}
                </SelectItem>
                <SelectItem value="size_asc">
                  {t("fileExplorer.sortBy.sizeAsc")}
                </SelectItem>
                <SelectItem value="size_desc">
                  {t("fileExplorer.sortBy.sizeDesc")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                view === "grid" && "bg-background shadow-sm"
              )}
              onClick={() => onViewChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                view === "list" && "bg-background shadow-sm"
              )}
              onClick={() => onViewChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
