import path from "node:path";
import { promises as fs } from "node:fs";
export const MAX_COURSE_RESOURCES_ZIP_BYTES = 30 * 1024 * 1024;

export function getCourseResourcesUploadDir(): string {
  return (
    process.env.COURSE_RESOURCES_UPLOAD_DIR?.trim() ||
    path.resolve(process.cwd(), "storage/course-resources")
  );
}

export function decodeUploadBase64(raw: string): Buffer {
  const trimmed = raw.trim();
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/is.exec(trimmed);
  if (dataUrlMatch) {
    return Buffer.from(dataUrlMatch[2], "base64");
  }
  const content = trimmed.includes(",") ? (trimmed.split(",").pop() ?? "") : trimmed;
  return Buffer.from(content, "base64");
}

export function sanitizeZipFileName(fileName: string): string {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!base || !/\.zip$/i.test(base)) {
    throw new Error("Doar fisiere ZIP sunt permise.");
  }
  return base;
}

export function validateZipBuffer(buffer: Buffer): void {
  if (buffer.length < 4) {
    throw new Error("Arhiva ZIP este goala sau invalida.");
  }
  if (buffer.length > MAX_COURSE_RESOURCES_ZIP_BYTES) {
    throw new Error("Arhiva ZIP depaseste limita de 30 MB.");
  }
  const signature = buffer.subarray(0, 4).toString("ascii");
  if (signature !== "PK\x03\x04" && signature !== "PK\x05\x06" && signature !== "PK\x07\x08") {
    throw new Error("Fisierul nu este o arhiva ZIP valida.");
  }
}

export async function persistCourseResourcesZip(courseId: string, buffer: Buffer): Promise<string> {
  const uploadsDir = getCourseResourcesUploadDir();
  await fs.mkdir(uploadsDir, { recursive: true });
  const outputPath = path.join(uploadsDir, `${courseId}.zip`);
  await fs.writeFile(outputPath, buffer);
  return outputPath;
}

export async function removeCourseResourcesZipFile(filePath: string | null | undefined): Promise<void> {
  if (!filePath?.trim()) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

export function buildStoredZipFileName(courseSlug: string, originalName: string): string {
  const safeOriginal = sanitizeZipFileName(originalName);
  const slugPart = courseSlug.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  if (safeOriginal.toLowerCase().startsWith(slugPart.toLowerCase())) {
    return safeOriginal;
  }
  return `${slugPart}-resurse.zip`;
}

export function newCourseResourcesStoragePath(courseId: string): string {
  return path.join(getCourseResourcesUploadDir(), `${courseId}.zip`);
}

export async function readCourseResourcesZip(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}
