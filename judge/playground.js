const { writeFile, readFile, readdir, stat, mkdir } = require("node:fs/promises");
const { join, dirname, relative, sep } = require("node:path");
const { initBox, cleanupBox, compileInSandbox, executeInSandbox } = require("./sandbox");
const { getCompileInvocation } = require("./compilers");

const EXTENSION_BY_LANGUAGE = { cpp: "cpp", c: "c", pascal: "pas", python: "py" };

const RESERVED_NAMES = new Set([
  "solution.cpp",
  "solution.c",
  "solution.pas",
  "solution.py",
  "solution",
  "solution.o",
  "input.txt",
  "output.txt",
  "stderr.txt",
  "meta.txt",
  "compile_stdout.txt",
  "compile_stderr.txt",
]);

const MAX_TIME_LIMIT_MS = 10000;
const MIN_TIME_LIMIT_MS = 100;
const MAX_MEMORY_LIMIT_MB = 256;
const MIN_MEMORY_LIMIT_MB = 16;
const MAX_INPUT_FILES = 20;
const MAX_OUTPUT_FILES = 20;
const MAX_FILE_BYTES = 200000;

function clamp(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

/** Accepta cai relative cu foldere (ex. "src/main.cpp"), respinge orice segment care ar putea iesi din sandbox. */
function sanitizeFilePath(rawName) {
  const trimmed = String(rawName || "").trim();
  if (!trimmed || trimmed.length > 200) return null;
  if (trimmed.startsWith("/") || trimmed.includes("\\")) return null;
  const segments = trimmed.split("/");
  for (const segment of segments) {
    if (!segment || segment === "." || segment === "..") return null;
  }
  return segments.join("/");
}

/** Scrie sursa + fisierele auxiliare (inclusiv in subfoldere) in sandbox; folosit atat de rularea batch cat si de sesiunile interactive. */
async function writeProjectFiles(boxWorkDir, language, code, files) {
  const extension = EXTENSION_BY_LANGUAGE[language];
  if (!extension) return null;
  const sourceFileName = `solution.${extension}`;
  await writeFile(join(boxWorkDir, sourceFileName), code || "", "utf8");
  for (const file of Array.isArray(files) ? files.slice(0, MAX_INPUT_FILES) : []) {
    const name = sanitizeFilePath(file && file.name);
    if (!name || RESERVED_NAMES.has(name) || name === sourceFileName) continue;
    const fullPath = join(boxWorkDir, name);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, String((file && file.content) || "").slice(0, MAX_FILE_BYTES), "utf8");
  }
  return sourceFileName;
}

async function walkOutputFiles(dir, boxWorkDir, sourceFileName, results) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (results.length >= MAX_OUTPUT_FILES) return;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkOutputFiles(fullPath, boxWorkDir, sourceFileName, results);
      continue;
    }
    if (!entry.isFile()) continue;
    const relName = relative(boxWorkDir, fullPath).split(sep).join("/");
    if (RESERVED_NAMES.has(relName) || relName === sourceFileName) continue;
    try {
      const info = await stat(fullPath);
      if (info.size > MAX_FILE_BYTES) continue;
      const content = await readFile(fullPath, "utf8");
      results.push({ name: relName, content });
    } catch {
      // binary/unreadable content: skip rather than send garbage back
    }
  }
}

async function collectOutputFiles(boxWorkDir, sourceFileName) {
  const results = [];
  await walkOutputFiles(boxWorkDir, boxWorkDir, sourceFileName, results);
  return results;
}

async function runPlayground({
  language,
  code,
  stdin,
  files,
  inputSource,
  inputFilename,
  outputTarget,
  outputFilename,
  timeLimitMs,
  memoryLimitMb,
}) {
  const extension = EXTENSION_BY_LANGUAGE[language];
  if (!extension) {
    return { verdict: "XX", stdout: "", stderr: `Unsupported language: ${language}`, timeMs: 0, memoryKb: 0, files: [] };
  }

  const clampedTime = clamp(timeLimitMs, MIN_TIME_LIMIT_MS, MAX_TIME_LIMIT_MS, 3000);
  const clampedMemory = clamp(memoryLimitMb, MIN_MEMORY_LIMIT_MB, MAX_MEMORY_LIMIT_MB, 128);
  const isFileInput = inputSource === "file";

  const box = await initBox();
  try {
    const sourceFileName = await writeProjectFiles(box.boxWorkDir, language, code, files);

    if (language !== "python") {
      const invocation = getCompileInvocation({ language, sourceFileName });
      const compileResult = await compileInSandbox({
        boxId: box.boxId,
        boxPath: box.boxPath,
        boxWorkDir: box.boxWorkDir,
        command: invocation.command,
        args: invocation.args,
      });
      if (compileResult.verdict !== "OK") {
        return {
          verdict: "CE",
          stdout: "",
          stderr: String(compileResult.stderr || compileResult.stdout || compileResult.meta.message || "Compilation failed"),
          timeMs: 0,
          memoryKb: 0,
          files: [],
        };
      }
    }

    const command = language === "python" ? "/usr/bin/python3" : "./solution";
    const args = language === "python" ? [sourceFileName] : [];

    const execution = await executeInSandbox({
      boxId: box.boxId,
      boxPath: box.boxPath,
      boxWorkDir: box.boxWorkDir,
      command,
      args,
      stdinContent: isFileInput ? "" : stdin || "",
      fileInputName: isFileInput ? (inputFilename || "input.txt").trim() : undefined,
      fileInputContent: isFileInput ? stdin || "" : undefined,
      timeLimitMs: clampedTime,
      memoryLimitMb: clampedMemory,
    });

    let stdout = execution.stdout || "";
    if (execution.verdict === "OK" && outputTarget === "file") {
      const name = (outputFilename || "output.txt").trim();
      stdout = await readFile(join(box.boxWorkDir, name), "utf8").catch(() => "");
    }

    const outputFiles = await collectOutputFiles(box.boxWorkDir, sourceFileName);
    const verdict = execution.verdict === "OK" ? "AC" : execution.verdict === "TLE" ? "TLE" : "RE";

    return {
      verdict,
      stdout,
      stderr: execution.stderr || "",
      timeMs: execution.timeMs,
      memoryKb: execution.memoryKb,
      files: outputFiles,
    };
  } finally {
    await cleanupBox(box.boxId);
  }
}

module.exports = { runPlayground, EXTENSION_BY_LANGUAGE, writeProjectFiles, collectOutputFiles };
