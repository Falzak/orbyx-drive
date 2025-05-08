import React, { forwardRef, useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export interface RichTextEditorProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ReactQuill>, "theme"> {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const RichTextEditor = forwardRef<ReactQuill, RichTextEditorProps>(
  ({ className, placeholder, value, onChange, ...props }, ref) => {
    const [isMounted, setIsMounted] = useState(false);
    const { theme } = useTheme();
    const editorRef = useRef<HTMLDivElement>(null);

    // Prevent hydration issues with SSR
    useEffect(() => {
      setIsMounted(true);
    }, []);

    // Apply custom styles after mounting
    useEffect(() => {
      if (isMounted && editorRef.current) {
        const style = document.createElement('style');
        style.innerHTML = `
          .custom-editor .ql-toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            padding: 8px 12px !important;
            border-radius: 6px 6px 0 0;
            background-color: ${theme === "dark" ? "var(--editor-bg-dark)" : "var(--editor-bg-light)"};
            border-color: ${theme === "dark" ? "var(--editor-border-dark)" : "var(--editor-border-light)"};
            border-bottom-width: 1px;
          }

          .custom-editor .ql-formats {
            display: flex !important;
            align-items: center;
            gap: 4px;
            margin-right: 8px !important;
            position: relative;
          }
          
          .custom-editor .ql-formats:not(:last-child)::after {
            content: "";
            position: absolute;
            right: -4px;
            top: 50%;
            transform: translateY(-50%);
            height: 24px;
            width: 1px;
            background-color: ${theme === "dark" ? "var(--editor-border-dark)" : "var(--editor-border-light)"};
          }

          .custom-editor .ql-toolbar button {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 4px;
            transition: all 0.15s ease;
            margin: 0;
            position: relative;
          }
          
          .custom-editor .ql-toolbar svg {
            width: 18px;
            height: 18px;
          }

          .custom-editor .ql-toolbar button:hover,
          .custom-editor .ql-toolbar .ql-picker-label:hover {
            background-color: ${theme === "dark" ? "var(--editor-hover-dark)" : "var(--editor-hover-light)"};
          }

          .custom-editor .ql-toolbar button.ql-active,
          .custom-editor .ql-toolbar .ql-picker-label.ql-active {
            background-color: ${theme === "dark" ? "var(--editor-active-dark)" : "var(--editor-active-light)"};
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .custom-editor .ql-toolbar button.ql-active .ql-stroke,
          .custom-editor .ql-toolbar .ql-picker-label.ql-active .ql-stroke {
            stroke: ${theme === "dark" ? "#fff" : "#000"};
          }
          
          .custom-editor .ql-toolbar button.ql-active .ql-fill,
          .custom-editor .ql-toolbar .ql-picker-label.ql-active .ql-fill {
            fill: ${theme === "dark" ? "#fff" : "#000"};
          }

          .custom-editor .ql-picker-label {
            display: flex;
            align-items: center;
            height: 32px;
            padding: 0 8px;
            border-radius: 4px;
            transition: all 0.15s ease;
            font-size: 14px;
          }
          
          .custom-editor .ql-picker-label .ql-stroke {
            stroke: ${theme === "dark" ? "#e0e0e0" : "#555"};
          }
          
          .custom-editor .ql-picker-label .ql-fill {
            fill: ${theme === "dark" ? "#e0e0e0" : "#555"};
          }

          .custom-editor .ql-picker-options {
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 6px;
            border: 1px solid ${theme === "dark" ? "var(--editor-border-dark)" : "var(--editor-border-light)"};
            background-color: ${theme === "dark" ? "hsl(240 3.7% 18%)" : "#fff"};
          }

          .custom-editor .ql-picker-item {
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 14px;
            color: ${theme === "dark" ? "#e0e0e0" : "#333"};
          }

          .custom-editor .ql-picker-item:hover {
            background-color: ${theme === "dark" ? "var(--editor-hover-dark)" : "var(--editor-hover-light)"};
          }
          
          .custom-editor .ql-stroke {
            stroke: ${theme === "dark" ? "#e0e0e0" : "#555"};
            stroke-width: 1.5px;
          }
          
          .custom-editor .ql-fill {
            fill: ${theme === "dark" ? "#e0e0e0" : "#555"};
          }

          .custom-editor .ql-container {
            border-radius: 0 0 6px 6px;
            font-size: 16px;
            border: 1px solid ${theme === "dark" ? "var(--editor-border-dark)" : "var(--editor-border-light)"};
            border-top: none;
          }
          
          .custom-editor .ql-editor {
            color: ${theme === "dark" ? "#e0e0e0" : "#333"};
          }
          
          .custom-editor .ql-header[value="1"]::after {
            content: "1";
            position: absolute;
            bottom: 2px;
            right: 4px;
            font-size: 9px;
            color: ${theme === "dark" ? "#aaa" : "#888"};
          }
          
          .custom-editor .ql-color .ql-picker-label,
          .custom-editor .ql-background .ql-picker-label,
          .custom-editor .ql-align .ql-picker-label,
          .custom-editor .ql-header .ql-picker-label {
            padding-right: 18px;
          }
        `;
        document.head.appendChild(style);
        
        return () => {
          document.head.removeChild(style);
        };
      }
    }, [isMounted, theme]);

    if (!isMounted) {
      return (
        <div
          className={cn(
            "flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
      );
    }

    const modules = {
      toolbar: [
        [{ header: [false, 1, 2, 3, 4, 5, 6] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        [{ color: [] }, { background: [] }],
        ["link", "image"],
        ["clean"],
      ],
    };

    const formats = [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "indent",
      "align",
      "color",
      "background",
      "link",
      "image",
    ];

    return (
      <div
        ref={editorRef}
        className={cn(
          "rich-text-editor-wrapper h-full custom-editor",
          theme === "dark" ? "dark-theme" : "light-theme"
        )}
      >
        <ReactQuill
          ref={ref}
          theme="snow"
          placeholder={placeholder}
          value={value || ""}
          onChange={onChange}
          modules={modules}
          formats={formats}
          className={cn("flex flex-col h-full", className)}
          {...props}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
