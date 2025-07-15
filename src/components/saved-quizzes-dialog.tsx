
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
import type { QuizData } from "@/types/quiz";
import { Play, Trash2 } from "lucide-react";

interface SavedQuizzesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  quizzes: QuizData[];
  onPlay: (quiz: QuizData) => void;
  onDelete: (quiz: QuizData) => void;
}

export function SavedQuizzesDialog({
  isOpen,
  onOpenChange,
  quizzes,
  onPlay,
  onDelete,
}: SavedQuizzesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Saved Quizzes</DialogTitle>
          <DialogDescription>
            Select a quiz to play or delete it.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-4 pr-6">
            {quizzes.length > 0 ? (
              quizzes.map((quiz, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate" title={quiz.title}>
                      {quiz.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {quiz.questions.length} questions
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPlay(quiz)}
                    >
                      <Play className="h-5 w-5 text-success" />
                      <span className="sr-only">Play</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(quiz)}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                You have no saved quizzes.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
