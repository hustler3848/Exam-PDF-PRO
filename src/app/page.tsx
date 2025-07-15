"use client";

import { useState } from "react";
import { BookOpen, FileUp, Loader2, AlertTriangle } from "lucide-react";
import { extractQuizQuestions } from "@/ai/flows/extract-quiz-questions";
import type { QuizData } from "@/types/quiz";
import { PdfUpload } from "@/components/pdf-upload";
import { QuizSession } from "@/components/quiz-session";
import { QuizResults } from "@/components/quiz-results";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

type AppStatus = "upload" | "processing" | "quiz" | "results";

export default function Home() {
  const [status, setStatus] = useState<AppStatus>("upload");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const handlePdfUpload = async (file: File) => {
    setStatus("processing");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const pdfDataUri = reader.result as string;
        const result = (await extractQuizQuestions({
          pdfDataUri,
        })) as QuizData;

        if (!result || !result.questions || result.questions.length === 0) {
          throw new Error("Could not extract any questions from the PDF. Please check the file format.");
        }
        
        setQuizData(result);
        setStatus("quiz");
        toast({
          title: "Quiz Ready!",
          description: "Your quiz has been successfully generated.",
        });
      };
      reader.onerror = () => {
        throw new Error("Failed to read the file.");
      }
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: e.message || "Failed to generate quiz. Please try another PDF.",
      });
      setStatus("upload");
    }
  };

  const handleQuizSubmit = (answers: Record<number, string>) => {
    setUserAnswers(answers);
    setStatus("results");
  };

  const handleRestart = () => {
    setStatus("upload");
    setQuizData(null);
    setUserAnswers({});
  };

  const renderContent = () => {
    switch (status) {
      case "upload":
        return <PdfUpload onUpload={handlePdfUpload} isProcessing={false} />;
      case "processing":
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Extracting Quiz...</h2>
            <p className="text-muted-foreground">
              Our AI is analyzing your document. Please wait a moment.
            </p>
          </div>
        );
      case "quiz":
        return quizData && <QuizSession quizData={quizData} onSubmit={handleQuizSubmit} />;
      case "results":
        return (
          quizData && (
            <QuizResults
              quizData={quizData}
              userAnswers={userAnswers}
              onRestart={handleRestart}
            />
          )
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">
            Quiz PDF Pro
          </h1>
        </div>
        <div className="flex-grow" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {(status === "results" || status === "quiz") && (
            <Button onClick={handleRestart} variant="outline">
              Start New Quiz
            </Button>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl">{renderContent()}</div>
      </main>
    </div>
  );
}
