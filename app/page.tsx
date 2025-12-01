"use client";

import { useState } from "react";
import { Streamdown } from "@phaserjs/streamdown-lite";
import { streamPoem } from "../lib/geminiClient";

export default function Home() {
  const [prompt, setPrompt] = useState("Write a 100-word poem. give rich text");
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStart = async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setOutput("");

    try {
      for await (const chunk of streamPoem(prompt)) {
        // stream characters in this chunk with a tiny delay
        console.log(chunk, `chunk`);

        for (const char of chunk) {
          setOutput((prev) => prev + char);
          // Adjust delay (in ms) to control typing speed
          // 0–5ms keeps it feeling very fast
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } catch (err) {
      console.error(err);
      setOutput("Something went wrong while streaming.");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Gemini Streaming Demo
        </h1>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <button
          onClick={handleStart}
          disabled={isStreaming}
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isStreaming ? "Streaming..." : "Start Streaming"}
        </button>

        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-300">Stream</div>
          <div className="min-h-[160px] rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
            {output ? (
              <Streamdown>{output}</Streamdown>
            ) : (
              "Response will appear here..."
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
