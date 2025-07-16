
'use server';

/**
 * @fileOverview An AI agent for extracting answers from a quiz answer key PDF.
 */

import { geminiProVision, dataUriToInlineData } from "@/ai/gemini";
import { z } from "zod";

const AnswerSchema = z.object({
  questionNumber: z.number().describe('The question number.'),
  correctAnswer: z.string().describe('The correct answer for the question.'),
});

const ExtractAnswerKeyOutputSchema = z.object({
  answers: z.array(AnswerSchema).describe('The extracted answers.'),
});

export type ExtractAnswerKeyInput = { pdfDataUri: string };
export type ExtractAnswerKeyOutput = z.infer<typeof ExtractAnswerKeyOutputSchema>;

export async function extractAnswerKey(input: ExtractAnswerKeyInput): Promise<ExtractAnswerKeyOutput> {
  const prompt = `You are an expert at extracting answers from an answer key document. Your task is to extract the question number and the corresponding correct answer from the provided PDF.

  The answer key may list answers in various formats (e.g., "1. A", "2. B", "3) C", etc.). Your job is to parse this information accurately. The 'correctAnswer' should be the letter or the option text itself. For example, if the key says "1. A) Photosynthesis", the 'correctAnswer' can be "A" or "Photosynthesis". Be consistent.

  It is critical that you extract ALL answers from the document. Carefully scan every page to ensure no answers are missed.

  Return the data as a JSON object with an "answers" array. Each object in the array should have "questionNumber" (number) and "correctAnswer" (string).
  `;

  const pdfPart = dataUriToInlineData(input.pdfDataUri);

  try {
    const result = await geminiProVision.generateContent([prompt, pdfPart]);
    const response = await result.response;

    // Check for a valid response before proceeding
    if (!response || !response.text) {
      const message = response?.promptFeedback?.blockReason
        ? `The content could not be processed due to safety settings: ${response.promptFeedback.blockReason}`
        : "The AI returned an invalid response. Please check the PDF file or try again.";
      throw new Error(message);
    }
    
    const text = response.text();
    // Extract JSON from markdown code block
    const jsonText = text.replace(/```json\n?/, '').replace(/```$/, '').trim();
    
    if (!jsonText) {
      throw new Error("The AI returned an empty response from the answer key. Please check the PDF file or try again.");
    }
    
    const parsed = JSON.parse(jsonText);
    const validated = ExtractAnswerKeyOutputSchema.safeParse(parsed);
    
    if (!validated.success) {
      console.error("Schema validation failed:", validated.error);
      throw new Error("Failed to extract valid answers from the PDF answer key.");
    }
    
    // Filter out any empty or incomplete answers
    if (validated.data.answers) {
      validated.data.answers = validated.data.answers.filter(a => a && a.questionNumber && a.correctAnswer);
    }
    
    return validated.data;
  } catch (e: any) {
    console.error("Error during AI answer key extraction:", e);
    const message = e.message || "An error occurred while analyzing the answer key. Please try again.";
    throw new Error(message);
  }
}
