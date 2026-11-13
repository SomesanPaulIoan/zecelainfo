const { join } = require("node:path");
const { WebSocketServer } = require("ws");
const pty = require("node-pty");
const { getCompileInvocation } = require("./compilers");
const { initBoxWithId, cleanupBox, compileInSandbox } = require("./sandbox");
const { EXTENSION_BY_LANGUAGE, writeProjectFiles, collectOutputFiles } = require("./playground");

// Sesiunile interactive folosesc un pool de box-id-uri complet separat de cel
// batch (0-7, folosit de submissions + playground/run) - o sesiune poate sta
// deschisa minute intregi cat timp elevul se gandeste ce sa scrie, si nu
// trebuie sa poata bloca vreodata coada de corectare a temelor reale.
const INTERACTIVE_BOX_IDS = [100, 101, 102];
const MAX_TIME_LIMIT_S = 30; // timp CPU per sesiune - opreste bucle infinite chiar si in modul interactiv
const MAX_SESSION_MS = 5 * 60 * 1000; // plafon dur de sesiune, indiferent de activitate
const MEMORY_LIMIT_MB = 128;

const freeBoxIds = [...INTERACTIVE_BOX_IDS];

function acquireBoxId() {
  return freeBoxIds.length > 0 ? freeBoxIds.shift() : null;
}

function releaseBoxId(boxId) {
  if (INTERACTIVE_BOX_IDS.includes(boxId) && !freeBoxIds.includes(boxId)) {
    freeBoxIds.push(boxId);
  }
}

function send(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

async function handleSession(ws) {
  let boxId = null;
  let ptyProcess = null;
  let sessionTimer = null;
  let closed = false;

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    if (sessionTimer) clearTimeout(sessionTimer);
    if (ptyProcess) {
      try {
        ptyProcess.kill();
      } catch {
        // procesul poate fi deja mort
      }
    }
    if (boxId !== null) {
      await cleanupBox(boxId);
      releaseBoxId(boxId);
      boxId = null;
    }
  };

  ws.on("close", () => void cleanup());
  ws.on("error", () => void cleanup());

  ws.on("message", async (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (message.type === "stdin") {
      if (ptyProcess) ptyProcess.write(String(message.data ?? ""));
      return;
    }

    if (message.type === "resize") {
      const cols = Math.max(2, Math.min(500, Number(message.cols) || 80));
      const rows = Math.max(1, Math.min(200, Number(message.rows) || 24));
      if (ptyProcess) {
        try {
          ptyProcess.resize(cols, rows);
        } catch {
          // ignoram - un resize esuat nu trebuie sa opreasca sesiunea
        }
      }
      return;
    }

    if (message.type !== "start" || ptyProcess) return;

    const language = message.language;
    const extension = EXTENSION_BY_LANGUAGE[language];
    if (!extension) {
      send(ws, { type: "error", message: `Limbaj nesuportat: ${language}` });
      ws.close();
      return;
    }

    boxId = acquireBoxId();
    if (boxId === null) {
      send(ws, { type: "error", message: "Serverul de compilare interactiva e ocupat - incearca din nou peste cateva secunde." });
      ws.close();
      return;
    }

    try {
      const box = await initBoxWithId(boxId);
      const sourceFileName = await writeProjectFiles(box.boxWorkDir, language, message.code, message.files);

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
          send(ws, {
            type: "compile_error",
            stderr: String(compileResult.stderr || compileResult.stdout || compileResult.meta.message || "Compilation failed"),
          });
          await cleanup();
          ws.close();
          return;
        }
      }

      const command = language === "python" ? "/usr/bin/python3" : "./solution";
      const args = language === "python" ? [sourceFileName] : [];
      const cols = Math.max(2, Math.min(500, Number(message.cols) || 80));
      const rows = Math.max(1, Math.min(200, Number(message.rows) || 24));

      const isolateArgs = [
        "--cg",
        `--box-id=${box.boxId}`,
        // fara asta, isolate muta programul sandbox-at intr-un process-group nou
        // dar nu il face foreground pe pty -> primul read() de la tastatura
        // opreste procesul cu SIGTTIN in loc sa blocheze normal (verificat manual).
        "--tty-hack",
        `--time=${MAX_TIME_LIMIT_S}`,
        `--wall-time=${Math.ceil(MAX_SESSION_MS / 1000)}`,
        `--cg-mem=${MEMORY_LIMIT_MB * 1024}`,
        `--mem=${MEMORY_LIMIT_MB * 1024}`,
        "--processes=1",
        "--open-files=64",
        // fara astea, isolate isi printeaza singur un rezumat ("OK (...)")
        // direct in pty dupa ce programul termina - zgomot redundant, avem
        // deja propriul mesaj de final (mai jos, la onExit). --meta scrie
        // datele structurat intr-un fisier; --silent opreste explicit
        // printarea rezumatului text (--meta singur nu e suficient).
        `--meta=${join(box.boxPath, "meta.txt")}`,
        "--silent",
        // fara --stdin/--stdout/--stderr: programul mosteneste direct pty-ul
        // parintelui (isolate insusi), asa ca citirile/scrierile lui curg
        // live prin pty, cu ecou si Ctrl+C gestionate de kernel ca la un
        // terminal real - nu simulam nimic din astea manual.
        "--run",
        "--",
        command,
        ...args,
      ];

      const startedAt = Date.now();
      ptyProcess = pty.spawn("isolate", isolateArgs, {
        name: "xterm-256color",
        cols,
        rows,
        cwd: box.boxWorkDir,
      });

      send(ws, { type: "started" });

      ptyProcess.onData((data) => {
        send(ws, { type: "output", data });
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        const timeMs = Date.now() - startedAt;
        send(ws, { type: "exit", exitCode, signal, timeMs });
        void collectOutputFiles(box.boxWorkDir, sourceFileName).then((files) => {
          if (files.length > 0) send(ws, { type: "files", files });
          void cleanup();
          ws.close();
        });
      });

      sessionTimer = setTimeout(() => {
        send(ws, { type: "timeout" });
        void cleanup();
        ws.close();
      }, MAX_SESSION_MS);
    } catch (error) {
      send(ws, { type: "error", message: error && error.message ? error.message : "Eroare interna la pornirea sesiunii" });
      await cleanup();
      ws.close();
    }
  });
}

function startInteractiveServer(port) {
  const wss = new WebSocketServer({ port });
  wss.on("connection", (ws) => {
    void handleSession(ws);
  });
  wss.on("listening", () => {
    console.log(`[judge] interactive terminal server ready on :${port}`);
  });
  return wss;
}

module.exports = { startInteractiveServer };
