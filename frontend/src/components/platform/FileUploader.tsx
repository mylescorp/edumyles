"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload,
  File,
  Trash2,
  Loader2,
  Download,
  FileText,
  Image,
  FileSpreadsheet,
} from "lucide-react";

const FILE_ICONS: Record<string, React.ReactNode> = {
  image: <Image className="h-5 w-5 text-blue-500" />,
  pdf: <FileText className="h-5 w-5 text-red-500" />,
  spreadsheet: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
  default: <File className="h-5 w-5 text-gray-500" />,
};

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return FILE_ICONS.image;
  if (fileType === "application/pdf") return FILE_ICONS.pdf;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv"))
    return FILE_ICONS.spreadsheet;
  return FILE_ICONS.default;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface FileUploaderProps {
  category?: string;
  title?: string;
  description?: string;
}

export function FileUploader({
  category = "general",
  title = "File Manager",
  description = "Upload and manage platform files",
}: FileUploaderProps) {
  const { sessionToken } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const files = usePlatformQuery(
    api.platform.files.queries.listFiles,
    { sessionToken, category },
    !!sessionToken
  ) as any[] | undefined;

  const generateUploadUrl = useMutation(api.platform.files.mutations.generateUploadUrl);
  const saveFileMetadata = useMutation(api.platform.files.mutations.saveFileMetadata);
  const deleteFile = useMutation(api.platform.files.mutations.deleteFile);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionToken) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10 MB.",
        variant: "destructive",
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload images, PDFs, spreadsheets, or documents.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ sessionToken });
      const result = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      await saveFileMetadata({
        sessionToken,
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category,
      });

      toast({ title: "File Uploaded", description: `${file.name} uploaded successfully.` });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: any) => {
    if (!sessionToken) return;
    setDeletingId(fileId);
    try {
      await deleteFile({ sessionToken, fileId });
      toast({ title: "File Deleted", description: "File has been removed." });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete file.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={handleUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload File
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!files ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No files uploaded yet.</p>
            <p className="text-sm mt-1">Upload images, PDFs, spreadsheets, or documents.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file: any) => (
              <div
                key={file._id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.fileType)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)} &middot;{" "}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {file.category}
                  </Badge>
                  {file.fileUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(file._id)}
                    disabled={deletingId === file._id}
                  >
                    {deletingId === file._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
