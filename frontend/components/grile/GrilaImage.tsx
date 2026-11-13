"use client";

import { useEffect, useState } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export function GrilaImage({ src, alt, className = "" }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full cursor-zoom-in rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        aria-label={`Marire imagine: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className={`mx-auto w-full rounded-2xl border border-sky-200 object-contain ${className}`}
        />
      </button>

      {lightboxOpen ? (
        <ModalPortal>
          <button
            type="button"
            className="fixed inset-0 z-[100] flex cursor-default items-center justify-center border-0 bg-black/75 p-0"
            aria-label="Inchide imagine marita"
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={src}
              alt=""
              aria-hidden
              className="pointer-events-none max-h-[100dvh] w-full select-none object-contain sm:max-h-[90vh] sm:w-[90vw] sm:rounded-lg"
            />
          </button>
        </ModalPortal>
      ) : null}
    </>
  );
}
