import path from "node:path";
import { promises as fs } from "node:fs";
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";
import { decodeUploadBase64 } from "./courseResources.service";

export const MAX_GRILA_QUESTION_IMAGE_BYTES = 15 * 1024 * 1024;
export const GRILA_IMAGE_WIDTH = 1000;
export const GRILA_IMAGE_HEIGHT = 700;

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const WATERMARK_TEXT = "zecelainfo.ro";

export function getGrileQuestionsUploadDir(): string {
  return (
    process.env.GRILE_QUESTIONS_UPLOAD_DIR?.trim() ||
    path.resolve(process.cwd(), "storage/grile-questions")
  );
}

export function sanitizeQuestionImageFileName(fileName: string): string {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const match = /\.([a-zA-Z0-9]+)$/.exec(base);
  const ext = (match?.[1] ?? "png").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("Format imagine neacceptat. Foloseste PNG, JPG, WEBP sau GIF.");
  }
  return ext === "jpeg" ? "jpg" : ext;
}

export function detectImageExtension(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (buffer.length >= 6 && buffer.subarray(0, 6).toString("ascii") === "GIF87a") {
    return "gif";
  }
  if (buffer.length >= 6 && buffer.subarray(0, 6).toString("ascii") === "GIF89a") {
    return "gif";
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }
  throw new Error("Fisierul nu este o imagine valida (PNG, JPG, WEBP sau GIF).");
}

export function validateQuestionImageBuffer(buffer: Buffer, declaredExt: string): string {
  if (buffer.length > MAX_GRILA_QUESTION_IMAGE_BYTES) {
    throw new Error("Imaginea depaseste limita de 15 MB.");
  }
  const detected = detectImageExtension(buffer);
  const normalizedDeclared = declaredExt === "jpeg" ? "jpg" : declaredExt;
  if (normalizedDeclared !== detected) {
    throw new Error("Extensia fisierului nu corespunde continutului imaginii.");
  }
  return detected;
}

/** Randare PNG cu text real (fara SVG/font lipsa in Docker). */
function buildWatermarkPng(width: number, height: number): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Diagonala: colt stanga-jos -> dreapta-sus; watermark la mijlocul diagonalei.
  const angle = Math.atan2(-height, width);
  const centerX = width / 2;
  const centerY = height / 2;
  const fontSize = Math.round(width * 0.09);

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.font = `700 ${fontSize}px DejaVu Sans, Liberation Sans, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(15, 23, 42, 0.14)";
  ctx.fillText(WATERMARK_TEXT, 0, 0);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

/** Fit image into 1000x700 without distortion, white letterbox, single diagonal watermark. */
export async function processGrilaScreenshot(buffer: Buffer): Promise<Buffer> {
  const fitted = await sharp(buffer)
    .rotate()
    .resize(GRILA_IMAGE_WIDTH, GRILA_IMAGE_HEIGHT, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  const watermark = buildWatermarkPng(GRILA_IMAGE_WIDTH, GRILA_IMAGE_HEIGHT);

  return sharp(fitted)
    .composite([{ input: watermark, blend: "over" }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

export async function removeQuestionImageFiles(questionId: string): Promise<void> {
  const dir = getGrileQuestionsUploadDir();
  for (const ext of ["jpg", "png", "webp", "gif"]) {
    const filePath = path.join(dir, `${questionId}.${ext}`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
    }
  }
}

export async function persistQuestionImage(questionId: string, buffer: Buffer, _ext?: string): Promise<string> {
  const uploadsDir = getGrileQuestionsUploadDir();
  await fs.mkdir(uploadsDir, { recursive: true });
  await removeQuestionImageFiles(questionId);
  const processed = await processGrilaScreenshot(buffer);
  const outputPath = path.join(uploadsDir, `${questionId}.jpg`);
  await fs.writeFile(outputPath, processed);
  return `/uploads/grile-questions/${questionId}.jpg`;
}

export function parseQuestionImageUpload(fileName: string, fileBase64: string): { buffer: Buffer; ext: string } {
  const ext = sanitizeQuestionImageFileName(fileName);
  const buffer = decodeUploadBase64(fileBase64);
  const detectedExt = validateQuestionImageBuffer(buffer, ext);
  return { buffer, ext: detectedExt };
}
