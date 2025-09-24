"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
// Drag and drop functionality temporarily disabled for build compatibility
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical,
  Plus
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  description?: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  lessons: any[];
}

interface ChaptersListProps {
  courseId: string;
  chapters: Chapter[];
}

export function ChaptersList({ courseId, chapters: initialChapters }: ChaptersListProps) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters || []);

  const handleReorder = () => {
    // Drag and drop reordering functionality to be implemented
    console.log("Reordering functionality temporarily disabled");
  };

  const handleTogglePublish = async (chapterId: string, isPublished: boolean) => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/publish`,
        {
          method: isPublished ? "DELETE" : "PATCH",
        }
      );

      if (response.ok) {
        setChapters(chapters.map(chapter => 
          chapter.id === chapterId 
            ? { ...chapter, isPublished: !isPublished }
            : chapter
        ));
      }
    } catch (error) {
      console.error("Error toggling chapter publish status:", error);
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setChapters(chapters.filter(chapter => chapter.id !== chapterId));
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No chapters yet</p>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add First Chapter
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters
        .sort((a, b) => a.position - b.position)
        .map((chapter, index) => (
          <Card key={chapter.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{chapter.title}</h4>
                  <div className="flex gap-1">
                    <Badge 
                      variant={chapter.isPublished ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {chapter.isPublished ? "Published" : "Draft"}
                    </Badge>
                    {chapter.isFree && (
                      <Badge variant="outline" className="text-xs">
                        Free
                      </Badge>
                    )}
                  </div>
                </div>
                {chapter.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {chapter.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {chapter.lessons?.length || 0} lessons
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTogglePublish(chapter.id, chapter.isPublished)}
                >
                  {chapter.isPublished ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(chapter.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
}
