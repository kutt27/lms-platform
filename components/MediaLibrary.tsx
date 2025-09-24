"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Upload, 
  File, 
  Image as ImageIcon, 
  Video, 
  Trash2,
  Copy,
  Eye
} from "lucide-react";
import { FileUpload } from "./FileUpload";
import { toast } from "sonner";
import Image from "next/image";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface MediaLibraryProps {
  onSelect?: (file: MediaFile) => void;
  allowUpload?: boolean;
  allowDelete?: boolean;
  fileTypes?: string[];
}

export function MediaLibrary({
  onSelect,
  allowUpload = true,
  allowDelete = true,
  fileTypes = ["image/*", "video/*", ".pdf", ".doc", ".docx"],
}: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      // Mock data for demonstration
      const mockFiles: MediaFile[] = [
        {
          id: "1",
          name: "course-intro.mp4",
          url: "/placeholder-video.mp4",
          type: "video/mp4",
          size: 15728640, // 15MB
          uploadedAt: "2024-01-15T10:30:00Z",
        },
        {
          id: "2",
          name: "course-banner.jpg",
          url: "/placeholder-image.jpg",
          type: "image/jpeg",
          size: 2097152, // 2MB
          uploadedAt: "2024-01-14T14:20:00Z",
        },
        {
          id: "3",
          name: "lesson-notes.pdf",
          url: "/placeholder-document.pdf",
          type: "application/pdf",
          size: 1048576, // 1MB
          uploadedAt: "2024-01-13T09:15:00Z",
        },
      ];
      setFiles(mockFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load media files");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-6 w-6" />;
    if (type.startsWith("video/")) return <Video className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeCategory = (type: string) => {
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.includes("pdf") || type.includes("document")) return "document";
    return "other";
  };

  const handleUpload = (url: string, fileName: string) => {
    const newFile: MediaFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: fileName,
      url,
      type: "image/jpeg", // Mock type
      size: 1024000, // Mock size
      uploadedAt: new Date().toISOString(),
    };
    
    setFiles(prev => [newFile, ...prev]);
    setUploadDialogOpen(false);
  };

  const handleDelete = async (fileId: string) => {
    try {
      // In a real implementation, you would call an API to delete the file
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "all" || getFileTypeCategory(file.type) === selectedType;
    return matchesSearch && matchesType;
  });

  const fileTypeOptions = [
    { value: "all", label: "All Files" },
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
    { value: "document", label: "Documents" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="pt-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Media Library</h2>
        {allowUpload && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Files</DialogTitle>
              </DialogHeader>
              <FileUpload
                onUpload={handleUpload}
                acceptedTypes={fileTypes}
                multiple={true}
                maxSize={100}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {fileTypeOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedType === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* File Grid */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <File className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No files found</h3>
            <p className="text-muted-foreground">
              {search ? "Try adjusting your search terms" : "Upload some files to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative">
                {file.type.startsWith("image/") ? (
                  <div className="h-32 bg-muted rounded-t-lg overflow-hidden">
                    <Image
                      src={file.url}
                      alt={file.name}
                      width={200}
                      height={128}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-muted rounded-t-lg flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => copyToClipboard(file.url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    {allowDelete && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(file.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <h4 className="font-medium truncate mb-1">{file.name}</h4>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>{formatFileSize(file.size)}</span>
                  <Badge variant="outline" className="text-xs">
                    {getFileTypeCategory(file.type)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
                {onSelect && (
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => onSelect(file)}
                  >
                    Select
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
