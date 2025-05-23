import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { createTextFile } from "@/utils/storage";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

interface CreateTextFileEditorProps {
  onClose: () => void;
  onSuccess?: () => void;
  currentFolderId?: string | null;
}

export function CreateTextFileEditor({
  onClose,
  onSuccess,
  currentFolderId,
}: CreateTextFileEditorProps) {
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

      // Reset form and close editor
      form.reset();
      onClose();

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
          error instanceof Error ? error.message : t("fileCreate.error"),
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col absolute inset-0">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col h-full"
        >
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="mr-2"
                type="button" // Prevent form submission
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <FormField
                control={form.control}
                name="filename"
                render={({ field }) => (
                  <FormItem className="flex-grow mr-4">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "fileCreate.filenamePlaceholder",
                          "Enter filename..."
                        )}
                        className="text-lg font-semibold border-none focus-visible:ring-0 shadow-none p-0"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit" // Explicitly set type
              disabled={isCreating}
              className="px-4"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.creating")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("common.create")}
                </>
              )}
            </Button>
          </div>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col overflow-hidden">
                {/* FormLabel removed for notepad style */}
                <FormControl className="flex-1 overflow-auto">
                  <Textarea
                    {...field}
                    placeholder={t(
                      "fileCreate.contentPlaceholder",
                      "Start typing your notes here..."
                    )}
                    className="h-full w-full resize-none border-none focus-visible:ring-0 shadow-none text-base p-4 min-h-full"
                  />
                </FormControl>
                <FormMessage className="p-2 text-xs shrink-0" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

export default CreateTextFileEditor;
