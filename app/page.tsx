"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { streamPoem } from "../lib/geminiClient";

// Check if content looks like HTML (has HTML tags)
function isHtml(text: string): boolean {
  // Matches common HTML tags like <div>, <p>, <h1>, <span>, etc.
  return /<[a-z][\s\S]*>/i.test(text);
}

// Extract labels from thinking content using regex
function extractLabels(content: string): string[] {
  const regex = /\*\*([^*]+)\*\*([\s\S]*?)(?=\*\*|$)/g;
  const labels: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      labels.push(match[1].trim());
    }
  }

  return labels;
}

export default function Home() {
  const [prompt, setPrompt] = useState("Write a 100-word poem. give rich text");
  const [output, setOutput] = useState("");
  const [thinkingContent, setThinkingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);

  // Extract labels from thinking content
  const extractedLabels = useMemo(() => {
    return extractLabels(thinkingContent);
  }, [thinkingContent]);

  const handleStart = async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setIsThinking(true);
    setIsThinkingExpanded(true);
    setOutput("");
    setThinkingContent("");

    try {
      let hasStartedAnswer = false;
      for await (const chunk of streamPoem(prompt)) {
        // stream characters in this chunk with a tiny delay
        console.log(chunk, `chunk`);

        if (chunk.type === "thought" && chunk.text) {
          // Stream thinking content - keep expanded
          setIsThinking(true);
          setIsThinkingExpanded(true);
          for (const char of chunk.text) {
            setThinkingContent((prev) => prev + char);
            await new Promise((resolve) => setTimeout(resolve, 5));
          }
        } else if (chunk.type === "answer" && chunk.text) {
          // Model started answering, collapse thinking section
          if (!hasStartedAnswer) {
            hasStartedAnswer = true;
            setIsThinking(false);
            setIsThinkingExpanded(false);
          }
          for (const char of chunk.text) {
            setOutput((prev) => prev + char);
            // Adjust delay (in ms) to control typing speed
            // 0–5ms keeps it feeling very fast
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }
      }
    } catch (err) {
      console.error(err);
      setOutput("Something went wrong while streaming.");
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
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

        {/* Gemini-style Thinking Section */}
        {(isThinking || thinkingContent) && extractedLabels.length > 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
            {/* Thinking Header - Clickable */}
            <button
              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span className="animate-pulse">💭</span>
              {/* Title with animated dots */}
              <div className="flex items-center gap-1 text-sm font-medium text-slate-200">
                <span>
                  {isThinking
                    ? extractedLabels[extractedLabels?.length - 1]
                    : "Show thinking"}
                </span>
                {isThinking && (
                  <span className="inline-flex ml-0.5">
                    <span className="animate-[bounce_1s_infinite_0ms] text-slate-400">
                      .
                    </span>
                    <span className="animate-[bounce_1s_infinite_200ms] text-slate-400">
                      .
                    </span>
                    <span className="animate-[bounce_1s_infinite_400ms] text-slate-400">
                      .
                    </span>
                  </span>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Chevron */}
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  isThinkingExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Collapsible Content */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isThinkingExpanded
                  ? "max-h-[300px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 pb-4">
                <div className="relative pl-4 border-l-2 border-slate-700">
                  <div className="max-h-[250px] overflow-y-auto text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      remarkPlugins={[remarkGfm]}
                    >
                      {thinkingContent || "Processing..."}
                    </ReactMarkdown>
                    {isThinking && (
                      <span className="inline-flex ml-0.5">
                        <span className="animate-[bounce_1s_infinite_0ms] text-slate-400">
                          .
                        </span>
                        <span className="animate-[bounce_1s_infinite_200ms] text-slate-400">
                          .
                        </span>
                        <span className="animate-[bounce_1s_infinite_400ms] text-slate-400">
                          .
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          isThinking && extractedLabels.length === 0 && (
          <div className="rounded-2xl overflow-hidden">
            <div className="w-full flex items-center gap-3 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <span>Thinking</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[bounce_1s_infinite_0ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[bounce_1s_infinite_200ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[bounce_1s_infinite_400ms]" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Answer Section */}
        <div className="min-h-[100px] text-sm prose prose-invert prose-sm max-w-none leading-relaxed">
          {output ? (
            isHtml(output) ? (
              // Render as raw HTML
              <div dangerouslySetInnerHTML={{ __html: output }} />
            ) : (
              // Render as Markdown
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
              >
                {output}
              </ReactMarkdown>
            )
          ) : !isStreaming ? (
            <span className="text-slate-500">Response will appear here...</span>
          ) : null}
        </div>
      </div>
    </main>
  );
}
