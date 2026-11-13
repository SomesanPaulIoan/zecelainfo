const PDF_MIME = "application/pdf";

/** Verificare în browser înainte de upload; serverul validează din nou conținutul. */
export function isAcceptedBacPdfFile(file: File): boolean {
  if (!/\.pdf$/i.test(file.name)) return false;
  if (!file.type) return true;
  return file.type === PDF_MIME;
}

export const BAC_PDF_ONLY_MESSAGE = "Poti incarca doar fisiere PDF (.pdf).";
