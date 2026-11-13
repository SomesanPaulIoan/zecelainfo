import { Router } from "express";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { runInPlaygroundSandbox } from "../services/playground-run.service";

export const playgroundRouter = Router();

// Numele poate fi o cale relativa cu foldere (ex. "src/main.cpp"); interzicem
// segmente ".."/"." si cai absolute - aceeasi regula ca sanitizarea din judge.
const filePathRegex = /^[^/\\]+(\/[^/\\]+)*$/;
const fileSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(200)
    .refine((value) => filePathRegex.test(value) && !value.split("/").some((segment) => segment === "." || segment === ".."), {
      message: "Nume de fisier invalid",
    }),
  content: z.string().max(200000),
});

const ioFieldsSchema = {
  input_source: z.enum(["stdin", "file"]).default("stdin"),
  input_filename: z.string().max(100).nullable().optional(),
  output_target: z.enum(["stdout", "file"]).default("stdout"),
  output_filename: z.string().max(100).nullable().optional(),
};

const runPlaygroundSchema = z.object({
  language: z.enum(["cpp", "c", "pascal", "python"]),
  code: z.string().max(100000),
  stdin: z.string().max(200000).optional(),
  files: z.array(fileSchema).max(20).optional(),
  time_limit_ms: z.number().int().min(100).max(10000).optional(),
  memory_limit_mb: z.number().int().min(16).max(256).optional(),
  ...ioFieldsSchema,
});

// Anonymous visitors can run code (it's never persisted) - only saving a
// project as a named, revisitable session requires an account.
playgroundRouter.post("/run", validateBody(runPlaygroundSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof runPlaygroundSchema>;
    const result = await runInPlaygroundSandbox({
      language: body.language,
      code: body.code,
      stdin: body.stdin,
      files: body.files,
      inputSource: body.input_source,
      inputFilename: body.input_filename ?? null,
      outputTarget: body.output_target,
      outputFilename: body.output_filename ?? null,
      timeLimitMs: body.time_limit_ms,
      memoryLimitMb: body.memory_limit_mb,
    });
    res.json({ data: result });
  } catch (error) {
    console.error("Playground run failed:", error);
    res.status(500).json({ error: "Nu am putut rula codul", code: "INTERNAL_ERROR" });
  }
});

const projectSchema = z.object({
  name: z.string().min(1).max(120),
  files: z.array(fileSchema).min(1).max(20),
  stdin: z.string().max(200000).default(""),
  ...ioFieldsSchema,
});

type ProjectRow = {
  id: string;
  name: string;
  files: { name: string; content: string }[];
  stdin: string;
  input_source: string;
  input_filename: string | null;
  output_target: string;
  output_filename: string | null;
  created_at: string;
  updated_at: string;
};

const PROJECT_COLUMNS = `id, name, files, stdin, input_source, input_filename, output_target, output_filename, created_at, updated_at`;

playgroundRouter.get("/projects", requireAuth, async (req, res) => {
  try {
    const result = await pgPool.query<ProjectRow>(
      `SELECT ${PROJECT_COLUMNS} FROM playground_projects WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.user!.id],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to list playground projects:", error);
    res.status(500).json({ error: "Nu am putut incarca proiectele", code: "INTERNAL_ERROR" });
  }
});

playgroundRouter.get("/projects/:id", requireAuth, async (req, res) => {
  try {
    const result = await pgPool.query<ProjectRow>(
      `SELECT ${PROJECT_COLUMNS} FROM playground_projects WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [req.params.id, req.user!.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Proiect negasit", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Failed to fetch playground project:", error);
    res.status(500).json({ error: "Nu am putut incarca proiectul", code: "INTERNAL_ERROR" });
  }
});

playgroundRouter.post("/projects", requireAuth, validateBody(projectSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof projectSchema>;
    const result = await pgPool.query<ProjectRow>(
      `INSERT INTO playground_projects
         (user_id, name, files, stdin, input_source, input_filename, output_target, output_filename)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${PROJECT_COLUMNS}`,
      [
        req.user!.id,
        body.name,
        JSON.stringify(body.files),
        body.stdin,
        body.input_source,
        body.input_filename ?? null,
        body.output_target,
        body.output_filename ?? null,
      ],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error("Failed to save playground project:", error);
    res.status(500).json({ error: "Nu am putut salva proiectul", code: "INTERNAL_ERROR" });
  }
});

playgroundRouter.put("/projects/:id", requireAuth, validateBody(projectSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof projectSchema>;
    const result = await pgPool.query<ProjectRow>(
      `UPDATE playground_projects
       SET name = $1, files = $2, stdin = $3,
           input_source = $4, input_filename = $5, output_target = $6, output_filename = $7,
           updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING ${PROJECT_COLUMNS}`,
      [
        body.name,
        JSON.stringify(body.files),
        body.stdin,
        body.input_source,
        body.input_filename ?? null,
        body.output_target,
        body.output_filename ?? null,
        req.params.id,
        req.user!.id,
      ],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Proiect negasit", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Failed to update playground project:", error);
    res.status(500).json({ error: "Nu am putut actualiza proiectul", code: "INTERNAL_ERROR" });
  }
});

playgroundRouter.delete("/projects/:id", requireAuth, async (req, res) => {
  try {
    const result = await pgPool.query(
      `DELETE FROM playground_projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Proiect negasit", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Failed to delete playground project:", error);
    res.status(500).json({ error: "Nu am putut sterge proiectul", code: "INTERNAL_ERROR" });
  }
});
