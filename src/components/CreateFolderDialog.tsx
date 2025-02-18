"use client";
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const folderIcons = [
  // Documentos e Trabalho
  { value: "📁", label: "Pasta" },
  { value: "📂", label: "Pasta Aberta" },
  { value: "📝", label: "Notas" },
  { value: "📚", label: "Livros" },
  { value: "📊", label: "Gráficos" },
  { value: "📈", label: "Estatísticas" },
  { value: "💼", label: "Trabalho" },
  { value: "📌", label: "Importante" },
  { value: "📎", label: "Anexos" },
  { value: "✏️", label: "Edição" },

  // Mídia
  { value: "🎵", label: "Música" },
  { value: "🎬", label: "Vídeos" },
  { value: "📸", label: "Fotos" },
  { value: "🎮", label: "Jogos" },
  { value: "🎨", label: "Arte" },
  { value: "🎭", label: "Entretenimento" },
  { value: "📺", label: "TV" },
  { value: "🎧", label: "Áudio" },

  // Pessoal
  { value: "❤️", label: "Favoritos" },
  { value: "🏠", label: "Casa" },
  { value: "👤", label: "Pessoal" },
  { value: "👥", label: "Compartilhado" },
  { value: "🌟", label: "Destacado" },
  { value: "⭐", label: "Estrela" },

  // Organização
  { value: "📅", label: "Calendário" },
  { value: "⏰", label: "Tempo" },
  { value: "📍", label: "Local" },
  { value: "🔍", label: "Busca" },
  { value: "🔒", label: "Seguro" },
  { value: "🔑", label: "Chaves" },

  // Outros
  { value: "💡", label: "Ideias" },
  { value: "🎯", label: "Metas" },
  { value: "✨", label: "Especial" },
  { value: "🌈", label: "Colorido" },
  { value: "🎁", label: "Presentes" },
  { value: "🛠️", label: "Ferramentas" },
];

const folderColors = [
  { value: "#94a3b8", label: "Cinza" },
  { value: "#60a5fa", label: "Azul" },
  { value: "#34d399", label: "Verde" },
  { value: "#fbbf24", label: "Amarelo" },
  { value: "#f87171", label: "Vermelho" },
  { value: "#c084fc", label: "Roxo" },
  { value: "#f472b6", label: "Rosa" },
  { value: "#2dd4bf", label: "Turquesa" },
  { value: "#fb923c", label: "Laranja" },
  { value: "#4ade80", label: "Verde Claro" },
  { value: "#818cf8", label: "Índigo" },
  { value: "#e879f9", label: "Magenta" },
];

const formSchema = z.object({
  name: z.string().min(1, "O nome da pasta é obrigatório"),
  icon: z.string().default("📁"),
  color: z.string().default("#94a3b8"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  loading?: boolean;
  editFolder?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  } | null;
  mode?: "create" | "edit";
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  editFolder = null,
  mode = "create",
}: CreateFolderDialogProps) {
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      icon: "📁",
      color: "#94a3b8",
    },
  });

  useEffect(() => {
    if (mode === "edit" && editFolder) {
      form.reset({
        name: editFolder.name,
        icon: editFolder.icon || "📁",
        color: editFolder.color || "#94a3b8",
      });
    } else {
      form.reset({
        name: "",
        icon: "📁",
        color: "#94a3b8",
      });
    }
  }, [editFolder, mode, form]);

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("fileExplorer.createFolder.title")
              : t("fileExplorer.editFolder.title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("fileExplorer.createFolder.description")
              : t("fileExplorer.editFolder.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fileExplorer.createFolder.name")}</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder={t(
                        "fileExplorer.createFolder.namePlaceholder"
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="emoji" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="emoji" className="flex-1">
                  Emojis
                </TabsTrigger>
                <TabsTrigger value="color" className="flex-1">
                  Cores
                </TabsTrigger>
              </TabsList>

              <TabsContent value="emoji" className="mt-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone</FormLabel>
                      <ScrollArea className="h-[200px] rounded-md border p-4">
                        <div className="grid grid-cols-8 gap-2">
                          {folderIcons.map((icon) => (
                            <Button
                              key={icon.value}
                              type="button"
                              variant={
                                field.value === icon.value
                                  ? "default"
                                  : "outline"
                              }
                              className="h-10 w-10"
                              onClick={() => field.onChange(icon.value)}
                              title={icon.label}
                            >
                              <span className="text-lg">{icon.value}</span>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="color" className="mt-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <div className="grid grid-cols-6 gap-2">
                        {folderColors.map((color) => (
                          <Button
                            key={color.value}
                            type="button"
                            variant={
                              field.value === color.value
                                ? "default"
                                : "outline"
                            }
                            className="h-10 relative"
                            onClick={() => field.onChange(color.value)}
                            title={color.label}
                          >
                            <div
                              className="w-full h-full rounded absolute inset-0 opacity-50"
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="relative text-xs">
                              {color.label}
                            </span>
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? t("common.loading")
                  : mode === "create"
                  ? t("common.create")
                  : t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
