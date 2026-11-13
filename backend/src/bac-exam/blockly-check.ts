/** Blockly XML structural checks for pseudocode_modify exercises. */

export function extractBlocklyBlockTypes(blocklyXml: string): string[] {
  if (!blocklyXml.trim()) return [];
  const types: string[] = [];
  const re = /<block[^>]*\stype="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(blocklyXml)) !== null) {
    types.push(match[1]);
  }
  return types;
}

export function checkBlocklyStructure(params: {
  blocklyXml: string;
  requiredBlockTypes: string[];
  forbiddenBlockTypes: string[];
}): { ok: boolean; missing: string[]; forbiddenFound: string[] } {
  const present = new Set(extractBlocklyBlockTypes(params.blocklyXml));
  const missing = params.requiredBlockTypes.filter((t) => !present.has(t));
  const forbiddenFound = params.forbiddenBlockTypes.filter((t) => present.has(t));
  return {
    ok: missing.length === 0 && forbiddenFound.length === 0,
    missing,
    forbiddenFound,
  };
}

export function checkCppPatterns(code: string, required: string[], forbidden: string[]): {
  ok: boolean;
  missingPatterns: string[];
  forbiddenMatches: string[];
} {
  const missingPatterns: string[] = [];
  const forbiddenMatches: string[] = [];

  for (const pattern of required) {
    try {
      if (!new RegExp(pattern, "m").test(code)) missingPatterns.push(pattern);
    } catch {
      if (!code.includes(pattern)) missingPatterns.push(pattern);
    }
  }

  for (const pattern of forbidden) {
    try {
      if (new RegExp(pattern, "m").test(code)) forbiddenMatches.push(pattern);
    } catch {
      if (code.includes(pattern)) forbiddenMatches.push(pattern);
    }
  }

  return { ok: missingPatterns.length === 0 && forbiddenMatches.length === 0, missingPatterns, forbiddenMatches };
}
