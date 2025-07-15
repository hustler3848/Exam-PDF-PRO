'use server';

/**
 * @fileOverview A quiz question extraction AI agent.
 *
 * - extractQuizQuestions - A function that handles the quiz question extraction process.
 * - ExtractQuizQuestionsInput - The input type for the extractQuizQuestions function.
 * - ExtractQuizQuestionsOutput - The return type for the extractQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractQuizQuestionsInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document containing quiz questions, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractQuizQuestionsInput = z.infer<typeof ExtractQuizQuestionsInputSchema>;

const QuizQuestionSchema = z.object({
  questionNumber: z.number().describe('The question number.'),
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('The possible answer options for the question.'),
});

const ExtractQuizQuestionsOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The extracted quiz questions.'),
});
export type ExtractQuizQuestionsOutput = z.infer<typeof ExtractQuizQuestionsOutputSchema>;

export async function extractQuizQuestions(input: ExtractQuizQuestionsInput): Promise<ExtractQuizQuestionsOutput> {
  return extractQuizQuestionsFlow(input);
}

const extractQuizQuestionsPrompt = ai.definePrompt({
  name: 'extractQuizQuestionsPrompt',
  input: {schema: ExtractQuizQuestionsInputSchema},
  output: {schema: ExtractQuizQuestionsOutputSchema},
  prompt: `You are an expert quiz question extractor. Your task is to extract quiz questions and their multiple-choice options from a PDF document.

  It is critical that you extract ALL questions from the document. Carefully scan every page to ensure no questions are missed. Do NOT extract the correct answers, only the questions and the options.

  IMPORTANT: If you encounter any mathematical equations or symbols (like fractions, integrals, summations, greek letters, etc.), you MUST format them using LaTeX. For inline mathematics, wrap the expression in single dollar signs ($...$). For block-level or display mathematics, wrap the expression in double dollar signs ($$...$$).

  Analyze the PDF document and identify the questions, question numbers, and options.

  PDF Document: {{media url=pdfDataUri}}
  `,
});

const extractQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'extractQuizQuestionsFlow',
    inputSchema: ExtractQuizQuestionsInputSchema,
    outputSchema: ExtractQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await extractQuizQuestionsPrompt(input);
    if (output?.questions) {
      // Filter out any empty objects that the model might return.
      output.questions = output.questions.filter(q => q.questionNumber && q.questionText && q.options);
    }
    return output!;
  }
);
