import { Router, type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  buildStoredClaudeFileName,
  decodeUploadBase64,
  detectClaudeFileCategory,
  getClaudeFilesWorkspacePath,
  persistClaudeFile,
  readClaudeFileFromDisk,
  removeClaudeFileFromDisk,
  validateClaudeFileBuffer,
} from "../services/claudeFiles.service";

export const claudeFilesRouter = Router();

const uploadClaudeFileSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_base64: z.string().min(20),
  notes: z.string().max(2000).optional(),
});

const updateClaudeFileSchema = z.object({
  notes: z.string().max(2000).nullable().optional(),
});

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  return roleResult.rows[0]?.role === "admin";
}

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    next();
  } catch (error) {
    console.error("Failed to verify admin role:", error);
    res.status(500).json({ error: "Internal error", code: "INTERNAL_ERROR" });
  }
}

export async function ensureClaudeFilesTable() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS claude_reference_files (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      workspace_path TEXT NOT NULL,
      mime_type TEXT,
      size_bytes BIGINT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      notes TEXT,
      uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgPool.query(
    `CREATE INDEX IF NOT EXISTS idx_claude_reference_files_created ON claude_reference_files(created_at DESC)`,
  );
}

function mapClaudeFileRow(row: {
  id: string;
  original_name: string;
  stored_name: string;
  file_path: string;
  workspace_path: string;
  mime_type: string | null;
  size_bytes: number | string;
  category: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    original_name: row.original_name,
    stored_name: row.stored_name,
    file_path: row.file_path,
    workspace_path: row.workspace_path,
    mime_type: row.mime_type,
    size_bytes: Number(row.size_bytes),
    category: row.category,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

claudeFilesRouter.get("/admin/list", requireAuth, requireAdmin, async (_req, res) => {
  try {
    await ensureClaudeFilesTable();
    const result = await pgPool.query<{
      id: string;
      original_name: string;
      stored_name: string;
      file_path: string;
      workspace_path: string;
      mime_type: string | null;
      size_bytes: number | string;
      category: string;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT
         id, original_name, stored_name, file_path, workspace_path,
         mime_type, size_bytes, category, notes,
         created_at::text, updated_at::text
       FROM claude_reference_files
       ORDER BY created_at DESC`,
    );
    res.json({ data: result.rows.map(mapClaudeFileRow) });
  } catch (error) {
    console.error("Failed to list claude files:", error);
    res.status(500).json({ error: "Failed to list files", code: "INTERNAL_ERROR" });
  }
});

claudeFilesRouter.post(
  "/admin/upload",
  requireAuth,
  requireAdmin,
  validateBody(uploadClaudeFileSchema),
  async (req, res) => {
    try {
      await ensureClaudeFilesTable();
      const payload = req.body as z.infer<typeof uploadClaudeFileSchema>;
      const { buffer, declaredMime } = decodeUploadBase64(payload.file_base64);
      const safeOriginalName = validateClaudeFileBuffer(payload.file_name, buffer);
      const storedName = buildStoredClaudeFileName(safeOriginalName);
      const filePath = await persistClaudeFile(storedName, buffer);
      const workspacePath = getClaudeFilesWorkspacePath(storedName);
      const category = detectClaudeFileCategory(safeOriginalName);
      const notes = payload.notes?.trim() || null;

      const insertResult = await pgPool.query<{
        id: string;
        original_name: string;
        stored_name: string;
        file_path: string;
        workspace_path: string;
        mime_type: string | null;
        size_bytes: number | string;
        category: string;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>(
        `INSERT INTO claude_reference_files (
           original_name, stored_name, file_path, workspace_path,
           mime_type, size_bytes, category, notes, uploaded_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING
           id, original_name, stored_name, file_path, workspace_path,
           mime_type, size_bytes, category, notes,
           created_at::text, updated_at::text`,
        [
          safeOriginalName,
          storedName,
          filePath,
          workspacePath,
          declaredMime,
          buffer.length,
          category,
          notes,
          req.user?.id ?? null,
        ],
      );

      res.status(201).json({ data: mapClaudeFileRow(insertResult.rows[0]) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload file";
      const isValidation =
        error instanceof Error &&
        /permis|invalid|gol|depaseste|PDF|fisier/i.test(message);
      res.status(isValidation ? 400 : 500).json({
        error: message,
        code: isValidation ? "INVALID_FILE" : "INTERNAL_ERROR",
      });
    }
  },
);

claudeFilesRouter.patch(
  "/admin/:id",
  requireAuth,
  requireAdmin,
  validateBody(updateClaudeFileSchema),
  async (req, res) => {
    try {
      await ensureClaudeFilesTable();
      const fileId = String(req.params.id ?? "");
      const payload = req.body as z.infer<typeof updateClaudeFileSchema>;
      if (payload.notes === undefined) {
        res.status(400).json({ error: "Nothing to update", code: "INVALID_PAYLOAD" });
        return;
      }
      const notes = payload.notes?.trim() || null;

      const updateResult = await pgPool.query<{
        id: string;
        original_name: string;
        stored_name: string;
        file_path: string;
        workspace_path: string;
        mime_type: string | null;
        size_bytes: number | string;
        category: string;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>(
        `UPDATE claude_reference_files
         SET notes = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING
           id, original_name, stored_name, file_path, workspace_path,
           mime_type, size_bytes, category, notes,
           created_at::text, updated_at::text`,
        [fileId, notes],
      );

      const row = updateResult.rows[0];
      if (!row) {
        res.status(404).json({ error: "File not found", code: "NOT_FOUND" });
        return;
      }

      res.json({ data: mapClaudeFileRow(row) });
    } catch (error) {
      console.error("Failed to update claude file:", error);
      res.status(500).json({ error: "Failed to update file", code: "INTERNAL_ERROR" });
    }
  },
);

claudeFilesRouter.get("/admin/:id/download", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureClaudeFilesTable();
    const fileId = String(req.params.id ?? "");
    const result = await pgPool.query<{
      original_name: string;
      file_path: string;
      mime_type: string | null;
    }>(`SELECT original_name, file_path, mime_type FROM claude_reference_files WHERE id = $1 LIMIT 1`, [
      fileId,
    ]);
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "File not found", code: "NOT_FOUND" });
      return;
    }

    const buffer = await readClaudeFileFromDisk(row.file_path);
    const ext = path.extname(row.original_name).toLowerCase();
    const mimeType =
      row.mime_type ||
      (ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".gif"
              ? "image/gif"
              : ext === ".webp"
                ? "image/webp"
                : ext === ".svg"
                  ? "image/svg+xml"
                  : "application/octet-stream");

    res.setHeader("content-type", mimeType);
    res.setHeader("content-disposition", `inline; filename="${row.original_name.replace(/"/g, "")}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Failed to download claude file:", error);
    res.status(500).json({ error: "Failed to download file", code: "INTERNAL_ERROR" });
  }
});

claudeFilesRouter.delete("/admin/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureClaudeFilesTable();
    const fileId = String(req.params.id ?? "");
    const result = await pgPool.query<{ file_path: string }>(
      `DELETE FROM claude_reference_files WHERE id = $1 RETURNING file_path`,
      [fileId],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "File not found", code: "NOT_FOUND" });
      return;
    }

    await removeClaudeFileFromDisk(row.file_path);
    res.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Failed to delete claude file:", error);
    res.status(500).json({ error: "Failed to delete file", code: "INTERNAL_ERROR" });
  }
});
