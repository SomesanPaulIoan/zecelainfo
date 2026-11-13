"use client";

import { useEffect, useRef } from "react";

type BlocklyPseudocodeEditorProps = {
  value?: string;
  blocklyXml?: string;
  onChange: (payload: { blocklyXml: string; generatedCpp: string; pseudocode?: string }) => void;
  readOnly?: boolean;
};

export function BlocklyPseudocodeEditor({ value = "", blocklyXml = "", onChange, readOnly = false }: BlocklyPseudocodeEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "blockly-bac-update") return;
      onChange({
        blocklyXml: String(event.data.blocklyXml ?? ""),
        generatedCpp: String(event.data.generatedCpp ?? ""),
        pseudocode: String(event.data.pseudo ?? event.data.pseudocode ?? ""),
      });
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onChange]);

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    const send = () => {
      if (blocklyXml?.trim()) {
        frame.contentWindow?.postMessage({ type: "blockly-bac-load-xml", blocklyXml }, "*");
      } else {
        frame.contentWindow?.postMessage({ type: "blockly-bac-request-sync" }, "*");
      }
    };
    frame.addEventListener("load", send);
    send();
    return () => frame.removeEventListener("load", send);
  }, [blocklyXml]);

  return (
    <div className="space-y-2">
      <iframe
        ref={iframeRef}
        src="/blockly-bac/index.html"
        title="Editor pseudocod Blockly"
        className="h-[520px] w-full rounded-xl border border-zinc-300 bg-white"
        sandbox="allow-scripts allow-same-origin"
      />
      {readOnly ? null : (
        <p className="text-xs text-zinc-500">
          Modifica blocurile — pseudocodul si C++ se sincronizeaza automat. C++ curent: {value ? `${value.length} caractere` : "gol"}
        </p>
      )}
    </div>
  );
}
