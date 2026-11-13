const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { readFile, writeFile } = require("node:fs/promises");
const { join } = require("node:path");

const execFileAsync = promisify(execFile);

const BOX_POOL_SIZE = 8;
let nextBoxId = 0;

function allocateBoxId() {
  const boxId = nextBoxId;
  nextBoxId = (nextBoxId + 1) % BOX_POOL_SIZE;
  return boxId;
}

async function initBox() {
  return initBoxWithId(allocateBoxId());
}

/** Ca initBox(), dar cu un box-id explicit - foloseste-l cand ai propriul pool de id-uri (ex. sesiuni interactive izolate de pool-ul de batch 0-7). */
async function initBoxWithId(boxId) {
  const { stdout } = await execFileAsync("isolate", ["--cg", "--init", `--box-id=${boxId}`]);
  const boxPath = stdout.trim();
  return { boxId, boxPath, boxWorkDir: join(boxPath, "box") };
}

async function cleanupBox(boxId) {
  await execFileAsync("isolate", ["--cg", "--cleanup", `--box-id=${boxId}`]).catch(() => {});
}

function parseMeta(text) {
  const meta = {};
  for (const line of text.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    meta[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
  }
  return meta;
}

function mapMetaVerdict(meta) {
  if (meta.status === "TO") return "TLE";
  if (meta.status === "SG" || meta.status === "RE") return "RE";
  if (meta.status === "XX") return "XX";
  return "OK";
}

async function runInBox({
  boxId,
  boxPath,
  boxWorkDir,
  command,
  args,
  timeLimitMs,
  wallTimeMsOverride,
  memoryLimitMb,
  processes = 1,
  fsizeKb = 10240,
  env = {},
  extraDirRules = [],
  useStdin = true,
  stdoutFile = "output.txt",
  stderrFile = "stderr.txt",
}) {
  const metaPath = join(boxPath, "meta.txt");
  const wallTimeMs = wallTimeMsOverride ?? Math.max(timeLimitMs * 1.5, timeLimitMs + 1000);

  const isolateArgs = [
    "--cg",
    `--box-id=${boxId}`,
    `--time=${(timeLimitMs / 1000).toFixed(3)}`,
    `--wall-time=${(wallTimeMs / 1000).toFixed(3)}`,
    `--cg-mem=${memoryLimitMb * 1024}`,
    `--mem=${memoryLimitMb * 1024}`,
    `--processes=${processes}`,
    `--fsize=${fsizeKb}`,
    "--open-files=64",
    `--meta=${metaPath}`,
  ];

  for (const rule of extraDirRules) {
    isolateArgs.push(`--dir=${rule}`);
  }
  for (const [key, value] of Object.entries(env)) {
    isolateArgs.push(`--env=${key}=${value}`);
  }
  if (useStdin) {
    isolateArgs.push("--stdin=input.txt");
  }
  isolateArgs.push(`--stdout=${stdoutFile}`, `--stderr=${stderrFile}`);
  isolateArgs.push("--run", "--", command, ...args);

  let isolateError = null;
  try {
    await execFileAsync("isolate", isolateArgs);
  } catch (error) {
    isolateError = error;
  }

  const metaText = await readFile(metaPath, "utf8").catch(() => "");
  const meta = parseMeta(metaText);
  if (Object.keys(meta).length === 0 && isolateError) {
    meta.status = "XX";
    meta.message = String(isolateError.stderr || isolateError.message || "isolate failed to run");
  }
  const stdout = await readFile(join(boxWorkDir, stdoutFile), "utf8").catch(() => "");
  const stderr = await readFile(join(boxWorkDir, stderrFile), "utf8").catch(() => "");

  return {
    verdict: mapMetaVerdict(meta),
    meta,
    stdout,
    stderr,
    timeMs: meta.time ? Math.round(Number(meta.time) * 1000) : 0,
    memoryKb: meta["max-rss"] ? Number(meta["max-rss"]) : 0,
  };
}

const COMPILE_ENV = { PATH: "/usr/bin:/bin:/usr/local/bin" };
const COMPILE_EXTRA_DIRS = ["/etc=/etc:noexec"];

async function compileInSandbox({ boxId, boxPath, boxWorkDir, command, args }) {
  return runInBox({
    boxId,
    boxPath,
    boxWorkDir,
    command,
    args,
    timeLimitMs: 10000,
    wallTimeMsOverride: 15000,
    memoryLimitMb: 512,
    processes: 32,
    fsizeKb: 51200,
    env: COMPILE_ENV,
    extraDirRules: COMPILE_EXTRA_DIRS,
    useStdin: false,
    stdoutFile: "compile_stdout.txt",
    stderrFile: "compile_stderr.txt",
  });
}

async function executeInSandbox({
  boxId,
  boxPath,
  boxWorkDir,
  command,
  args,
  stdinContent,
  fileInputName,
  fileInputContent,
  timeLimitMs,
  memoryLimitMb,
}) {
  await writeFile(join(boxWorkDir, "input.txt"), stdinContent || "", "utf8");
  if (fileInputName) {
    await writeFile(join(boxWorkDir, fileInputName), fileInputContent || "", "utf8");
  }
  return runInBox({
    boxId,
    boxPath,
    boxWorkDir,
    command,
    args,
    timeLimitMs,
    memoryLimitMb,
    processes: 1,
    fsizeKb: 10240,
    env: {},
    extraDirRules: [],
    useStdin: true,
    stdoutFile: "output.txt",
    stderrFile: "stderr.txt",
  });
}

module.exports = {
  initBox,
  initBoxWithId,
  cleanupBox,
  compileInSandbox,
  executeInSandbox,
};
