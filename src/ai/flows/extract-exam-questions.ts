
'use server';

/**
 * @fileOverview A exam question extraction AI agent.
 */
import { geminiProVision, dataUriToInlineData } from "@/ai/gemini";
import { z } from "zod";
import { jsonrepair } from "jsonrepair";

const ExamQuestionSchema = z.object({
  questionNumber: z.number().describe('The question number.'),
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('The possible answer options for the question.'),
});

const ExtractExamQuestionsOutputSchema = z.object({
  questions: z.array(ExamQuestionSchema).describe('The extracted exam questions.'),
});

export type ExtractExamQuestionsInput = { pdfDataUri: string };
export type ExtractExamQuestionsOutput = z.infer<typeof ExtractExamQuestionsOutputSchema>;

export async function extractExamQuestions(input: ExtractExamQuestionsInput): Promise<ExtractExamQuestionsOutput> {
  const prompt = `You are an expert exam question extractor. Your task is to extract exam questions and their multiple-choice options from a PDF document. Your output MUST be a valid JSON object.

  It is critical that you extract ALL questions from the document. Carefully scan every page to ensure no questions are missed. Do NOT extract the correct answers, only the questions and the options.

  IMPORTANT: If you encounter any mathematical equations or symbols (like fractions, integrals, summations, greek letters, etc.), you MUST format them using LaTeX. For inline mathematics, wrap the expression in single dollar signs ($...$). For block-level or display mathematics, wrap the expression in double dollar signs ($$...$$).

  Analyze the PDF document and identify the questions, question numbers, and options. Return a JSON object with a "questions" array. Each object in the array should have "questionNumber" (number), "questionText" (string), and "options" (array of strings).
  `;
  
  const pdfPart = dataUriToInlineData(input.pdfDataUri);

  try {
    const result = await geminiProVision.generateContent([prompt, pdfPart]);
    const response = await result.response;

    if (!response || !response.text) {
      const message = response?.promptFeedback?.blockReason
        ? `The content could not be processed due to safety settings: ${response.promptFeedback.blockReason}`
        : "The AI returned an invalid response. Please check the PDF file or try again.";
      throw new Error(message);
    }
    
    const text = response.text();
    console.log("Raw AI Response (Exam Questions):", text);
    
    const jsonText = text.replace(/```json\n?/, '').replace(/```$/, '').trim();

    if (!jsonText) {
      throw new Error("The AI returned an empty response. Please check the PDF file or try again.");
    }

    const repairedJson = jsonrepair(jsonText);
    const parsed = JSON.parse(repairedJson);
    const validated = ExtractExamQuestionsOutputSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Final validation failed:", validated.error);
      throw new Error("Failed to extract valid questions from the PDF.");
    }

    if (validated.data.questions) {
      validated.data.questions = validated.data.questions.filter((q: any) => 
        q && q.questionNumber && q.questionText && Array.isArray(q.options) && q.options.length > 0
      );
    }

    return validated.data;
  } catch (e: any) {
    console.error("Error during AI exam extraction:", e);
    const message = e.message || "An error occurred while analyzing the document. Please try again.";
    throw new Error(message);
  }
}
