
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Schema definition moved inside the component to use the 't' function
type FolderFormValues = z.infer<ReturnType<typeof createFolderSchema>>;

const createFolderSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, { message: t("createFolderDialog.validation.nameRequired") }),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (values: FolderFormValues) => Promise<void> | void;
  onCreateFolder?: (values: FolderFormValues) => Promise<void>;
  mode?: "create" | "edit";
  editFolder?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  } | null;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  onCreateFolder,
  mode = "create",
  editFolder = null,
}: CreateFolderDialogProps) {

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("emoji");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memoizedFolderSchema = React.useMemo(() => createFolderSchema(t), [t]);

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(memoizedFolderSchema),
    defaultValues: {
      name: editFolder?.name || "",
      icon: editFolder?.icon || "📁",
      color: editFolder?.color || "#94a3b8",
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        name: editFolder?.name || "",
        icon: editFolder?.icon || "📁",
        color: editFolder?.color || "#94a3b8",
      });
    }
  }, [open, editFolder, form]);

  const handleSubmit = async (values: FolderFormValues) => {
    try {
      setIsSubmitting(true);
      if (onSubmit) {
        await onSubmit(values);
      } else if (onCreateFolder) {
        await onCreateFolder(values);
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(`Error during folder ${mode === "create" ? "creation" : "update"}:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expanded icon set
  const ICONS = [
    "📁", "📂", "📝", "🔒", "🔍", "🏠", "⭐", "📊", "📷",
    "📚", "🎵", "🎬", "💼", "💾", "📱", "💻", "🖥️", "🗂️",
    "📰", "📋", "📌", "🔖", "📎", "✏️", "🖌️", "🎨", "🎮"
  ];

  // Enhanced color palette with names
  const COLORS = React.useMemo(() => [
    { value: "#94a3b8", name: t("colors.gray") },
    { value: "#3b82f6", name: t("colors.blue") },
    { value: "#10b981", name: t("colors.green") },
    { value: "#f97316", name: t("colors.orange") },
    { value: "#8b5cf6", name: t("colors.purple") },
    { value: "#ec4899", name: t("colors.pink") },
    { value: "#f43f5e", name: t("colors.red") },
    { value: "#eab308", name: t("colors.yellow") },
    { value: "#14b8a6", name: t("colors.teal") },
    { value: "#6366f1", name: t("colors.indigo") },
    { value: "#84cc16", name: t("colors.lightGreen") },
    { value: "#d946ef", name: t("colors.magenta") },
  ], [t]);

  // Get current values for preview
  const currentIcon = form.watch("icon") || "📁";
  const currentColor = form.watch("color") || "#94a3b8";
  const currentName = form.watch("name") || t("createFolderDialog.defaultFolderName");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("createFolderDialog.titleCreate") : t("createFolderDialog.titleEdit")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("createFolderDialog.descriptionCreate")
              : t("createFolderDialog.descriptionEdit")}
          </DialogDescription>
        </DialogHeader>

        {/* Folder Preview */}
        <div className="flex flex-col items-center mb-6 p-4 rounded-lg bg-muted/50 border border-border/50">
          <motion.div
            className="relative text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-28 h-28 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300"
              style={{ backgroundColor: currentColor }}
            >
              <span className="text-5xl">{currentIcon}</span>
            </div>
            <div className="mt-3 text-md font-semibold text-foreground max-w-[150px] truncate">
              {currentName}
            </div>
          </motion.div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">{t("createFolderDialog.folderNameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("createFolderDialog.folderNamePlaceholder")}
                      {...field}
                      autoFocus
                      className="transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="emoji" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="emoji">{t("createFolderDialog.tabs.emojis")}</TabsTrigger>
                <TabsTrigger value="color">{t("createFolderDialog.tabs.colors")}</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="emoji" className="mt-0">
                    <div className="space-y-2">
                      <Label>{t("createFolderDialog.iconLabel")}</Label>
                      <div className="grid grid-cols-7 gap-2 max-h-[150px] overflow-y-auto p-2 rounded-md border border-border/70 bg-background">
                        {ICONS.map((icon) => (
                          <Button
                            key={icon}
                            type="button"
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-11 w-11 text-lg transition-all duration-200 focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
                              form.watch("icon") === icon
                                ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                                : "hover:bg-muted/80 hover:scale-105"
                            )}
                            onClick={() => form.setValue("icon", icon)}
                          >
                            {icon}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="color" className="mt-0">
                    <div className="space-y-2">
                      <Label>{t("createFolderDialog.colorLabel")}</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[180px] overflow-y-auto p-2 rounded-md border border-border/70 bg-background">
                        {COLORS.map((color) => (
                          <div key={color.value} className="flex flex-col items-center">
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "h-12 w-full rounded-md relative group transition-all duration-200 focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
                                form.watch("color") === color.value
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-lg"
                                  : "hover:scale-105"
                              )}
                              style={{ backgroundColor: color.value }}
                              onClick={() => form.setValue("color", color.value)}
                            >
                              {form.watch("color") === color.value && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isLightColor(color.value) ? "black" : "white"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6L9 17l-5-5"/></svg>
                                </span>
                              )}
                            </Button>
                            <span className="mt-1.5 text-xs text-muted-foreground">{color.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="relative"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("common.processing")}
                  </span>
                ) : (
                  mode === "create" ? t("createFolderDialog.createButton") : t("createFolderDialog.saveButton")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to determine if a color is light or dark for checkmark contrast
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; // Threshold can be adjusted
}
