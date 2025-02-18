
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Folder, FolderOpen, FolderPlus, FolderX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const folderIcons = [
  { value: "📁", label: "Pasta padrão" },
  { value: "📂", label: "Pasta aberta" },
  { value: "📚", label: "Biblioteca" },
  { value: "🗂️", label: "Arquivo" },
  { value: "📑", label: "Documentos" },
  { value: "📊", label: "Dados" },
  { value: "🎵", label: "Música" },
  { value: "🎬", label: "Vídeos" },
  { value: "📸", label: "Fotos" },
];

const folderColors = [
  { value: "#94a3b8", label: "Cinza" },
  { value: "#60a5fa", label: "Azul" },
  { value: "#34d399", label: "Verde" },
  { value: "#fbbf24", label: "Amarelo" },
  { value: "#f87171", label: "Vermelho" },
  { value: "#c084fc", label: "Roxo" },
  { value: "#f472b6", label: "Rosa" },
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
}

export default function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
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

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    if (!loading) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("fileExplorer.createFolder.title")}</DialogTitle>
          <DialogDescription>
            {t("fileExplorer.createFolder.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fileExplorer.createFolder.name")}</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder={t("fileExplorer.createFolder.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ícone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {folderIcons.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <span>{icon.value}</span>
                            <span>{icon.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma cor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {folderColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color.value }}
                            />
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {loading ? t("common.loading") : t("common.create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
