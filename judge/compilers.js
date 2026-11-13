const { realpathSync } = require("node:fs");

function resolveRealBinary(binaryPath) {
  try {
    return realpathSync(binaryPath);
  } catch {
    return binaryPath;
  }
}

const FPC_BINARY = resolveRealBinary("/usr/bin/fpc");

function getCompileInvocation({ language, sourceFileName }) {
  const commands = {
    cpp: { command: "/usr/bin/g++", args: ["-O2", "-std=c++17", sourceFileName, "-o", "solution"] },
    c: { command: "/usr/bin/gcc", args: ["-O2", sourceFileName, "-o", "solution"] },
    pascal: { command: FPC_BINARY, args: ["-O2", "-osolution", sourceFileName] },
  };

  return commands[language] || null;
}

module.exports = {
  getCompileInvocation,
};
