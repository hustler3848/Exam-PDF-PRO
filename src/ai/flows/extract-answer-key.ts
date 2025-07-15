
'use server';

/**
 * @fileOverview An AI agent for extracting answers from a quiz answer key PDF.
 *
 * - extractAnswerKey - A function that handles the answer key extraction process.
 * - ExtractAnswerKeyInput - The input type for the extractAnswerKey function.
 * - ExtractAnswerKeyOutput - The return type for the extractAnswerKey function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractAnswerKeyInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "An answer key PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractAnswerKeyInput = z.infer<typeof ExtractAnswerKeyInputSchema>;

const AnswerSchema = z.object({
  questionNumber: z.number().describe('The question number.'),
  correctAnswer: z.string().describe('The correct answer for the question.'),
});

const ExtractAnswerKeyOutputSchema = z.object({
  answers: z.array(AnswerSchema).describe('The extracted answers.'),
});
export type ExtractAnswerKeyOutput = z.infer<typeof ExtractAnswerKeyOutputSchema>;

export async function extractAnswerKey(input: ExtractAnswerKeyInput): Promise<ExtractAnswerKeyOutput> {
  return extractAnswerKeyFlow(input);
}

const extractAnswerKeyPrompt = ai.definePrompt({
  name: 'extractAnswerKeyPrompt',
  input: {schema: ExtractAnswerKeyInputSchema},
  output: {schema: ExtractAnswerKeyOutputSchema},
  prompt: `You are an expert at extracting answers from an answer key document. Your task is to extract the question number and the corresponding correct answer from the provided PDF.

  The answer key may list answers in various formats (e.g., "1. A", "2. B", "3) C", etc.). Your job is to parse this information accurately. The 'correctAnswer' should be the letter or the option text itself. For example, if the key says "1. A) Photosynthesis", the 'correctAnswer' can be "A" or "Photosynthesis". Be consistent.

  It is critical that you extract ALL answers from the document. Carefully scan every page to ensure no answers are missed.

  Analyze the PDF document and identify the question numbers and their correct answers.

  PDF Document: {{media url=pdfDataUri}}
  `,
});

const extractAnswerKeyFlow = ai.defineFlow(
  {
    name: 'extractAnswerKeyFlow',
    inputSchema: ExtractAnswerKeyInputSchema,
    outputSchema: ExtractAnswerKeyOutputSchema,
  },
  async input => {
    const {output} = await extractAnswerKeyPrompt(input);
     if (output?.answers) {
      output.answers = output.answers.filter(a => a && a.questionNumber && a.correctAnswer);
    }
    return output!;
  }
);
