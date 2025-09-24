"use client";

import { MediaLibrary } from "@/components/MediaLibrary";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Media Library</h1>
        <p className="text-muted-foreground">
          Manage your course media files including videos, images, and documents
        </p>
      </div>

      <MediaLibrary
        allowUpload={true}
        allowDelete={true}
        fileTypes={["image/*", "video/*", ".pdf", ".doc", ".docx", ".ppt", ".pptx"]}
      />
    </div>
  );
}
