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
      "A PDF document containing quiz questions and an answer key, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractQuizQuestionsInput = z.infer<typeof ExtractQuizQuestionsInputSchema>;

const QuizQuestionSchema = z.object({
  questionNumber: z.number().describe('The question number.'),
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('The possible answer options for the question.'),
  correctAnswer: z.string().describe('The correct answer for the question.'),
});

const ExtractQuizQuestionsOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The extracted quiz questions.'),
  accuracyAssessment: z.string().describe('An assessment of the accuracy of the extracted questions.'),
});
export type ExtractQuizQuestionsOutput = z.infer<typeof ExtractQuizQuestionsOutputSchema>;

export async function extractQuizQuestions(input: ExtractQuizQuestionsInput): Promise<ExtractQuizQuestionsOutput> {
  return extractQuizQuestionsFlow(input);
}

const extractQuizQuestionsPrompt = ai.definePrompt({
  name: 'extractQuizQuestionsPrompt',
  input: {schema: ExtractQuizQuestionsInputSchema},
  output: {schema: ExtractQuizQuestionsOutputSchema},
  prompt: `You are an expert quiz question extractor. Your task is to extract quiz questions, answer options, and correct answers from a PDF document.

  Analyze the PDF document and identify the questions, question numbers, options, and correct answers. Pay close attention to the formatting and structure of the document to accurately extract the information. Also evaluate the accuracy of the extracted questions and generate an accuracy assessment.

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
    return output!;
  }
);
