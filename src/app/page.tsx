
"use client";

import { useState, useEffect } from "react";
import { BookOpen, FileUp, Save, Play, Library } from "lucide-react";
import { extractQuizQuestions } from "@/ai/flows/extract-quiz-questions";
import type { QuizData, ExtractedQuestion } from "@/types/quiz";
import { PdfUpload } from "@/components/pdf-upload";
import { QuizSession } from "@/components/quiz-session";
import { QuizResults } from "@/components/quiz-results";
import { AnswerKeyForm } from "@/components/answer-key-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SavedQuizzesDialog } from "@/components/saved-quizzes-dialog";
import { ProcessingAnimation } from "@/components/processing-animation";

type AppStatus = "upload" | "processing" | "answer_key" | "ready" | "quiz" | "results";

export default function Home() {
  const [status, setStatus] = useState<AppStatus>("upload");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<{title: string, questions: ExtractedQuestion[]} | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [savedQuizzes, setSavedQuizzes] = useState<QuizData[]>([]);
  const [isSavedQuizzesDialogOpen, setIsSavedQuizzesDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedQuizzes = localStorage.getItem("savedQuizzes");
      if (storedQuizzes) {
        setSavedQuizzes(JSON.parse(storedQuizzes));
      }
    } catch (error) {
      console.error("Failed to load quizzes from localStorage", error);
    }
  }, []);

  const handlePdfUpload = async (file: File) => {
    setStatus("processing");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const pdfDataUri = reader.result as string;
        const result = await extractQuizQuestions({ pdfDataUri });

        if (!result || !result.questions || result.questions.length === 0) {
          throw new Error("Could not extract any questions from the PDF. Please check the file format.");
        }
        
        setExtractedQuestions({ title: file.name, questions: result.questions });
        setStatus("answer_key");
        toast({
          title: "Extraction Complete!",
          description: "Please provide the answer key for the extracted questions.",
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

  const handleAnswerKeySubmit = (answers: Record<number, string>) => {
    if (extractedQuestions) {
      const fullQuizData: QuizData = {
        title: extractedQuestions.title,
        questions: extractedQuestions.questions.map(q => ({
          ...q,
          correctAnswer: answers[q.questionNumber] || "",
        })),
        accuracyAssessment: "User-provided answer key.",
      };
      setQuizData(fullQuizData);
      setStatus("ready");
      setExtractedQuestions(null);
    }
  };

  const handlePlayNow = () => {
    if (quizData) {
      setStatus("quiz");
    }
  };

  const handleSaveForLater = () => {
    if (quizData) {
      const existingQuizIndex = savedQuizzes.findIndex(q => q.title === quizData.title);
      let newSavedQuizzes;
      if (existingQuizIndex > -1) {
        newSavedQuizzes = [...savedQuizzes];
        newSavedQuizzes[existingQuizIndex] = quizData;
      } else {
        newSavedQuizzes = [...savedQuizzes, quizData];
      }
      
      try {
        localStorage.setItem("savedQuizzes", JSON.stringify(newSavedQuizzes));
        setSavedQuizzes(newSavedQuizzes);
        toast({
          title: existingQuizIndex > -1 ? "Quiz Updated!" : "Quiz Saved!",
          description: "You can access it from 'Saved Quizzes' on the home screen.",
        });
        handleRestart();
      } catch (error) {
        console.error("Failed to save quiz to localStorage", error);
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Could not save the quiz. Your browser storage might be full.",
        });
      }
    }
  };

  const handleStartSavedQuiz = (quiz: QuizData) => {
    setQuizData(quiz);
    setStatus("quiz");
    setIsSavedQuizzesDialogOpen(false);
  };

  const handleDeleteSavedQuiz = (quizToDelete: QuizData) => {
    const newSavedQuizzes = savedQuizzes.filter(q => q.title !== quizToDelete.title);
     try {
        localStorage.setItem("savedQuizzes", JSON.stringify(newSavedQuizzes));
        setSavedQuizzes(newSavedQuizzes);
        toast({
          title: "Quiz Deleted",
          description: `"${quizToDelete.title}" has been removed.`,
        });
      } catch (error) {
        console.error("Failed to delete quiz from localStorage", error);
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Could not delete the quiz.",
        });
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
    setExtractedQuestions(null);
  };

  const renderContent = () => {
    switch (status) {
      case "upload":
        return (
          <div className="flex flex-col items-center gap-4">
            <PdfUpload onUpload={handlePdfUpload} isProcessing={false} />
            {savedQuizzes.length > 0 && (
              <Button variant="secondary" onClick={() => setIsSavedQuizzesDialogOpen(true)}>
                <Library className="mr-2"/>
                Saved Quizzes ({savedQuizzes.length})
              </Button>
            )}
          </div>
        );
      case "processing":
        return <ProcessingAnimation />;
      case "answer_key":
        return extractedQuestions && <AnswerKeyForm extractedQuestions={extractedQuestions.questions} onSubmit={handleAnswerKeySubmit} title={extractedQuestions.title} />;
      case "ready":
        return (
          quizData && (
            <Card className="w-full max-w-lg mx-auto shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-center">Quiz Ready!</CardTitle>
                <CardDescription className="text-center">
                  Created a quiz with {quizData.questions.length} questions from <br /> <strong>{quizData.title}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Button onClick={handlePlayNow} size="lg" className="w-full sm:w-auto">
                  <Play className="mr-2" />
                  Play Now
                </Button>
                <Button onClick={handleSaveForLater} size="lg" variant="outline" className="w-full sm:w-auto">
                   <Save className="mr-2" />
                  Save for Later
                </Button>
              </CardContent>
            </Card>
          )
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
          {(status !== "upload" && status !== "processing") && (
            <Button onClick={handleRestart} variant="outline">
              Start New Quiz
            </Button>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl">{renderContent()}</div>
      </main>
      <SavedQuizzesDialog
        isOpen={isSavedQuizzesDialogOpen}
        onOpenChange={setIsSavedQuizzesDialogOpen}
        quizzes={savedQuizzes}
        onPlay={handleStartSavedQuiz}
        onDelete={handleDeleteSavedQuiz}
      />
    </div>
  );
}
