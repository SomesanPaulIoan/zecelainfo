/** Deterministic validators for flexible_answer exercises. */

export type Constraint = {
  left: string;
  op: "==" | "!=" | ">=" | "<=";
  right: number;
};

export function parseKeyValueAnswer(raw: string): Record<string, number> {
  const values: Record<string, number> = {};
  const chunks = raw
    .split(/[\n;,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const eq = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)$/.exec(chunk);
    if (eq) {
      values[eq[1]] = Number(eq[2]);
      continue;
    }
    const num = Number(chunk);
    if (!Number.isNaN(num) && chunk.match(/^-?\d/)) {
      values[`_v${Object.keys(values).length}`] = num;
    }
  }
  return values;
}

function evalExpr(expr: string, vars: Record<string, number>): number | null {
  const sanitized = expr.replace(/\s+/g, "");
  if (!/^[a-zA-Z0-9_+\-*/().]+$/.test(sanitized)) return null;

  let js = sanitized;
  for (const [name, value] of Object.entries(vars)) {
    js = js.replaceAll(name, String(value));
  }
  if (/[a-zA-Z_]/.test(js)) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${js});`)() as number;
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function validateConstraints(vars: Record<string, number>, constraints: Constraint[]): boolean {
  for (const c of constraints) {
    const left = evalExpr(c.left, vars);
    if (left === null) return false;
    if (c.op === "==" && left !== c.right) return false;
    if (c.op === "!=" && left === c.right) return false;
    if (c.op === ">=" && left < c.right) return false;
    if (c.op === "<=" && left > c.right) return false;
  }
  return true;
}

export function mergeAnswerVariables(answer: Record<string, unknown>): Record<string, number> {
  if (answer.values && typeof answer.values === "object" && !Array.isArray(answer.values)) {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(answer.values as Record<string, unknown>)) {
      const n = Number(v);
      if (!Number.isNaN(n)) out[k] = n;
    }
    if (Object.keys(out).length > 0) return out;
  }

  const answers = Array.isArray(answer.answers)
    ? (answer.answers as unknown[]).map(String)
    : String(answer.text ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

  const merged: Record<string, number> = {};
  for (const line of answers) {
    Object.assign(merged, parseKeyValueAnswer(line));
  }
  return merged;
}
