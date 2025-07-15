"use client";

import { useState, useCallback } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PdfUploadProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

export function PdfUpload({ onUpload, isProcessing }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
        });
        return;
      }
      setFile(selectedFile);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleUploadClick = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-center">Upload your Quiz PDF</CardTitle>
        <CardDescription className="text-center">
          Drag & drop your file here or click to browse.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div
          {...getRootProps()}
          className={cn(
            "w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-accent" : "border-border hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FileUp className="w-10 h-10" />
            {file ? (
              <p className="font-medium text-foreground">{file.name}</p>
            ) : (
              <p>
                {isDragActive
                  ? "Drop the file here..."
                  : "Drag 'n' drop a PDF here, or click to select"}
              </p>
            )}
            <p className="text-xs">PDF only, max file size 10MB</p>
          </div>
        </div>
        <Button
          onClick={handleUploadClick}
          disabled={!file || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Extract Quiz"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
