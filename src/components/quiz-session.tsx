
"use client";

import { useState } from "react";
import type { QuizData } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, TimerIcon } from "lucide-react";
import { InlineMath, BlockMath } from 'react-katex';
import { cn } from "@/lib/utils";

interface QuizSessionProps {
  quizData: QuizData;
  onSubmit: (answers: Record<number, string>) => void;
}

export function QuizSession({ quizData, onSubmit }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const { questions, title } = quizData;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionNumber]: value,
    }));
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-fade-in">
      {/* Main Question Area */}
      <div className="md:col-span-2">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardDescription className="text-primary font-semibold uppercase tracking-wider">{title}</CardDescription>
            <CardTitle className="font-question text-xl md:text-2xl pt-2">
              <span className="font-semibold text-muted-foreground mr-2">Question No. {currentQuestion.questionNumber}</span>
              <BlockMath math={currentQuestion.questionText} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.questionNumber] || ""}
              onValueChange={handleAnswerChange}
              className="space-y-4"
            >
              {currentQuestion.options.map((option, index) => (
                <Label
                  key={index}
                  htmlFor={`option-${index}`}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer text-base"
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <span><InlineMath math={option} /></span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Question
            </Button>
            {isLastQuestion ? (
              <Button onClick={handleSubmit} className="bg-success hover:bg-success/90">
                Finish Quiz
              </Button>
            ) : (
              <Button onClick={goToNext}>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="md:col-span-1 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TimerIcon /> Time Left</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex justify-center gap-4 text-center">
                <div>
                    <div className="text-3xl font-bold bg-muted p-3 rounded-lg">01</div>
                    <div className="text-xs text-muted-foreground mt-1">HOURS</div>
                </div>
                 <div>
                    <div className="text-3xl font-bold bg-muted p-3 rounded-lg">59</div>
                    <div className="text-xs text-muted-foreground mt-1">MINUTES</div>
                </div>
                 <div>
                    <div className="text-3xl font-bold bg-muted p-3 rounded-lg">55</div>
                    <div className="text-xs text-muted-foreground mt-1">SECONDS</div>
                </div>
            </div>
            <Button variant="destructive" className="w-full mt-6" onClick={handleSubmit}>End Session</Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {questions.map((q, index) => (
                <Button
                  key={q.questionNumber}
                  variant={index === currentQuestionIndex ? "default" : (answers[q.questionNumber] ? "secondary" : "outline")}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => goToQuestion(index)}
                >
                  {q.questionNumber}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span>Current</span>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                    <span>Answered</span>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border" />
                    <span>Not Answered</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
