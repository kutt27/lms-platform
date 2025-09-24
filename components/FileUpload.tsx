"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  Video, 
  X, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onUpload: (url: string, fileName: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  multiple?: boolean;
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: "uploading" | "success" | "error";
  progress: number;
}

export function FileUpload({
  onUpload,
  acceptedTypes = ["image/*", "video/*", ".pdf", ".doc", ".docx"],
  maxSize = 100, // 100MB default
  multiple = false,
  className = "",
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8" />;
    if (type.startsWith("video/")) return <Video className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes("*")) {
        const baseType = type.split("/")[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(", ")}`;
    }

    return null;
  };

  const simulateUpload = async (file: File): Promise<string> => {
    // Simulate file upload with progress
    return new Promise((resolve, reject) => {
      const fileId = Math.random().toString(36).substr(2, 9);
      
      // Create a mock URL for demonstration
      const mockUrl = URL.createObjectURL(file);
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: "success" as const, progress: 100, url: mockUrl }
              : f
          ));
          
          resolve(mockUrl);
        } else {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, progress }
              : f
          ));
        }
      }, 200);

      // Add file to state
      setFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: "",
        status: "uploading",
        progress: 0,
      }]);
    });
  };

  const handleFiles = async (fileList: FileList) => {
    const filesToProcess = Array.from(fileList);
    
    if (!multiple && filesToProcess.length > 1) {
      toast.error("Only one file is allowed");
      return;
    }

    for (const file of filesToProcess) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      try {
        const url = await simulateUpload(file);
        onUpload(url, file.name);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        
        setFiles(prev => prev.map(f => 
          f.name === file.name 
            ? { ...f, status: "error" as const }
            : f
        ));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Supports: {acceptedTypes.join(", ")}
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: {maxSize}MB
          </p>
          <Button variant="outline" className="mt-4">
            Choose Files
          </Button>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className="text-muted-foreground">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  {file.status === "uploading" && (
                    <Progress value={file.progress} className="mt-2 h-2" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {file.status === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
