
"use client";

import { useState } from "react";
import type { ExtractedQuestion } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { InlineMath, BlockMath } from 'react-katex';

interface AnswerKeyFormProps {
  extractedQuestions: ExtractedQuestion[];
  onSubmit: (answers: Record<number, string>) => void;
  title: string;
}

const formSchema = z.object({
  answers: z.array(z.object({
    questionNumber: z.number(),
    correctAnswer: z.string().min(1, { message: "Please select an answer." }),
  })),
});

type AnswerKeyFormData = z.infer<typeof formSchema>;

export function AnswerKeyForm({ extractedQuestions, onSubmit, title }: AnswerKeyFormProps) {
  const { toast } = useToast();
  const form = useForm<AnswerKeyFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      answers: extractedQuestions.map(q => ({ questionNumber: q.questionNumber, correctAnswer: "" })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "answers",
  });

  const handleSubmit = (data: AnswerKeyFormData) => {
    const answerRecord = data.answers.reduce((acc, ans) => {
      acc[ans.questionNumber] = ans.correctAnswer;
      return acc;
    }, {} as Record<number, string>);
    
    onSubmit(answerRecord);
    toast({
        title: "Answer Key Submitted!",
        description: "Your quiz is now ready to be played or saved.",
    });
  };

  const renderMath = (text: string) => {
    if (text.includes('$')) {
        // For BlockMath, we'll split by $$ and process segments
        const segments = text.split(/(\$\$[^`]+\$\$)/g).filter(Boolean);
        return segments.map((segment, index) => {
            if (segment.startsWith('$$') && segment.endsWith('$$')) {
                return <BlockMath key={index} math={segment.slice(2, -2)} />;
            }
            // For InlineMath, we'll split by $
            const inlineSegments = segment.split(/(\$[^`]+\$)/g).filter(Boolean);
            return inlineSegments.map((inlineSegment, inlineIndex) => {
                if (inlineSegment.startsWith('$') && inlineSegment.endsWith('$')) {
                    return <InlineMath key={`${index}-${inlineIndex}`} math={inlineSegment.slice(1, -1)} />;
                }
                return <span key={`${index}-${inlineIndex}`}>{inlineSegment}</span>;
            });
        });
    }
    return <span>{text}</span>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-center">
          Provide Answer Key
        </CardTitle>
        <CardDescription className="text-center">
          Extracted {extractedQuestions.length} questions from <strong>{title}</strong>. Please select the correct answer for each question below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6">
                {fields.map((field, index) => {
                  const question = extractedQuestions[index];
                  return (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`answers.${index}.correctAnswer`}
                      render={({ field }) => (
                        <FormItem className="p-4 border rounded-lg">
                          <FormLabel className="font-question text-base flex items-start gap-2">
                             <span>{question.questionNumber}.</span> 
                             <div className="flex-1">{renderMath(question.questionText)}</div>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the correct answer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {question.options.map((option, i) => (
                                <SelectItem key={i} value={option}>
                                  {renderMath(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                })}
              </div>
            </ScrollArea>
             <CardFooter className="mt-6 p-0">
                <Button type="submit" className="w-full" size="lg">
                    Create Quiz
                </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
