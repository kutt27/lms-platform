"use client";

import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Editor } from "@tiptap/react";
import { Toggle } from "@/components/ui/toggle";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenubarProps {
  editor: Editor | null;
}

export function Menubar({ editor }: MenubarProps) {
  const [, forceUpdate] = useState({});

  // Re-render toolbar when editor changes
  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate({});
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <TooltipProvider>
      <div className="border-b border-border p-2 flex items-center gap-1">
        {/* Bold */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              variant="outline"
              pressed={editor.isActive("bold")}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "transition-colors",
                editor.isActive("bold") && "bg-primary text-primary-foreground"
              )}
            >
              <Bold className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>

        {/* Italic */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              variant="outline"
              pressed={editor.isActive("italic")}
              onPressedChange={() =>
                editor.chain().focus().toggleItalic().run()
              }
              className={cn(
                "transition-colors",
                editor.isActive("italic") &&
                  "bg-primary text-primary-foreground"
              )}
            >
              <Italic className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>

        {/* Underline */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              variant="outline"
              pressed={editor.isActive("underline")}
              onPressedChange={() =>
                editor.chain().focus().toggleUnderline().run()
              }
              className={cn(
                "transition-colors",
                editor.isActive("underline") &&
                  "bg-primary text-primary-foreground"
              )}
            >
              <Underline className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Underline</TooltipContent>
        </Tooltip>

        {/* Bullet List */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              variant="outline"
              pressed={editor.isActive("bulletList")}
              onPressedChange={() =>
                editor.chain().focus().toggleBulletList().run()
              }
              className={cn(
                "transition-colors",
                editor.isActive("bulletList") &&
                  "bg-primary text-primary-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>

        {/* Numbered List */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              variant="outline"
              pressed={editor.isActive("orderedList")}
              onPressedChange={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
              className={cn(
                "transition-colors",
                editor.isActive("orderedList") &&
                  "bg-primary text-primary-foreground"
              )}
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Numbered List</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
