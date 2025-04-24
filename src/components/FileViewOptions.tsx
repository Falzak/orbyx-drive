
import React from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, Home } from "lucide-react";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FileViewOptionsProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  totalFiles: number;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function FileViewOptions({
  view,
  onViewChange,
  sortBy,
  onSortChange,
  totalFiles,
  currentPath,
  onNavigate,
}: FileViewOptionsProps) {
  const { t } = useTranslation();
  const pathSegments = currentPath.split("/").filter(Boolean);

  return (
    <div className="flex flex-col space-y-2 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => onNavigate("")}>
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathSegments.map((segment, index) => (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === pathSegments.length - 1 ? (
                      <BreadcrumbPage>{segment}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() =>
                          onNavigate(pathSegments.slice(0, index + 1).join("/"))
                        }
                      >
                        {segment}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="text-lg font-semibold">
            {t("fileExplorer.allFiles")} ({totalFiles})
          </h2>
          <Separator orientation="vertical" className="h-6" />
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={t("fileExplorer.sortBy.placeholder")} />
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
        <div className="flex items-center gap-2">
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
  );
}
