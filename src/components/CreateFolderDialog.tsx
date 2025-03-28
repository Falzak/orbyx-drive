
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

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
  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: editFolder?.name || "",
      icon: editFolder?.icon || "📁",
      color: editFolder?.color || "#94a3b8",
    },
  });

  const handleSubmit = async (values: FolderFormValues) => {
    if (onSubmit) {
      onSubmit(values);
    } else if (onCreateFolder) {
      await onCreateFolder(values);
    }
    form.reset();
    onOpenChange(false);
  };

  const ICONS = ["📁", "📂", "📝", "🔒", "🔍", "🏠", "⭐", "📊", "📷"];
  const COLORS = [
    "#94a3b8", // slate
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f97316", // orange
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f43f5e", // rose
    "#eab308", // yellow
    "#14b8a6", // teal
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Criar nova pasta" : "Editar pasta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adicione uma nova pasta para organizar seus arquivos."
              : "Edite as informações da pasta."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da pasta</FormLabel>
                  <FormControl>
                    <Input placeholder="Minha pasta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={form.watch("icon") === icon ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => form.setValue("icon", icon)}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant="outline"
                      size="icon"
                      className={`h-10 w-10 ${
                        form.watch("color") === color ? "ring-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => form.setValue("color", color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">
                {mode === "create" ? "Criar pasta" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
