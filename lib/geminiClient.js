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
    model: "gemini-3-pro-preview",
    candidateCount: 1,
    maxOutputTokens: 200,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: "high",
      },
    },
  });

  let thoughts = "";
  let answer = "";

  for await (const chunk of response) {
    if (!chunk.candidates?.[0]?.content?.parts) {
      continue;
    }

    for (const part of chunk.candidates[0].content.parts) {
      if (!part.text) {
        continue;
      } else if (part.thought) {
        if (!thoughts) {
          console.log("Thoughts summary:");
        }
        console.log(part.text,"thoughts");
        thoughts = thoughts + part.text;
        yield { type: "thought", text: part.text };
      } else {
        if (!answer) {
          console.log("Answer:");
        }
        console.log(part.text);
        answer = answer + part.text;
        yield { type: "answer", text: part.text };
      }
    }
  }
}
