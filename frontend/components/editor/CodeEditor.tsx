"use client";

import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-zinc-500">Se incarca editorul...</div>
  ),
});

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: "cpp" | "c" | "pascal" | "python" | "plaintext";
  readOnly?: boolean;
  onRunShortcut?: () => void;
};

export function CodeEditor({ value, onChange, language, readOnly = false, onRunShortcut }: CodeEditorProps) {
  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunShortcut?.();
    });
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={value}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 22,
          padding: { top: 14, bottom: 14 },
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: "on",
          fontLigatures: true,
          cursorBlinking: "smooth",
          renderLineHighlight: "gutter",
        }}
        onChange={(nextValue) => onChange(nextValue ?? "")}
      />
    </div>
  );
}
