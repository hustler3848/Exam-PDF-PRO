
'use server';

/**
 * @fileOverview A exam question extraction AI agent.
 */
import { geminiProVision, dataUriToInlineData } from "@/ai/gemini";
import { z } from "zod";

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
  const prompt = `You are an expert exam question extractor. Your task is to extract exam questions and their multiple-choice options from a PDF document. Your output MUST be a JSON object that matches this schema: ${JSON.stringify(ExtractExamQuestionsOutputSchema.jsonSchema)}.

  It is critical that you extract ALL questions from the document. Carefully scan every page to ensure no questions are missed. Do NOT extract the correct answers, only the questions and the options.

  IMPORTANT: If you encounter any mathematical equations or symbols (like fractions, integrals, summations, greek letters, etc.), you MUST format them using LaTeX. For inline mathematics, wrap the expression in single dollar signs ($...$). For block-level or display mathematics, wrap the expression in double dollar signs ($$...$$).

  Analyze the PDF document and identify the questions, question numbers, and options.
  `;
  
  const pdfPart = dataUriToInlineData(input.pdfDataUri);

  const result = await geminiProVision.generateContent([prompt, pdfPart]);
  const response = await result.response;
  const text = response.text();

  try {
    // Clean up the response to get just the JSON part
    const jsonText = text.replace('```json', '').replace('```', '').trim();
    if (!jsonText) {
      throw new Error("The AI returned an empty response. Please check the PDF file or try again.");
    }
    const parsed = JSON.parse(jsonText);

    // Filter out any empty or incomplete objects that the model might return.
    if (parsed.questions) {
      parsed.questions = parsed.questions.filter((q: any) => 
        q && q.questionNumber && q.questionText && Array.isArray(q.options)
      );
    }

    const validated = ExtractExamQuestionsOutputSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Final validation failed:", validated.error);
      throw new Error("Failed to extract valid questions from the PDF.");
    }

    return validated.data;
  } catch (e: any) {
    console.error("Error parsing AI response:", e);
    console.error("Raw text from AI:", text);
    throw new Error("The AI returned an invalid response. Could not parse the exam questions.");
  }
}
