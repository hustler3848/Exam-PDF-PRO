
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
  output: {
    format: 'json',
  },
  prompt: `You are an expert exam question extractor. Your task is to extract exam questions and their multiple-choice options from a PDF document. Your output MUST be a JSON object with a single key "questions" that contains an array of question objects. Each question object must have "questionNumber" (number), "questionText" (string), and "options" (array of strings).

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
    const parsedOutput = output as ExtractExamQuestionsOutput;

    if (parsedOutput?.questions) {
      // Filter out any empty or incomplete objects that the model might return.
      parsedOutput.questions = parsedOutput.questions.filter(q => q && q.questionNumber && q.questionText && Array.isArray(q.options));
    }
    
    // Final validation to ensure the data conforms to the schema before returning
    const validatedOutput = ExtractExamQuestionsOutputSchema.safeParse(parsedOutput);
    if (!validatedOutput.success) {
      console.error("Final validation failed:", validatedOutput.error);
      throw new Error("Failed to extract valid questions from the PDF.");
    }

    return validatedOutput.data;
  }
);
