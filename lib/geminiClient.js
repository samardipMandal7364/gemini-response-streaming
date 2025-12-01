import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "NEXT_PUBLIC_GEMINI_API_KEY is not set. Streaming will not work without it."
  );
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

export async function* streamPoem(prompt) {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-pro-preview-05-06",
    candidateCount: 1,
    maxOutputTokens: 200,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  for await (const chunk of response) {
    // `chunk.text` is a convenience accessor in the Node SDK; defensively handle missing text.
    const text = chunk.text ?? "";
    if (text) {
      yield text;
    }
  }
}
