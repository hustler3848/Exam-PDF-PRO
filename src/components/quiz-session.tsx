"use client";

import { useState } from "react";
import type { QuizData } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { InlineMath, BlockMath } from 'react-katex';

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

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center text-muted-foreground">{title}</CardTitle>
        <Progress value={progress} className="w-full mt-2" />
        <CardDescription className="text-center pt-4">
          Question {currentQuestionIndex + 1} of {questions.length}
        </CardDescription>
        <CardTitle className="pt-2 !mt-0 font-question text-xl md:text-2xl text-center">
          <BlockMath math={currentQuestion.questionText} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={answers[currentQuestion.questionNumber] || ""}
          onValueChange={handleAnswerChange}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`option-${index}`}
              className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <span className="text-base"><InlineMath math={option} /></span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {isLastQuestion ? (
          <Button onClick={handleSubmit} className="bg-success hover:bg-success/90">
            Finish Quiz
          </Button>
        ) : (
          <Button onClick={goToNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
