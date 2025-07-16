
"use client";

import { useState } from "react";
import type { ExamData } from "@/types/exam";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
} from "@/components/ui/chart";
import { Label, Pie, PieChart, Cell } from "recharts";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "./ui/switch";
import { Label as UiLabel } from "./ui/label";
import { InlineMath, BlockMath } from 'react-katex';


interface ExamResultsProps {
  examData: ExamData;
  userAnswers: Record<number, string>;
  onRestart: () => void;
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

const checkAnswer = (userAnswer: string, correctAnswer: string) => {
  if (!userAnswer || !correctAnswer) return false;
  // Handle cases like:
  // userAnswer: "d) E" | correctAnswer: "d" -> true
  // userAnswer: "Photosynthesis" | correctAnswer: "a) Photosynthesis" -> false (but should be true if AI extracts full text)
  // To be safe, we check if one string starts with the other, after trimming.
  const ua = userAnswer.trim();
  const ca = correctAnswer.trim();
  return ua === ca || ua.startsWith(ca) || ca.startsWith(ua);
}

export function ExamResults({
  examData,
  userAnswers,
}: ExamResultsProps) {
  const [showOnlyIncorrect, setShowOnlyIncorrect] = useState(false);

  const { questions } = examData;
  const score = questions.reduce((acc, q) => {
    return checkAnswer(userAnswers[q.questionNumber], q.correctAnswer) ? acc + 1 : acc;
  }, 0);
  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const chartData = [
    { name: "correct", value: score, fill: "hsl(var(--success))" },
    { name: "incorrect", value: total - score, fill: "hsl(var(--destructive))" },
  ];

  const filteredQuestions = showOnlyIncorrect
    ? questions.filter((q) => !checkAnswer(userAnswers[q.questionNumber], q.correctAnswer))
    : questions;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-lg">
        <CardHeader className="items-center">
          <CardTitle className="text-3xl font-headline">Exam Complete!</CardTitle>
          <CardDescription>Here's how you did on {examData.title}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="h-[200px] w-[200px]">
            <ChartContainer config={{}} className="mx-auto aspect-square">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} startAngle={90} endAngle={450}>
                   {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <>
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle" >
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold font-headline">
                                {percentage}%
                              </tspan>
                            </text>
                            <text x={viewBox.cx} y={(viewBox.cy || 0) + 20} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">
                                {score}/{total} correct
                              </tspan>
                            </text>
                          </>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-2xl">Review Your Answers</CardTitle>
              <CardDescription>Check your performance on each question.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="show-incorrect" checked={showOnlyIncorrect} onCheckedChange={setShowOnlyIncorrect} />
              <UiLabel htmlFor="show-incorrect">Show only incorrect</UiLabel>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filteredQuestions.map((q) => {
              const userAnswer = userAnswers[q.questionNumber];
              const isCorrect = checkAnswer(userAnswer, q.correctAnswer);
              return (
                <AccordionItem
                  value={`item-${q.questionNumber}`}
                  key={q.questionNumber}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start gap-3 text-left w-full">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                      )}
                      <span className="font-question flex-1">
                        {q.questionNumber}. <MathRenderer text={q.questionText} />
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-8">
                    <div className="space-y-3">
                      {q.options.map((option, i) => {
                        const isUserAnswer = userAnswer === option;
                        const isCorrectAnswer = checkAnswer(option, q.correctAnswer);
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md text-sm",
                              isCorrectAnswer && "bg-success/10",
                              isUserAnswer && !isCorrectAnswer && "bg-destructive/10"
                            )}
                          >
                             {isCorrectAnswer ? <CheckCircle2 className="h-4 w-4 text-success" /> : (isUserAnswer ? <XCircle className="h-4 w-4 text-destructive" /> : <div className="h-4 w-4"/>)}
                            <span><MathRenderer text={option} /></span>
                            {isUserAnswer && !isCorrectAnswer && <Badge variant="destructive">Your Answer</Badge>}
                            {isCorrectAnswer && <Badge className="bg-success text-success-foreground hover:bg-success/80">Correct Answer</Badge>}
                          </div>
                        );
                      })}
                    </div>
                    {!isCorrect && userAnswer && (
                      <p className="mt-3 text-sm font-code text-destructive">
                          Your answer: <MathRenderer text={userAnswer} />
                      </p>
                    )}
                     <p className="mt-1 text-sm font-code text-success">
                        Correct answer: <MathRenderer text={q.correctAnswer} />
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
             {filteredQuestions.length === 0 && showOnlyIncorrect && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-2" />
                <p className="text-lg font-semibold">Great job!</p>
                <p className="text-muted-foreground">You answered all questions correctly.</p>
              </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
