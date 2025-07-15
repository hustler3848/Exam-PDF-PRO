
"use client";

import { useState, useCallback } from "react";
import { FileUp, FileKey, ArrowRight } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProvideAnswerKeyProps {
  questionCount: number;
  onUploadKey: (file: File) => void;
  onContinue: () => void;
}

export function ProvideAnswerKey({ questionCount, onUploadKey, onContinue }: ProvideAnswerKeyProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a PDF file for the answer key.",
        });
        return;
      }
      setFile(selectedFile);
      onUploadKey(selectedFile);
    }
  }, [toast, onUploadKey]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-center">
          {questionCount} Questions Extracted
        </CardTitle>
        <CardDescription className="text-center">
          You can now provide an answer key PDF to enable automatic scoring, or continue without one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div
          {...getRootProps()}
          className={cn(
            "w-full h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-accent" : "border-border hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FileKey className="w-10 h-10" />
            {file ? (
              <p className="font-medium text-foreground">{file.name}</p>
            ) : (
              <p>
                {isDragActive
                  ? "Drop answer key here..."
                  : "Upload Answer Key PDF"}
              </p>
            )}
            <p className="text-xs">Drag & drop or click to browse</p>
          </div>
        </div>
        <div className="w-full flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 text-center text-sm text-muted-foreground my-2 sm:my-0">OR</div>
        </div>
        <Button
          onClick={onContinue}
          className="w-full"
          size="lg"
          variant="secondary"
        >
            Continue Without Answer Key
            <ArrowRight className="ml-2"/>
        </Button>
      </CardContent>
    </Card>
  );
}
