
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

  Return the data as a JSON object that matches this schema: ${JSON.stringify(ExtractAnswerKeyOutputSchema.jsonSchema)}
  `;

  const pdfPart = dataUriToInlineData(input.pdfDataUri);

  const result = await geminiProVision.generateContent([prompt, pdfPart]);
  const response = await result.response;
  const text = response.text();

  try {
    const jsonText = text.replace('```json', '').replace('```', '').trim();
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
    console.error("Error parsing AI response:", e);
    console.error("Raw text from AI:", text);
    throw new Error("The AI returned an invalid response. Could not parse the answer key.");
  }
}
