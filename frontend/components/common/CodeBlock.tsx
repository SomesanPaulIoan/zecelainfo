"use client";

import { useEffect, useState } from "react";
import { createJavaScriptRegexEngine, getSingletonHighlighter } from "shiki";

const THEME = "github-dark";

const highlighterPromise = getSingletonHighlighter({
  themes: [THEME],
  langs: ["cpp", "python"],
  engine: createJavaScriptRegexEngine(),
});

export function CodeBlock({ code, language }: { code: string; language: "cpp" | "python" }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlighterPromise.then((highlighter) => {
      if (cancelled) return;
      setHtml(highlighter.codeToHtml(code, { lang: language, theme: THEME }));
    });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (!html) {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap break-words bg-zinc-950 p-3.5 font-mono text-xs leading-6 text-zinc-100">
        {code}
      </pre>
    );
  }

  return (
    <div
      className="shiki-scope overflow-x-auto bg-zinc-950 p-3.5 text-xs leading-6 [&_code]:font-mono [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
