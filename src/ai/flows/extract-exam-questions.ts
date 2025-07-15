
'use server';

/**
 * @fileOverview A exam question extraction AI agent.
 *
 * - extractExamQuestions - A function that handles the exam question extraction process.
 * - ExtractExamQuestionsInput - The input type for the extractExamQuestions function.
 * - ExtractExamQuestionsOutput - The return type for the extractExamQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractExamQuestionsInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document containing exam questions, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractExamQuestionsInput = z.infer<typeof ExtractExamQuestionsInputSchema>;

const ExamQuestionSchema = z.object({
  questionNumber: z.number().describe('The question number.'),
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('The possible answer options for the question.'),
});

const ExtractExamQuestionsOutputSchema = z.object({
  questions: z.array(ExamQuestionSchema).describe('The extracted exam questions.'),
});
export type ExtractExamQuestionsOutput = z.infer<typeof ExtractExamQuestionsOutputSchema>;

export async function extractExamQuestions(input: ExtractExamQuestionsInput): Promise<ExtractExamQuestionsOutput> {
  return extractExamQuestionsFlow(input);
}

const extractExamQuestionsPrompt = ai.definePrompt({
  name: 'extractExamQuestionsPrompt',
  input: {schema: ExtractExamQuestionsInputSchema},
  output: {schema: ExtractExamQuestionsOutputSchema},
  prompt: `You are an expert exam question extractor. Your task is to extract exam questions and their multiple-choice options from a PDF document.

  It is critical that you extract ALL questions from the document. Carefully scan every page to ensure no questions are missed. Do NOT extract the correct answers, only the questions and the options.

  IMPORTANT: If you encounter any mathematical equations or symbols (like fractions, integrals, summations, greek letters, etc.), you MUST format them using LaTeX. For inline mathematics, wrap the expression in single dollar signs ($...$). For block-level or display mathematics, wrap the expression in double dollar signs ($$...$$).

  Analyze the PDF document and identify the questions, question numbers, and options.

  PDF Document: {{media url=pdfDataUri}}
  `,
});

const extractExamQuestionsFlow = ai.defineFlow(
  {
    name: 'extractExamQuestionsFlow',
    inputSchema: ExtractExamQuestionsInputSchema,
    outputSchema: ExtractExamQuestionsOutputSchema,
  },
  async input => {
    const {output} = await extractExamQuestionsPrompt(input);
    if (output?.questions) {
      // Filter out any empty or incomplete objects that the model might return.
      output.questions = output.questions.filter(q => q && q.questionNumber && q.questionText && q.options);
    }
    return output!;
  }
);
