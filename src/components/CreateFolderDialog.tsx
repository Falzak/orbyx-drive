
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";

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

const folderSchema = z.object({
  name: z.string().min(1, { message: "Nome da pasta é obrigatório" }),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type FolderFormValues = z.infer<typeof folderSchema>;

export interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (values: FolderFormValues) => void;
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

  const [activeTab, setActiveTab] = useState<string>("emoji");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
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
        onSubmit(values);
      } else if (onCreateFolder) {
        await onCreateFolder(values);
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating folder:", error);
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
  const COLORS = [
    { value: "#94a3b8", name: "Cinza" },
    { value: "#3b82f6", name: "Azul" },
    { value: "#10b981", name: "Verde" },
    { value: "#f97316", name: "Laranja" },
    { value: "#8b5cf6", name: "Roxo" },
    { value: "#ec4899", name: "Rosa" },
    { value: "#f43f5e", name: "Vermelho" },
    { value: "#eab308", name: "Amarelo" },
    { value: "#14b8a6", name: "Turquesa" },
    { value: "#6366f1", name: "Índigo" },
    { value: "#84cc16", name: "Verde Claro" },
    { value: "#d946ef", name: "Magenta" },
  ];

  // Get current values for preview
  const currentIcon = form.watch("icon") || "📁";
  const currentColor = form.watch("color") || "#94a3b8";
  const currentName = form.watch("name") || "Nova pasta";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nova Pasta" : "Editar Pasta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crie uma nova pasta para organizar seus arquivos"
              : "Edite as informações da pasta"}
          </DialogDescription>
        </DialogHeader>

        {/* Folder Preview */}
        <div className="flex justify-center mb-4">
          <motion.div
            className="relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-24 h-24 rounded-xl flex items-center justify-center shadow-md transition-all duration-300"
              style={{ backgroundColor: currentColor }}
            >
              <span className="text-4xl">{currentIcon}</span>
            </div>
            <div className="mt-2 text-center text-sm font-medium text-foreground/80 max-w-[100px] truncate">
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
                  <FormLabel>Nome da pasta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o nome da pasta"
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
                <TabsTrigger value="emoji">Emojis</TabsTrigger>
                <TabsTrigger value="color">Cores</TabsTrigger>
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
                      <Label>Ícone</Label>
                      <div className="grid grid-cols-6 gap-2 max-h-[180px] overflow-y-auto p-1 rounded-md border border-input/50">
                        {ICONS.map((icon) => (
                          <Button
                            key={icon}
                            type="button"
                            variant={form.watch("icon") === icon ? "default" : "outline"}
                            size="icon"
                            className={cn(
                              "h-10 w-10 transition-all duration-200",
                              form.watch("icon") === icon
                                ? "scale-110 shadow-md"
                                : "hover:scale-105"
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
                      <Label>Cor</Label>
                      <div className="grid grid-cols-4 gap-3 max-h-[180px] overflow-y-auto p-1 rounded-md border border-input/50">
                        {COLORS.map((color) => (
                          <Button
                            key={color.value}
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-14 relative group transition-all duration-200",
                              form.watch("color") === color.value
                                ? "ring-2 ring-primary scale-105"
                                : "hover:scale-105"
                            )}
                            style={{ backgroundColor: color.value }}
                            onClick={() => form.setValue("color", color.value)}
                          >
                            <span className="absolute inset-x-0 bottom-0 bg-black/20 text-white text-xs py-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md">
                              {color.name}
                            </span>
                          </Button>
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
                Cancelar
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
                    Processando...
                  </span>
                ) : (
                  mode === "create" ? "Criar pasta" : "Salvar alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
