
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExamData } from "@/types/exam";
import { Play, Trash2 } from "lucide-react";

interface SavedExamsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  exams: ExamData[];
  onPlay: (exam: ExamData) => void;
  onDelete: (exam: ExamData) => void;
}

export function SavedExamsDialog({
  isOpen,
  onOpenChange,
  exams,
  onPlay,
  onDelete,
}: SavedExamsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle>Saved Exams</DialogTitle>
          <DialogDescription>
            Select a exam to play or delete it.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-4 pr-6">
            {exams.length > 0 ? (
              exams.map((exam, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate" title={exam.title}>
                      {exam.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {exam.questions.length} questions
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPlay(exam)}
                      aria-label={`Play exam ${exam.title}`}
                    >
                      <Play className="h-5 w-5 text-success" />
                      <span className="sr-only">Play</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(exam)}
                      aria-label={`Delete exam ${exam.title}`}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                You have no saved exams.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
