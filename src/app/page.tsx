
"use client";

import { useState, useEffect } from "react";
import { BookOpen, FileUp, Save, Play, Library } from "lucide-react";
import { extractExamQuestions } from "@/ai/flows/extract-exam-questions";
import { extractAnswerKey } from "@/ai/flows/extract-answer-key";
import type { ExamData, ExtractedQuestion } from "@/types/exam";
import { PdfUpload } from "@/components/pdf-upload";
import { ExamSession } from "@/components/exam-session";
import { ExamResults } from "@/components/exam-results";
import { ProvideAnswerKey } from "@/components/provide-answer-key";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SavedExamsDialog } from "@/components/saved-exams-dialog";
import { ProcessingAnimation } from "@/components/processing-animation";

type AppStatus = "upload" | "processing_exam" | "provide_answer_key" | "processing_answers" | "ready" | "exam" | "results";

export default function Home() {
  const [status, setStatus] = useState<AppStatus>("upload");
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<{title: string, questions: ExtractedQuestion[]} | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [savedExams, setSavedExams] = useState<ExamData[]>([]);
  const [isSavedExamsDialogOpen, setIsSavedExamsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedExams = localStorage.getItem("savedExams");
      if (storedExams) {
        setSavedExams(JSON.parse(storedExams));
      }
    } catch (error) {
      console.error("Failed to load exams from localStorage", error);
    }
  }, []);

  const handlePdfUpload = async (file: File) => {
    setStatus("processing_exam");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const pdfDataUri = reader.result as string;
        const result = await extractExamQuestions({ pdfDataUri });

        if (!result || !result.questions || result.questions.length === 0) {
          throw new Error("Could not extract any questions from the PDF. Please check the file format.");
        }
        
        setExtractedQuestions({ title: file.name, questions: result.questions });
        setStatus("provide_answer_key");
        toast({
          title: "Extraction Complete!",
          description: `Extracted ${result.questions.length} questions. You can now provide an answer key or continue.`,
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
        description: e.message || "Failed to generate exam. Please try another PDF.",
      });
      setStatus("upload");
    }
  };

  const finalizeExamData = (answers: Record<number, string> = {}) => {
    if (extractedQuestions) {
      const fullExamData: ExamData = {
        title: extractedQuestions.title,
        questions: extractedQuestions.questions.map(q => ({
          ...q,
          // Default to empty string if no answer is found
          correctAnswer: answers[q.questionNumber] || "",
        })),
        accuracyAssessment: Object.keys(answers).length > 0 ? "AI-extracted answer key." : "No answer key provided.",
      };
      setExamData(fullExamData);
      setStatus("ready");
      setExtractedQuestions(null);
    }
  };
  
  const handleAnswerKeyUpload = async (file: File) => {
    setStatus("processing_answers");
     try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const pdfDataUri = reader.result as string;
        const result = await extractAnswerKey({ pdfDataUri });

        if (!result || !result.answers) {
          throw new Error("Could not extract any answers from the key.");
        }
        
        const answerRecord = result.answers.reduce((acc, ans) => {
            acc[ans.questionNumber] = ans.correctAnswer;
            return acc;
        }, {} as Record<number, string>);
        
        finalizeExamData(answerRecord);
        toast({
            title: "Answer Key Processed!",
            description: "Your exam is ready to start.",
        });
      };
      reader.onerror = () => {
        throw new Error("Failed to read the answer key file.");
      }
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Answer Key Error",
        description: e.message || "Failed to process answer key. Continuing without it.",
      });
      // Fallback to continue without answers
      handleContinueWithoutAnswerKey();
    }
  };

  const handleContinueWithoutAnswerKey = () => {
    finalizeExamData();
  };

  const handlePlayNow = () => {
    if (examData) {
      setStatus("exam");
    }
  };

  const handleSaveForLater = () => {
    if (examData) {
      const existingExamIndex = savedExams.findIndex(q => q.title === examData.title);
      let newSavedExams;
      if (existingExamIndex > -1) {
        newSavedExams = [...savedExams];
        newSavedExams[existingExamIndex] = examData;
      } else {
        newSavedExams = [...savedExams, examData];
      }
      
      try {
        localStorage.setItem("savedExams", JSON.stringify(newSavedExams));
        setSavedExams(newSavedExams);
        toast({
          title: existingExamIndex > -1 ? "Exam Updated!" : "Exam Saved!",
          description: "You can access it from 'Saved Exams' on the home screen.",
        });
        handleRestart();
      } catch (error) {
        console.error("Failed to save exam to localStorage", error);
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Could not save the exam. Your browser storage might be full.",
        });
      }
    }
  };

  const handleStartSavedExam = (exam: ExamData) => {
    setExamData(exam);
    setStatus("exam");
    setIsSavedExamsDialogOpen(false);
  };

  const handleDeleteSavedExam = (examToDelete: ExamData) => {
    const newSavedExams = savedExams.filter(q => q.title !== examToDelete.title);
     try {
        localStorage.setItem("savedExams", JSON.stringify(newSavedExams));
        setSavedExams(newSavedExams);
        toast({
          title: "Exam Deleted",
          description: `"${examToDelete.title}" has been removed.`,
        });
      } catch (error) {
        console.error("Failed to delete exam from localStorage", error);
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Could not delete the exam.",
        });
      }
  };

  const handleExamSubmit = (answers: Record<number, string>) => {
    setUserAnswers(answers);
    setStatus("results");
  };

  const handleRestart = () => {
    setStatus("upload");
    setExamData(null);
    setUserAnswers({});
    setExtractedQuestions(null);
  };

  const renderContent = () => {
    switch (status) {
      case "upload":
        return (
          <div className="flex flex-col items-center gap-4">
            <PdfUpload onUpload={handlePdfUpload} isProcessing={false} />
            {savedExams.length > 0 && (
              <Button variant="secondary" onClick={() => setIsSavedExamsDialogOpen(true)}>
                <Library className="mr-2"/>
                Saved Exams ({savedExams.length})
              </Button>
            )}
          </div>
        );
      case "processing_exam":
        return <ProcessingAnimation />;
      case "provide_answer_key":
        return extractedQuestions && (
            <ProvideAnswerKey
              questionCount={extractedQuestions.questions.length}
              onUploadKey={handleAnswerKeyUpload}
              onContinue={handleContinueWithoutAnswerKey}
            />
        );
       case "processing_answers":
        return <ProcessingAnimation />;
      case "ready":
        return (
          examData && (
            <Card className="w-full max-w-lg mx-auto shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-center">Start Exam?</CardTitle>
                <CardDescription className="text-center">
                  Created a exam with {examData.questions.length} questions from <br /> <strong>{examData.title}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Button onClick={handlePlayNow} size="lg" className="w-full sm:w-auto">
                  <Play className="mr-2" />
                  Start Exam
                </Button>
                <Button onClick={handleSaveForLater} size="lg" variant="outline" className="w-full sm:w-auto">
                   <Save className="mr-2" />
                  Save Exam
                </Button>
              </CardContent>
            </Card>
          )
        );
      case "exam":
        return examData && <ExamSession examData={examData} onSubmit={handleExamSubmit} />;
      case "results":
        return (
          examData && (
            <ExamResults
              examData={examData}
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
            Exam PDF Pro
          </h1>
        </div>
        <div className="flex-grow" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {(status !== "upload" && status !== "processing_exam") && (
            <Button onClick={handleRestart} variant="outline">
              Start New Exam
            </Button>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl">{renderContent()}</div>
      </main>
      <SavedExamsDialog
        isOpen={isSavedExamsDialogOpen}
        onOpenChange={setIsSavedExamsDialogOpen}
        exams={savedExams}
        onPlay={handleStartSavedExam}
        onDelete={handleDeleteSavedExam}
      />
    </div>
  );
}
