"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type BacPdfScrollViewerProps = {
  src: string;
  title: string;
  /** Tailwind max-height class for the scroll area, e.g. `max-h-[78dvh]`. */
  maxHeightClass?: string;
};

type PdfPage = {
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }): { promise: Promise<void> };
  getViewport(params: { scale: number }): { width: number; height: number };
};

type PdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
};

type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(params: { url: string; withCredentials?: boolean }): { promise: Promise<PdfDocument> };
};

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
  }
}

const PDFJS_VERSION = "3.11.174";

let pdfJsLoader: Promise<PdfJsLib> | null = null;

function loadPdfJsFromCdn(): Promise<PdfJsLib> {
  if (pdfJsLoader) return pdfJsLoader;

  pdfJsLoader = new Promise<PdfJsLib>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("PDF.js is only available in the browser."));
      return;
    }

    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    script.async = true;
    script.onload = () => {
      const pdfjs = window.pdfjsLib;
      if (!pdfjs) {
        reject(new Error("PDF.js nu s-a incarcat corect."));
        return;
      }
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
      resolve(pdfjs);
    };
    script.onerror = () => reject(new Error("Nu am putut incarca motorul PDF."));
    document.head.appendChild(script);
  });

  return pdfJsLoader;
}

export function BacPdfScrollViewer({ src, title, maxHeightClass = "max-h-[78dvh]" }: BacPdfScrollViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const renderedCanvases: HTMLCanvasElement[] = [];

    const renderPdf = async () => {
      setLoading(true);
      setError(null);
      setPageCount(0);
      container.replaceChildren();

      try {
        const pdfjs = await loadPdfJsFromCdn();
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ url: src, withCredentials: true }).promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);
        const containerWidth = container.clientWidth > 0 ? container.clientWidth : 768;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNumber);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(2, Math.max(1, (containerWidth - 8) / baseViewport.width));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mx-auto block w-full max-w-full bg-white";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `${title} — pagina ${pageNumber}`);

          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Nu am putut initializa previzualizarea PDF.");
          }

          await page.render({ canvasContext: context, viewport }).promise;
          if (cancelled) return;

          const wrapper = document.createElement("div");
          wrapper.className = pageNumber < pdf.numPages ? "border-b border-sky-100 bg-white" : "bg-white";
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          renderedCanvases.push(canvas);
        }
      } catch (renderError) {
        if (!cancelled) {
          setError(renderError instanceof Error ? renderError.message : "Nu am putut incarca PDF-ul.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;
      for (const canvas of renderedCanvases) {
        canvas.width = 0;
        canvas.height = 0;
      }
      container.replaceChildren();
    };
  }, [src, title]);

  return (
    <div className="mt-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-600">
          {loading ? "Se incarca PDF-ul..." : pageCount > 0 ? `${pageCount} pagini — deruleaza in zona de mai jos` : "Previzualizare PDF"}
        </p>
        <Link
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-50"
        >
          Deschide in tab nou
        </Link>
      </div>
      <div
        className={`overflow-y-auto overscroll-y-contain rounded-xl border border-sky-100 bg-zinc-100 [-webkit-overflow-scrolling:touch] touch-pan-y ${maxHeightClass}`}
      >
        <div ref={containerRef} className="min-h-[12rem]" />
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-600">Se pregatesc paginile subiectului...</p>
        ) : null}
        {error ? (
          <div className="space-y-3 px-4 py-6 text-center">
            <p className="text-sm text-rose-700">{error}</p>
            <Link
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-50"
            >
              Deschide PDF-ul in tab nou
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
