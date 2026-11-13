"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// CSS-ul KaTeX (~23 KB gzip) se incarca doar pe paginile care afiseaza formule, nu global.
import "katex/dist/katex.min.css";

type MarkdownLatexContentProps = {
  content: string;
  className?: string;
};

function normalizeMathDelimiters(input: string) {
  let text = input;
  // Convert LaTeX delimiters \(..\), \[..\] to remark-math delimiters.
  text = text.replace(/\\\(/g, "$").replace(/\\\)/g, "$");
  text = text.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");

  // Common model artifact: (( ... )) used as inline math.
  text = text.replace(
    /\(\(([^()\n]{1,200})\)\)/g,
    (_match, expr: string) => {
      const looksMathy = /[\\^_=<>+\-*/]|\\[a-zA-Z]+|[0-9]/.test(expr);
      return looksMathy ? `$${expr.trim()}$` : `(( ${expr} ))`;
    },
  );

  // Common artifact: (x) for tiny math symbols - single token only, no spaces,
  // so parenthetical remarks in plain prose (e.g. "(indexata de la 0)") are left untouched.
  text = text.replace(
    /\(([a-zA-Z0-9_][a-zA-Z0-9_\\^]{0,20})\)/g,
    (match: string, expr: string, offset: number, source: string) => {
      // Avoid breaking notation like O(n), f(x), g(a,b)-style usages
      // where parentheses are already semantically correct in plain text.
      const prevChar = offset > 0 ? source[offset - 1] : "";
      if (/[A-Za-z0-9_]/.test(prevChar)) return match;
      return `$${expr.trim()}$`;
    },
  );
  return text;
}

export function MarkdownLatexContent({ content, className }: MarkdownLatexContentProps) {
  const normalizedContent = normalizeMathDelimiters(content);
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>,
          code: ({ className: codeClass, children }) => {
            const text = String(children);
            const isBlock = Boolean(codeClass);
            if (isBlock) {
              return (
                <code
                  className={`${codeClass} block overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800`}
                >
                  {text}
                </code>
              );
            }
            return <code className="rounded bg-slate-100 px-1 py-0.5 text-sm text-slate-800">{text}</code>;
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
