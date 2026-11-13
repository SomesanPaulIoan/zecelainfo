import path from "node:path";
import dotenv from "dotenv";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { authRouter } from "./routes/auth";
import { bacRouter } from "./routes/bac";
import { coursesRouter } from "./routes/courses";
import { grileRouter } from "./routes/grile";
import { meditationsRouter } from "./routes/meditations";
import { problemsRouter } from "./routes/problems";
import { submissionsRouter } from "./routes/submissions";
import { discountCodesRouter } from "./routes/discountCodes";
import { claudeFilesRouter } from "./routes/claudeFiles";
import { bacExamRouter } from "./routes/bac-exam";
import { offers2027Router } from "./routes/offers2027";
import { playgroundRouter } from "./routes/playground";
import { placementTestRouter } from "./routes/placementTest";
import { revolutWebhooksRouter } from "./routes/revolutWebhooks";
import { demoRouter } from "./routes/demo";
import { marketingRouter } from "./routes/marketing";
import { startRevolutReconciliationJob } from "./services/revolutWebhook.service";
import { attachPlaygroundInteractiveProxy } from "./ws/playgroundInteractive";

/** Monorepo local: dist în `backend/dist`. Docker: doar `/app/dist` → nu încărcăm `../../.env` (ar deveni `/.env`). */
function loadDotenvFiles() {
  const distDir = path.resolve(__dirname);
  const appRoot = path.resolve(distDir, "..");
  if (path.basename(appRoot) === "backend") {
    const repoRoot = path.resolve(appRoot, "..");
    dotenv.config({ path: path.join(repoRoot, ".env") });
  }
  dotenv.config({ path: path.join(appRoot, ".env"), override: true });
}

loadDotenvFiles();

const app = express();
const port = Number(process.env.PORT ?? 4000);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

console.log(
  `[env] appBase=${process.env.APP_BASE_URL ?? "-"} smtpHost=${process.env.SMTP_HOST ?? "-"} revolut=${Boolean(
    process.env.REVOLUT_SECRET_KEY || process.env.REVOLUT_SECRET,
  )} smartbill=${Boolean(process.env.SMARTBILL_TOKEN)}`,
);

app.use(cors());
// Inainte de express.json(): webhook-ul Revolut verifica semnatura pe body-ul brut.
app.use("/api/payments/revolut", revolutWebhooksRouter);
app.use(express.json({ limit: "45mb" }));
app.use(express.urlencoded({ limit: "45mb", extended: true }));

app.get("/health", (_req, res) => {
  res.json({ data: { ok: true } });
});

app.use("/api/auth", authRouter);
app.use("/api/bacalaureat", bacRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/grile", grileRouter);
app.use("/api/meditations", meditationsRouter);
app.use("/api/problems", problemsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/discount-codes", discountCodesRouter);
app.use("/api/claude-files", claudeFilesRouter);
app.use("/api/bac-exam", bacExamRouter);
app.use("/api/offers-2027", offers2027Router);
app.use("/api/playground", playgroundRouter);
app.use("/api/placement-test", placementTestRouter);
app.use("/api/demo", demoRouter);
app.use("/api/marketing", marketingRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: err.message || "Internal server error",
    code: "INTERNAL_ERROR",
  });
});

const server = app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
  startRevolutReconciliationJob();
});

attachPlaygroundInteractiveProxy(server);
