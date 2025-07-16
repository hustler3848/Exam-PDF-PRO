
"use client";

import { useState, useEffect } from "react";
import type { ExamData } from "@/types/exam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, TimerIcon } from "lucide-react";
import { InlineMath, BlockMath } from 'react-katex';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface ExamSessionProps {
  examData: ExamData;
  onSubmit: (answers: Record<number, string>) => void;
}

const MathRenderer = ({ text }: { text: string }) => {
   if (typeof text !== 'string') {
    return null;
  }
  const parts = text.split(/(\${1,2}[^$]+\${1,2})/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};


export function ExamSession({ examData, onSubmit }: ExamSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const { questions, title } = examData;
  const currentQuestion = questions[currentQuestionIndex];

  // Default exam duration: 2 hours
  const examDurationInSeconds = 2 * 60 * 60;
  const [timeLeft, setTimeLeft] = useState(examDurationInSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime > 0 ? prevTime - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0'),
    };
  }

  const { hours, minutes, seconds } = formatTime(timeLeft);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-fade-in">
      {/* Main Question Area */}
      <div className="lg:col-span-2">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardDescription className="text-primary font-semibold uppercase tracking-wider">{title}</CardDescription>
            <CardTitle className="font-question text-xl md:text-2xl pt-2">
              <span className="font-semibold text-muted-foreground mr-2">Question No. {currentQuestion.questionNumber}</span>
            </CardTitle>
             <div className="font-question text-xl md:text-2xl pt-2">
                <MathRenderer text={currentQuestion.questionText} />
             </div>
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
                  <span><MathRenderer text={option} /></span>
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
               <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button className="bg-success hover:bg-success/90">
                    Finish Exam
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                       Are you sure you want to finish this session? You will not be able to change your answers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} className="bg-success hover:bg-success/90">Finish</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TimerIcon /> Time Left</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex justify-center gap-4 text-center">
                <div>
                    <div className="text-3xl font-bold bg-muted p-3 rounded-lg">{hours}</div>
                    <div className="text-xs text-muted-foreground mt-1">HOURS</div>
                </div>
                 <div>
                    <div className="text-3xl font-bold bg-muted p-3 rounded-lg">{minutes}</div>
                    <div className="text-xs text-muted-foreground mt-1">MINUTES</div>
                </div>
                 <div>
                    <div className="text-3xl font-bold bg-muted p-3 rounded-lg">{seconds}</div>
                    <div className="text-xs text-muted-foreground mt-1">SECONDS</div>
                </div>
            </div>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full mt-6">End Session</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Do you wanna end this session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will end your current exam session and calculate your score based on the answers you've provided so far.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} className="bg-destructive hover:bg-destructive/90">End Session</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
