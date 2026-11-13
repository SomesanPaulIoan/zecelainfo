import { promises as fs } from "node:fs";
import path from "node:path";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function getBacExamImagesUploadDir() {
  return (
    process.env.BAC_EXAM_IMAGES_UPLOAD_DIR?.trim() ||
    path.resolve(process.cwd(), "../frontend/public/uploads/bac-exam")
  );
}

function decodeBase64(raw: string): { buffer: Buffer; mime: string | null } {
  const trimmed = raw.trim();
  const match = /^data:([^;]+);base64,(.+)$/is.exec(trimmed);
  if (match) {
    return { buffer: Buffer.from(match[2], "base64"), mime: match[1].trim().toLowerCase() };
  }
  const content = trimmed.includes(",") ? (trimmed.split(",").pop() ?? "") : trimmed;
  return { buffer: Buffer.from(content, "base64"), mime: null };
}

export async function saveBacExamImage(fileName: string, fileBase64: string): Promise<string> {
  const trimmed = fileBase64.trim();
  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  const { buffer, mime } = decodeBase64(trimmed);
  if (buffer.length < 10) throw new Error("Imagine invalida.");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Imaginea depaseste 8 MB.");

  const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = path.extname(safeName).toLowerCase();
  const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
  if (!allowed.includes(ext)) {
    throw new Error("Format imagine neacceptat (png, jpg, webp, gif).");
  }
  if (mime && !mime.startsWith("image/")) {
    throw new Error("Fisierul nu este o imagine.");
  }

  const uploadsDir = getBacExamImagesUploadDir();
  await fs.mkdir(uploadsDir, { recursive: true });
  const unique = `${Date.now()}_${safeName}`;
  await fs.writeFile(path.join(uploadsDir, unique), buffer);
  return `/uploads/bac-exam/${unique}`;
}
