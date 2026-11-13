import Link from "next/link";
import { BacPdfScrollViewer } from "@/components/bac/BacPdfScrollViewer";

type BacPdfPreviewProps = {
  src: string;
  title: string;
  fileName?: string | null;
  hint?: string;
};

export function BacPdfPreview({ src, title, fileName, hint }: BacPdfPreviewProps) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-emerald-900">
          {hint ?? "Previzualizare rezolvare"}
          {fileName ? <span className="font-normal text-emerald-800"> — {fileName}</span> : null}
        </p>
        <Link
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-50"
        >
          Deschide in tab nou
        </Link>
      </div>
      <BacPdfScrollViewer src={src} title={title} maxHeightClass="max-h-[min(72dvh,640px)]" />
    </div>
  );
}
