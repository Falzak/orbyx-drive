import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { createTextFile } from "@/utils/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Schema for form validation
const textFileSchema = z.object({
  filename: z
    .string()
    .min(1, { message: "Filename is required" })
    .refine((name) => /^[^\\/:*?"<>|]+$/.test(name), {
      message: "Filename contains invalid characters",
    }),
  content: z.string().optional(),
});

type TextFileFormValues = z.infer<typeof textFileSchema>;

interface CreateTextFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentFolderId?: string | null;
}

export function CreateTextFileDialog({
  open,
  onOpenChange,
  onSuccess,
  currentFolderId,
}: CreateTextFileDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<TextFileFormValues>({
    resolver: zodResolver(textFileSchema),
    defaultValues: {
      filename: "New Document.txt",
      content: "",
    },
  });

  const handleSubmit = async (values: TextFileFormValues) => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("common.unauthorized"),
      });
      return;
    }

    try {
      setIsCreating(true);

      // Ensure filename has a .txt extension if not provided
      let filename = values.filename;
      if (!filename.includes(".")) {
        filename = `${filename}.txt`;
      }

      // Create the text file
      await createTextFile(values.content || "", filename, {
        folderId: currentFolderId,
      });

      toast({
        title: t("common.success"),
        description: t("fileCreate.success"),
      });

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating text file:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error instanceof Error
            ? error.message
            : t("fileCreate.error"),
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("fileCreate.title")}</DialogTitle>
          <DialogDescription>
            {t("fileCreate.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="filename"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fileCreate.filename")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fileCreate.content")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={10}
                      placeholder={t("fileCreate.contentPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.creating")}
                  </>
                ) : (
                  t("common.create")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTextFileDialog;
