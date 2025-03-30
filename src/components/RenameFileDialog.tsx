import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { FileData } from "@/types";
import { useTranslation } from "react-i18next";
import { Edit, Loader2 } from "lucide-react";

interface RenameFileDialogProps {
  file: FileData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (file: FileData, newName: string) => void;
}

const renameSchema = z.object({
  filename: z
    .string()
    .min(1, { message: "Filename is required" })
    .max(255, { message: "Filename is too long (max 255 characters)" })
    .refine((name) => !name.includes("/") && !name.includes("\\"), {
      message: "Filename cannot contain / or \\",
    })
    .refine(
      (name) =>
        !name.includes(":") &&
        !name.includes("*") &&
        !name.includes("?") &&
        !name.includes('"') &&
        !name.includes("<") &&
        !name.includes(">") &&
        !name.includes("|"),
      {
        message: 'Filename cannot contain : * ? " < > |',
      }
    )
    .refine((name) => !name.startsWith("."), {
      message: "Filename cannot start with a dot (.)",
    })
    .refine((name) => !/^\s+$/.test(name), {
      message: "Filename cannot consist only of whitespace",
    }),
});

type RenameFormValues = z.infer<typeof renameSchema>;

export function RenameFileDialog({
  file,
  open,
  onOpenChange,
  onRename,
}: RenameFileDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RenameFormValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      filename: file?.filename || "",
    },
  });

  // Update form values when file changes
  React.useEffect(() => {
    if (file) {
      form.reset({
        filename: file.filename,
      });
    }
  }, [file, form]);

  const handleSubmit = async (values: RenameFormValues) => {
    if (file && values.filename !== file.filename) {
      try {
        setIsLoading(true);
        await onRename(file, values.filename);
        onOpenChange(false);
      } catch (error) {
        console.error("Error renaming file:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("fileExplorer.contextMenu.rename")}
            <Edit className="h-4 w-4 text-primary" />
          </DialogTitle>
          <DialogDescription>
            {t("fileExplorer.contextMenu.renamePrompt")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="filename"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("fileExplorer.fileProperties.details.name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("fileExplorer.contextMenu.renamePrompt")}
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
