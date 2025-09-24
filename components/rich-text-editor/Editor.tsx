"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Menubar } from "./Menubar";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        "data-placeholder": placeholder,
      },
    },
  });

  return (
    <div className={cn("border border-input rounded-md", className)}>
      <Menubar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[150px] focus-within:outline-none"
      />
    </div>
  );
}
