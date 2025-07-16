import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiProVision = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
export const geminiPro = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Converts a base64 data URI to an InlineData object for the Gemini API.
 * @param dataUri The data URI to convert.
 * @returns An object with the mimeType and data.
 */
export function dataUriToInlineData(dataUri: string) {
  const [header, data] = dataUri.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1];

  if (!mimeType || !data) {
    throw new Error("Invalid data URI format.");
  }

  return {
    inlineData: {
      mimeType,
      data,
    },
  };
}
