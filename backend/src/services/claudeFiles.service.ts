import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";

export const MAX_CLAUDE_FILE_BYTES = 30 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".xml",
  ".html",
  ".css",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".h",
  ".hpp",
  ".pas",
  ".cs",
  ".go",
  ".rs",
  ".sql",
  ".yaml",
  ".yml",
  ".zip",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const PDF_EXTENSIONS = new Set([".pdf"]);
const CODE_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".xml",
  ".html",
  ".css",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".h",
  ".hpp",
  ".pas",
  ".cs",
  ".go",
  ".rs",
  ".sql",
  ".yaml",
  ".yml",
]);

export type ClaudeFileCategory = "image" | "pdf" | "code" | "archive" | "other";

export function getClaudeFilesUploadDir(): string {
  return (
    process.env.CLAUDE_FILES_UPLOAD_DIR?.trim() ||
    path.resolve(process.cwd(), "../claude-files")
  );
}

export function getClaudeFilesWorkspacePath(storedName: string): string {
  return `Zece la Info/claude-files/${storedName}`;
}

export function decodeUploadBase64(raw: string): { buffer: Buffer; declaredMime: string | null } {
  const trimmed = raw.trim();
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/is.exec(trimmed);
  if (dataUrlMatch) {
    return { buffer: Buffer.from(dataUrlMatch[2], "base64"), declaredMime: dataUrlMatch[1].trim().toLowerCase() };
  }
  const content = trimmed.includes(",") ? (trimmed.split(",").pop() ?? "") : trimmed;
  return { buffer: Buffer.from(content, "base64"), declaredMime: null };
}

export function sanitizeClaudeFileName(fileName: string): string {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!base || base === "." || base === "..") {
    throw new Error("Numele fisierului este invalid.");
  }
  const ext = path.extname(base).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(
      "Tip de fisier nepermis. Acceptate: imagini, PDF, cod sursa, text, arhive ZIP.",
    );
  }
  return base;
}

export function detectClaudeFileCategory(fileName: string): ClaudeFileCategory {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (PDF_EXTENSIONS.has(ext)) return "pdf";
  if (ext === ".zip") return "archive";
  if (CODE_EXTENSIONS.has(ext)) return "code";
  return "other";
}

export function validateClaudeFileBuffer(fileName: string, buffer: Buffer): string {
  const safeName = sanitizeClaudeFileName(fileName);
  if (buffer.length === 0) {
    throw new Error("Fisierul este gol.");
  }
  if (buffer.length > MAX_CLAUDE_FILE_BYTES) {
    throw new Error("Fisierul depaseste limita de 30 MB.");
  }

  const ext = path.extname(safeName).toLowerCase();
  if (PDF_EXTENSIONS.has(ext) && buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Fisierul nu este un PDF valid.");
  }

  return safeName;
}

export function buildStoredClaudeFileName(originalName: string): string {
  const safeOriginal = sanitizeClaudeFileName(originalName);
  const ext = path.extname(safeOriginal);
  const stem = path.basename(safeOriginal, ext).slice(0, 80) || "fisier";
  return `${stem}-${randomUUID().slice(0, 8)}${ext}`;
}

export async function persistClaudeFile(storedName: string, buffer: Buffer): Promise<string> {
  const uploadsDir = getClaudeFilesUploadDir();
  await fs.mkdir(uploadsDir, { recursive: true });
  const outputPath = path.join(uploadsDir, storedName);
  await fs.writeFile(outputPath, buffer);
  return outputPath;
}

export async function removeClaudeFileFromDisk(filePath: string | null | undefined): Promise<void> {
  if (!filePath?.trim()) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

export async function readClaudeFileFromDisk(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}
