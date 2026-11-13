import type { IncomingMessage } from "node:http";
import type { Server } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";

const PATH = "/api/playground/interactive";

/**
 * Proxy "prost" intre browser si serverul WS al judge-ului: nu interpreteaza
 * mesajele, doar le relaieaza in ambele sensuri. Sesiunea interactiva reala
 * (pty, pool de sandbox-uri separat de coada de corectare) traieste in
 * judge/interactive.js - vezi acel fisier pentru protocol.
 */
export function attachPlaygroundInteractiveProxy(server: Server) {
  const wss = new WebSocketServer({ noServer: true });
  const judgeWsUrl = process.env.JUDGE_INTERACTIVE_WS_URL ?? "ws://judge:4100";

  server.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = req.url ?? "";
    if (!url.startsWith(PATH)) return;

    wss.handleUpgrade(req, socket, head, (clientWs) => {
      const judgeWs = new WebSocket(judgeWsUrl);
      let judgeOpen = false;
      const pendingFromClient: string[] = [];

      judgeWs.on("open", () => {
        judgeOpen = true;
        for (const msg of pendingFromClient.splice(0)) judgeWs.send(msg);
      });

      clientWs.on("message", (data) => {
        const text = data.toString();
        if (judgeOpen) judgeWs.send(text);
        else pendingFromClient.push(text);
      });

      judgeWs.on("message", (data) => {
        if (clientWs.readyState === WebSocket.OPEN) clientWs.send(data.toString());
      });

      const closeBoth = () => {
        if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) clientWs.close();
        if (judgeWs.readyState === WebSocket.OPEN || judgeWs.readyState === WebSocket.CONNECTING) judgeWs.close();
      };

      clientWs.on("close", closeBoth);
      clientWs.on("error", closeBoth);
      judgeWs.on("close", closeBoth);
      judgeWs.on("error", closeBoth);
    });
  });
}
