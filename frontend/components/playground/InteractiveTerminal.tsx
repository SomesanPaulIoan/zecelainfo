"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { PlaygroundFile, PlaygroundLanguage } from "@/lib/api";

export type TerminalStatus = "idle" | "connecting" | "running" | "exited" | "compile_error" | "error" | "timeout";

export type InteractiveTerminalHandle = {
  run: () => void;
};

type Props = {
  language: PlaygroundLanguage | null;
  code: string;
  files: PlaygroundFile[];
  activeFileName: string;
  onFilesProduced: (files: PlaygroundFile[]) => void;
  onStatusChange: (status: TerminalStatus, detail?: { timeMs?: number; exitCode?: number }) => void;
};

function resolveWsUrl(): string {
  const rawPublic = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (rawPublic && !rawPublic.startsWith("http://localhost")) {
    return `${rawPublic.replace(/^http/, "ws")}/api/playground/interactive`;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/playground/interactive`;
}

export const InteractiveTerminal = forwardRef<InteractiveTerminalHandle, Props>(function InteractiveTerminal(
  { language, code, files, activeFileName, onFilesProduced, onStatusChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitAddonRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const finalizedRef = useRef(false);
  const propsRef = useRef({ language, code, files, activeFileName });
  propsRef.current = { language, code, files, activeFileName };

  useEffect(() => {
    let disposed = false;

    void Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]).then(([{ Terminal }, { FitAddon }]) => {
      if (disposed || !containerRef.current) return;
      const term = new Terminal({
        convertEol: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', Menlo, Consolas, monospace",
        theme: {
          background: "#18181b",
          foreground: "#e4e4e7",
          cursor: "#38bdf8",
          selectionBackground: "#38bdf855",
        },
        cursorBlink: true,
        scrollback: 5000,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();
      term.writeln("\x1b[90m// Apasa Ruleaza (sau Ctrl/Cmd + Enter) pentru a porni sesiunea.\x1b[0m");

      term.onData((data) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "stdin", data }));
        }
      });

      termRef.current = term;
      fitAddonRef.current = fitAddon;

      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
        }
      });
      resizeObserver.observe(containerRef.current);

      (term as unknown as { __resizeObserver?: ResizeObserver }).__resizeObserver = resizeObserver;
    });

    return () => {
      disposed = true;
      wsRef.current?.close();
      wsRef.current = null;
      const term = termRef.current;
      if (term) {
        (term as unknown as { __resizeObserver?: ResizeObserver }).__resizeObserver?.disconnect();
        term.dispose();
      }
      termRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    run: () => {
      const term = termRef.current;
      if (!term) return;
      wsRef.current?.close();
      finalizedRef.current = false;

      const { language: lang, code: currentCode, files: currentFiles, activeFileName: fileName } = propsRef.current;

      term.reset();

      if (!lang) {
        term.writeln(
          `\x1b[31mExtensia fisierului "${fileName}" nu e suportata pentru rulare (foloseste .cpp, .c, .pas sau .py).\x1b[0m`,
        );
        onStatusChange("error");
        return;
      }

      term.writeln(`\x1b[90m$ ./${fileName}\x1b[0m`);
      onStatusChange("connecting");

      const ws = new WebSocket(resolveWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "start",
            language: lang,
            code: currentCode,
            files: currentFiles,
            cols: term.cols,
            rows: term.rows,
          }),
        );
      };

      ws.onmessage = (event) => {
        let msg: { type: string; [key: string]: unknown };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case "started":
            onStatusChange("running");
            break;
          case "output":
            term.write(String(msg.data ?? ""));
            break;
          case "compile_error":
            term.write(`\x1b[31m${String(msg.stderr ?? "").replace(/\n/g, "\r\n")}\x1b[0m\r\n`);
            finalizedRef.current = true;
            onStatusChange("compile_error");
            break;
          case "exit": {
            finalizedRef.current = true;
            const exitCode = Number(msg.exitCode ?? 0);
            const timeMs = Number(msg.timeMs ?? 0);
            const color = exitCode === 0 ? "32" : "33";
            term.write(`\r\n\r\n\x1b[${color}m[proces terminat cu codul ${exitCode} - ${timeMs} ms]\x1b[0m\r\n`);
            onStatusChange("exited", { timeMs, exitCode });
            break;
          }
          case "files":
            onFilesProduced((msg.files as PlaygroundFile[]) ?? []);
            break;
          case "error":
            finalizedRef.current = true;
            term.write(`\x1b[31m${String(msg.message ?? "Eroare")}\x1b[0m\r\n`);
            onStatusChange("error");
            break;
          case "timeout":
            finalizedRef.current = true;
            term.write(`\x1b[33m[sesiune oprita - timp maxim atins]\x1b[0m\r\n`);
            onStatusChange("timeout");
            break;
          default:
            break;
        }
      };

      ws.onclose = () => {
        if (!finalizedRef.current) {
          term.write(`\x1b[31m[conexiune inchisa]\x1b[0m\r\n`);
          onStatusChange("error");
        }
      };

      ws.onerror = () => {
        if (!finalizedRef.current) {
          finalizedRef.current = true;
          term.write(`\x1b[31m[nu am putut contacta serverul de compilare]\x1b[0m\r\n`);
          onStatusChange("error");
        }
      };
    },
  }));

  return <div ref={containerRef} className="h-full w-full p-2" />;
});
