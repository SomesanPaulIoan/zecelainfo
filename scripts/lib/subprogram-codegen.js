/**
 * Codegen pentru problemele de tip "subprogram" (elevul implementeaza o singura
 * functie, nu un program intreg). Pornind de la o specificatie declarativa a
 * semnaturii, genereaza:
 *   - stub-ul afisat elevului (doar semnatura + corp gol) pentru cpp/c/pascal/python
 *   - wrapper-ul complet (cu main + citire/afisare) in care se insereaza codul
 *     elevului la marcajul __USER_CODE__, folosit de judge la evaluare
 *
 * Conventii de I/O (identice, indiferent de limbaj, ca testele sa fie partajate):
 *   - fiecare valoare scalara (int/real/bool/string) e pe linia ei
 *   - un tablou e pe o singura linie, cu elementele separate prin spatiu
 *     (precedat de parametrul scalar care ii da dimensiunea)
 *   - o matrice e pe randuri x coloane linii, elementele separate prin spatiu
 *   - valorile reale se citesc/afiseaza cu REAL_DECIMALS zecimale fixe, ca
 *     rezultatul sa fie identic text intre limbaje
 *   - bool se citeste/afiseaza ca 0/1
 *
 * Tipuri de parametri: "int" | "real" | "bool" | "string" | "array<int>" |
 * "array<real>" | "matrix<int>" | "matrix<real>"
 * (parametrii array/matrix trebuie sa aiba sizeParam / rowsParam+colsParam
 * care sa refere un parametru scalar "int" deja definit, mentionat inaintea lor)
 *
 * Moduri de retur:
 *   - { mode: "value", type: <scalar> }
 *       -> cpp/c/pascal/python: functia intoarce valoarea, main-ul o afiseaza
 *   - { mode: "value", type: "array<int>"|"array<real>", sizeParam: <nume param existent> }
 *       -> cpp/pascal/python: functia intoarce un tablou nou
 *       -> c: din motive de idiom (C nu returneaza tablouri), functia devine
 *          void si primeste tabloul de rezultat ca parametru de iesire
 *   - { mode: "out-params", outs: [{ name, type: <scalar> }, ...] }
 *       -> cpp/c/pascal: parametri de iesire prin referinta/pointer
 *       -> python: functia returneaza un tuplu, in aceeasi ordine
 *   - { mode: "mutate-array", paramName: <nume param array deja definit> }
 *       -> functia modifica tabloul primit ca parametru, in loc (fara return);
 *          main-ul afiseaza tabloul dupa apel
 */

const REAL_DECIMALS = 2;

function parseType(type) {
  if (type === "int" || type === "real" || type === "bool" || type === "string") {
    return { kind: "scalar", of: type };
  }
  const arrayMatch = /^array<(int|real)>$/.exec(type);
  if (arrayMatch) return { kind: "array", of: arrayMatch[1] };
  const matrixMatch = /^matrix<(int|real)>$/.exec(type);
  if (matrixMatch) return { kind: "matrix", of: matrixMatch[1] };
  throw new Error(`Tip necunoscut: ${type}`);
}

function findParam(spec, name) {
  const param = spec.params.find((p) => p.name === name);
  if (!param) throw new Error(`Parametrul '${name}' nu exista in semnatura '${spec.name}'`);
  return param;
}

function validateSpec(spec) {
  if (!spec.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(spec.name)) {
    throw new Error(`Nume de functie invalid: ${spec.name}`);
  }
  for (const param of spec.params) {
    const t = parseType(param.type);
    if (t.kind === "array" && !findParam(spec, param.sizeParam)) {
      throw new Error(`Parametrul array '${param.name}' are sizeParam invalid`);
    }
    if (t.kind === "matrix" && (!findParam(spec, param.rowsParam) || !findParam(spec, param.colsParam))) {
      throw new Error(`Parametrul matrix '${param.name}' are rowsParam/colsParam invalid`);
    }
  }
  if (spec.returns.mode === "mutate-array") {
    const target = findParam(spec, spec.returns.paramName);
    if (parseType(target.type).kind !== "array") {
      throw new Error(`mutate-array: '${spec.returns.paramName}' trebuie sa fie array`);
    }
  }
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    if (t.kind === "array" && !findParam(spec, spec.returns.sizeParam)) {
      throw new Error(`returns value-array: sizeParam invalid`);
    }
  }
  return spec;
}

// ---------- CPP ----------

function cppScalarType(of) {
  return { int: "int", real: "double", bool: "bool", string: "string" }[of];
}

function cppParamDecl(spec, param, { byRefIfMutateTarget } = {}) {
  const t = parseType(param.type);
  if (t.kind === "scalar") return `${cppScalarType(t.of)} ${param.name}`;
  if (t.kind === "array") {
    const isMutateTarget = byRefIfMutateTarget && spec.returns.mode === "mutate-array" && spec.returns.paramName === param.name;
    return `vector<${cppScalarType(t.of)}>${isMutateTarget ? " &" : " "}${param.name}`;
  }
  if (t.kind === "matrix") {
    const isMutateTarget = byRefIfMutateTarget && spec.returns.mode === "mutate-array" && spec.returns.paramName === param.name;
    return `vector<vector<${cppScalarType(t.of)}>>${isMutateTarget ? " &" : " "}${param.name}`;
  }
  throw new Error("tip nesuportat");
}

function cppReturnType(spec) {
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    if (t.kind === "scalar") return cppScalarType(t.of);
    if (t.kind === "array") return `vector<${cppScalarType(t.of)}>`;
  }
  if (spec.returns.mode === "out-params") return "void";
  if (spec.returns.mode === "mutate-array") return "void";
  throw new Error("mod de retur nesuportat");
}

function cppSignature(spec) {
  const params = spec.params.map((p) => cppParamDecl(spec, p, { byRefIfMutateTarget: true }));
  if (spec.returns.mode === "out-params") {
    for (const out of spec.returns.outs) {
      params.push(`${cppScalarType(parseType(out.type).of)} &${out.name}`);
    }
  }
  return `${cppReturnType(spec)} ${spec.name}(${params.join(", ")})`;
}

function cppStub(spec) {
  const body =
    spec.returns.mode === "value"
      ? `    // scrie codul tau aici\n    return ${defaultCppReturn(spec)};\n`
      : `    // scrie codul tau aici\n`;
  return `${cppSignature(spec)} {\n${body}}\n`;
}

function defaultCppReturn(spec) {
  const t = parseType(spec.returns.type);
  if (t.kind === "array") return `vector<${cppScalarType(t.of)}>()`;
  if (t.of === "string") return `""`;
  if (t.of === "bool") return "false";
  return "0";
}

function cppReadStatements(spec) {
  const lines = [];
  for (const param of spec.params) {
    const t = parseType(param.type);
    if (t.kind === "scalar") {
      lines.push(`    ${cppScalarType(t.of)} ${param.name};`);
      if (t.of === "bool") {
        lines.push(`    { int tmp; cin >> tmp; ${param.name} = tmp != 0; }`);
      } else {
        lines.push(`    cin >> ${param.name};`);
      }
    } else if (t.kind === "array") {
      lines.push(`    vector<${cppScalarType(t.of)}> ${param.name}(${param.sizeParam});`);
      lines.push(`    for (int i = 0; i < ${param.sizeParam}; i++) cin >> ${param.name}[i];`);
    } else if (t.kind === "matrix") {
      lines.push(`    vector<vector<${cppScalarType(t.of)}>> ${param.name}(${param.rowsParam}, vector<${cppScalarType(t.of)}>(${param.colsParam}));`);
      lines.push(`    for (int i = 0; i < ${param.rowsParam}; i++)`);
      lines.push(`      for (int j = 0; j < ${param.colsParam}; j++) cin >> ${param.name}[i][j];`);
    }
  }
  return lines.join("\n");
}

function cppPrintExpr(varName, of) {
  if (of === "bool") return `(${varName} ? 1 : 0)`;
  if (of === "real") return `fixed << setprecision(${REAL_DECIMALS}) << ${varName}`;
  return `${varName}`;
}

function cppCallAndOutput(spec) {
  const lines = [];
  const args = spec.params.map((p) => p.name);
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    lines.push(`    auto rezultat = ${spec.name}(${args.join(", ")});`);
    if (t.kind === "scalar") {
      lines.push(`    cout << ${cppPrintExpr("rezultat", t.of)} << "\\n";`);
    } else {
      lines.push(`    for (size_t i = 0; i < rezultat.size(); i++) {`);
      lines.push(`      if (i) cout << " ";`);
      lines.push(`      cout << ${cppPrintExpr("rezultat[i]", t.of)};`);
      lines.push(`    }`);
      lines.push(`    cout << "\\n";`);
    }
  } else if (spec.returns.mode === "out-params") {
    for (const out of spec.returns.outs) {
      lines.push(`    ${cppScalarType(parseType(out.type).of)} ${out.name};`);
    }
    lines.push(`    ${spec.name}(${[...args, ...spec.returns.outs.map((o) => o.name)].join(", ")});`);
    const exprs = spec.returns.outs.map((o) => cppPrintExpr(o.name, parseType(o.type).of));
    lines.push(`    cout << ${exprs.join(' << " " << ')} << "\\n";`);
  } else if (spec.returns.mode === "mutate-array") {
    lines.push(`    ${spec.name}(${args.join(", ")});`);
    const target = findParam(spec, spec.returns.paramName);
    const tt = parseType(target.type);
    const n = tt.kind === "array" ? target.sizeParam : null;
    lines.push(`    for (int i = 0; i < ${n}; i++) {`);
    lines.push(`      if (i) cout << " ";`);
    lines.push(`      cout << ${cppPrintExpr(`${spec.returns.paramName}[i]`, tt.of)};`);
    lines.push(`    }`);
    lines.push(`    cout << "\\n";`);
  }
  return lines.join("\n");
}

function cppWrapper(spec) {
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "__USER_CODE__",
    "",
    "int main() {",
    cppReadStatements(spec),
    cppCallAndOutput(spec),
    "    return 0;",
    "}",
    "",
  ].join("\n");
}

// ---------- C ----------

const C_MAX_ARR = 100000;
const C_MAX_MAT_DIM = 205;

function cScalarType(of) {
  return { int: "int", real: "double", bool: "bool", string: "char" }[of];
}

function cParamDecl(spec, param) {
  const t = parseType(param.type);
  if (t.kind === "scalar") return `${cScalarType(t.of)} ${param.name}`;
  if (t.kind === "array") return `${cScalarType(t.of)} ${param.name}[]`;
  if (t.kind === "matrix") return `${cScalarType(t.of)} ${param.name}[][${C_MAX_MAT_DIM}]`;
  throw new Error("tip nesuportat");
}

function cReturnType(spec) {
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    if (t.kind === "scalar") return cScalarType(t.of);
    return "void"; // value-array in C devine parametru de iesire
  }
  return "void";
}

function cSignature(spec) {
  const params = spec.params.map((p) => cParamDecl(spec, p));
  if (spec.returns.mode === "out-params") {
    for (const out of spec.returns.outs) {
      params.push(`${cScalarType(parseType(out.type).of)} *${out.name}`);
    }
  }
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    if (t.kind === "array") params.push(`${cScalarType(t.of)} rezultat[]`);
  }
  return `${cReturnType(spec)} ${spec.name}(${params.join(", ")})`;
}

function cStub(spec) {
  const body = spec.returns.mode === "value" && parseType(spec.returns.type).kind === "scalar" ? `    // scrie codul tau aici\n    return ${defaultCReturn(spec)};\n` : `    // scrie codul tau aici\n`;
  return `${cSignature(spec)} {\n${body}}\n`;
}

function defaultCReturn(spec) {
  const t = parseType(spec.returns.type);
  if (t.of === "bool") return "false";
  if (t.of === "real") return "0.0";
  return "0";
}

function cReadStatements(spec) {
  const lines = [];
  for (const param of spec.params) {
    const t = parseType(param.type);
    if (t.kind === "scalar") {
      if (t.of === "bool") {
        lines.push(`    int ${param.name}_tmp; scanf("%d", &${param.name}_tmp);`);
        lines.push(`    bool ${param.name} = ${param.name}_tmp != 0;`);
      } else if (t.of === "real") {
        lines.push(`    double ${param.name}; scanf("%lf", &${param.name});`);
      } else if (t.of === "string") {
        lines.push(`    char ${param.name}[1005]; scanf("%s", ${param.name});`);
      } else {
        lines.push(`    int ${param.name}; scanf("%d", &${param.name});`);
      }
    } else if (t.kind === "array") {
      lines.push(`    static ${cScalarType(t.of)} ${param.name}[${C_MAX_ARR}];`);
      lines.push(`    for (int i = 0; i < ${param.sizeParam}; i++) scanf("${t.of === "real" ? "%lf" : "%d"}", &${param.name}[i]);`);
    } else if (t.kind === "matrix") {
      lines.push(`    static ${cScalarType(t.of)} ${param.name}[${C_MAX_MAT_DIM}][${C_MAX_MAT_DIM}];`);
      lines.push(`    for (int i = 0; i < ${param.rowsParam}; i++)`);
      lines.push(`      for (int j = 0; j < ${param.colsParam}; j++) scanf("${t.of === "real" ? "%lf" : "%d"}", &${param.name}[i][j]);`);
    }
  }
  return lines.join("\n");
}

function cPrintScalar(expr, of) {
  if (of === "bool") return `printf("%d", (${expr}) ? 1 : 0)`;
  if (of === "real") return `printf("%.${REAL_DECIMALS}f", ${expr})`;
  if (of === "string") return `printf("%s", ${expr})`;
  return `printf("%d", ${expr})`;
}

function cCallAndOutput(spec) {
  const lines = [];
  const args = spec.params.map((p) => p.name);
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    if (t.kind === "scalar") {
      lines.push(`    ${cScalarType(t.of)} rezultat = ${spec.name}(${args.join(", ")});`);
      lines.push(`    ${cPrintScalar("rezultat", t.of)};`);
      lines.push(`    printf("\\n");`);
    } else {
      lines.push(`    static ${cScalarType(t.of)} rezultat[${C_MAX_ARR}];`);
      lines.push(`    ${spec.name}(${[...args, "rezultat"].join(", ")});`);
      lines.push(`    for (int i = 0; i < ${spec.returns.sizeParam}; i++) {`);
      lines.push(`      if (i) printf(" ");`);
      lines.push(`      ${cPrintScalar("rezultat[i]", t.of)};`);
      lines.push(`    }`);
      lines.push(`    printf("\\n");`);
    }
  } else if (spec.returns.mode === "out-params") {
    for (const out of spec.returns.outs) {
      lines.push(`    ${cScalarType(parseType(out.type).of)} ${out.name};`);
    }
    lines.push(`    ${spec.name}(${[...args, ...spec.returns.outs.map((o) => `&${o.name}`)].join(", ")});`);
    const prints = spec.returns.outs.map((o) => cPrintScalar(o.name, parseType(o.type).of));
    lines.push(`    ${prints.join('; printf(" "); ')};`);
    lines.push(`    printf("\\n");`);
  } else if (spec.returns.mode === "mutate-array") {
    lines.push(`    ${spec.name}(${args.join(", ")});`);
    const target = findParam(spec, spec.returns.paramName);
    const tt = parseType(target.type);
    lines.push(`    for (int i = 0; i < ${target.sizeParam}; i++) {`);
    lines.push(`      if (i) printf(" ");`);
    lines.push(`      ${cPrintScalar(`${spec.returns.paramName}[i]`, tt.of)};`);
    lines.push(`    }`);
    lines.push(`    printf("\\n");`);
  }
  return lines.join("\n");
}

function cWrapper(spec) {
  const usesBool = JSON.stringify(spec).includes('"bool"');
  return [
    "#include <stdio.h>",
    usesBool ? "#include <stdbool.h>" : null,
    "",
    "__USER_CODE__",
    "",
    "int main() {",
    cReadStatements(spec),
    cCallAndOutput(spec),
    "    return 0;",
    "}",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

// ---------- Pascal ----------

function pasScalarType(of) {
  return { int: "integer", real: "real", bool: "boolean", string: "string" }[of];
}

function pasMatrixTypeName(of) {
  return of === "real" ? "TRealMatrix" : "TIntMatrix";
}

function pasParamDecl(spec, param) {
  const t = parseType(param.type);
  const isMutateTarget = spec.returns.mode === "mutate-array" && spec.returns.paramName === param.name;
  const varPrefix = isMutateTarget ? "var " : "";
  if (t.kind === "scalar") return `${param.name}: ${pasScalarType(t.of)}`;
  if (t.kind === "array") return `${varPrefix}${param.name}: array of ${pasScalarType(t.of)}`;
  // FPC nu accepta "array of array of T" direct in lista de parametri
  // (open array parameters nu se pot imbrica) - e nevoie de un tip denumit.
  if (t.kind === "matrix") return `${varPrefix}${param.name}: ${pasMatrixTypeName(t.of)}`;
  throw new Error("tip nesuportat");
}

function pasArrayResultTypeName(of) {
  return of === "real" ? "TRealArray" : "TIntArray";
}

function pasReturnType(spec) {
  if (spec.returns.mode !== "value") return null;
  const t = parseType(spec.returns.type);
  if (t.kind === "scalar") return pasScalarType(t.of);
  return pasArrayResultTypeName(t.of);
}

function pasSignature(spec) {
  const params = spec.params.map((p) => pasParamDecl(spec, p));
  if (spec.returns.mode === "out-params") {
    for (const out of spec.returns.outs) {
      params.push(`var ${out.name}: ${pasScalarType(parseType(out.type).of)}`);
    }
  }
  const paramsStr = params.length ? `(${params.join("; ")})` : "";
  const returnType = pasReturnType(spec);
  if (returnType) return `function ${spec.name}${paramsStr}: ${returnType}`;
  return `procedure ${spec.name}${paramsStr}`;
}

function pasStub(spec) {
  const isFunction = spec.returns.mode === "value";
  const body = isFunction ? `  { scrie codul tau aici }\n  ${spec.name} := ${defaultPasReturn(spec)};\n` : `  { scrie codul tau aici }\n`;
  return `${pasSignature(spec)};\nbegin\n${body}end;\n`;
}

function defaultPasReturn(spec) {
  const t = parseType(spec.returns.type);
  if (t.kind === "array") return "nil";
  if (t.of === "bool") return "False";
  if (t.of === "string") return "''";
  if (t.of === "real") return "0.0";
  return "0";
}

function pasVarDecls(spec) {
  const lines = [];
  for (const param of spec.params) {
    const t = parseType(param.type);
    if (t.kind === "scalar") {
      lines.push(`  ${param.name}: ${pasScalarType(t.of)};`);
      if (t.of === "bool") lines.push(`  ${param.name}_tmp: integer;`);
    } else if (t.kind === "array") lines.push(`  ${param.name}: array of ${pasScalarType(t.of)};`);
    else if (t.kind === "matrix") lines.push(`  ${param.name}: ${pasMatrixTypeName(t.of)};`);
  }
  lines.push("  i, j: integer;");
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    lines.push(`  rezultat: ${pasReturnType(spec)};`);
  } else if (spec.returns.mode === "out-params") {
    for (const out of spec.returns.outs) lines.push(`  ${out.name}: ${pasScalarType(parseType(out.type).of)};`);
  }
  return lines.join("\n");
}

function pasReadStatements(spec) {
  const lines = [];
  for (const param of spec.params) {
    const t = parseType(param.type);
    if (t.kind === "scalar") {
      if (t.of === "bool") {
        lines.push(`  readln(${param.name}_tmp);`);
        lines.push(`  ${param.name} := ${param.name}_tmp <> 0;`);
      } else {
        lines.push(`  readln(${param.name});`);
      }
    } else if (t.kind === "array") {
      lines.push(`  SetLength(${param.name}, ${param.sizeParam});`);
      lines.push(`  for i := 0 to ${param.sizeParam} - 1 do read(${param.name}[i]);`);
      lines.push(`  readln;`);
    } else if (t.kind === "matrix") {
      lines.push(`  SetLength(${param.name}, ${param.rowsParam}, ${param.colsParam});`);
      lines.push(`  for i := 0 to ${param.rowsParam} - 1 do begin`);
      lines.push(`    for j := 0 to ${param.colsParam} - 1 do read(${param.name}[i, j]);`);
      lines.push(`    readln;`);
      lines.push(`  end;`);
    }
  }
  return lines.join("\n");
}

function pasPrintScalar(expr, of) {
  if (of === "bool") return `write(Ord(${expr}))`;
  if (of === "real") return `write(${expr}:0:${REAL_DECIMALS})`;
  return `write(${expr})`;
}

function pasCallAndOutput(spec) {
  const lines = [];
  const args = spec.params.map((p) => p.name);
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    lines.push(`  rezultat := ${spec.name}(${args.join(", ")});`);
    if (t.kind === "scalar") {
      lines.push(`  ${pasPrintScalar("rezultat", t.of)};`);
      lines.push(`  writeln;`);
    } else {
      lines.push(`  for i := 0 to Length(rezultat) - 1 do begin`);
      lines.push(`    if i > 0 then write(' ');`);
      lines.push(`    ${pasPrintScalar("rezultat[i]", t.of)};`);
      lines.push(`  end;`);
      lines.push(`  writeln;`);
    }
  } else if (spec.returns.mode === "out-params") {
    lines.push(`  ${spec.name}(${[...args, ...spec.returns.outs.map((o) => o.name)].join(", ")});`);
    const prints = spec.returns.outs.map((o, idx) => `${idx > 0 ? "write(' '); " : ""}${pasPrintScalar(o.name, parseType(o.type).of)};`);
    lines.push(`  ${prints.join(" ")}`);
    lines.push(`  writeln;`);
  } else if (spec.returns.mode === "mutate-array") {
    lines.push(`  ${spec.name}(${args.join(", ")});`);
    const target = findParam(spec, spec.returns.paramName);
    const tt = parseType(target.type);
    lines.push(`  for i := 0 to ${target.sizeParam} - 1 do begin`);
    lines.push(`    if i > 0 then write(' ');`);
    lines.push(`    ${pasPrintScalar(`${spec.returns.paramName}[i]`, tt.of)};`);
    lines.push(`  end;`);
    lines.push(`  writeln;`);
  }
  return lines.join("\n");
}

function pasWrapper(spec) {
  const needsArrayResultType = spec.returns.mode === "value" && parseType(spec.returns.type).kind === "array";
  const needsMatrixType = spec.params.some((p) => parseType(p.type).kind === "matrix");
  const typeSection =
    needsArrayResultType || needsMatrixType
      ? [
          `type`,
          ...(needsArrayResultType ? [`  TIntArray = array of Integer;`, `  TRealArray = array of Real;`] : []),
          ...(needsMatrixType ? [`  TIntMatrix = array of array of Integer;`, `  TRealMatrix = array of array of Real;`] : []),
          ``,
        ]
      : [];
  return [
    "program solution;",
    "",
    "uses SysUtils;",
    "",
    ...typeSection,
    "var",
    pasVarDecls(spec),
    "",
    "__USER_CODE__",
    "",
    "begin",
    pasReadStatements(spec),
    pasCallAndOutput(spec),
    "end.",
    "",
  ].join("\n");
}

// ---------- Python ----------

function pyReadStatements(spec) {
  const lines = [];
  for (const param of spec.params) {
    const t = parseType(param.type);
    if (t.kind === "scalar") {
      if (t.of === "int") lines.push(`${param.name} = int(input())`);
      else if (t.of === "real") lines.push(`${param.name} = float(input())`);
      else if (t.of === "bool") lines.push(`${param.name} = int(input()) != 0`);
      else lines.push(`${param.name} = input().strip()`);
    } else if (t.kind === "array") {
      const conv = t.of === "real" ? "float" : "int";
      lines.push(`${param.name} = list(map(${conv}, input().split()))`);
    } else if (t.kind === "matrix") {
      const conv = t.of === "real" ? "float" : "int";
      lines.push(`${param.name} = [list(map(${conv}, input().split())) for _ in range(${param.rowsParam})]`);
    }
  }
  return lines.join("\n");
}

function pyFormatScalar(expr, of) {
  if (of === "bool") return `(1 if ${expr} else 0)`;
  if (of === "real") return `f"{${expr}:.${REAL_DECIMALS}f}"`;
  return `${expr}`;
}

function pyCallAndOutput(spec) {
  const lines = [];
  const args = spec.params.map((p) => p.name);
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    lines.push(`rezultat = ${spec.name}(${args.join(", ")})`);
    if (t.kind === "scalar") {
      lines.push(`print(${pyFormatScalar("rezultat", t.of)})`);
    } else {
      const fmt = t.of === "real" ? `f"{x:.${REAL_DECIMALS}f}"` : "str(x)";
      lines.push(`print(" ".join(${fmt} for x in rezultat))`);
    }
  } else if (spec.returns.mode === "out-params") {
    const names = spec.returns.outs.map((o) => o.name);
    lines.push(`${names.join(", ")} = ${spec.name}(${args.join(", ")})`);
    const parts = spec.returns.outs.map((o) => pyFormatScalar(o.name, parseType(o.type).of));
    lines.push(`print(${parts.join(", ")})`);
  } else if (spec.returns.mode === "mutate-array") {
    lines.push(`${spec.name}(${args.join(", ")})`);
    const target = findParam(spec, spec.returns.paramName);
    const tt = parseType(target.type);
    const fmt = tt.of === "real" ? `f"{x:.${REAL_DECIMALS}f}"` : "str(x)";
    lines.push(`print(" ".join(${fmt} for x in ${spec.returns.paramName}))`);
  }
  return lines.join("\n");
}

function pyStub(spec) {
  const args = spec.params.map((p) => p.name);
  const body =
    spec.returns.mode === "value"
      ? `    # scrie codul tau aici\n    return ${defaultPyReturn(spec)}\n`
      : spec.returns.mode === "out-params"
        ? `    # scrie codul tau aici\n    return ${spec.returns.outs.map(() => "0").join(", ")}\n`
        : `    # scrie codul tau aici\n    pass\n`;
  return `def ${spec.name}(${args.join(", ")}):\n${body}`;
}

function defaultPyReturn(spec) {
  const t = parseType(spec.returns.type);
  if (t.kind === "array") return "[]";
  if (t.of === "bool") return "False";
  if (t.of === "string") return '""';
  return "0";
}

function pyWrapper(spec) {
  return [`__USER_CODE__`, ``, pyReadStatements(spec), pyCallAndOutput(spec), ``].join("\n");
}

// ---------- Semnatura umana (afisata in enunt) ----------

function humanSignature(spec) {
  const paramsCpp = spec.params.map((p) => cppParamDecl(spec, p, { byRefIfMutateTarget: true })).join(", ");
  return `${cppReturnType(spec)} ${spec.name}(${paramsCpp})`;
}

function pySignatureLine(spec) {
  const args = spec.params.map((p) => p.name);
  return `def ${spec.name}(${args.join(", ")}):`;
}

/**
 * Bloc de enunt care precizeaza explicit, pentru fiecare limbaj, numele
 * subprogramului, parametrii (in ordine) si tipul returnat - exact semnatura
 * ceruta de wrapper la evaluare. Se genereaza direct din spec, deci nu poate
 * sa difere de codul care chiar ruleaza la corectare.
 */
function buildSignatureBlock(rawSpec) {
  const spec = validateSpec(rawSpec);
  const lines = [
    "**Semnatura subprogramului** (implementati exact aceasta functie/procedura - numele, parametrii, ordinea si tipul returnat trebuie sa coincida):",
    "",
    `- C++: \`${cppSignature(spec)}\``,
    `- C: \`${cSignature(spec)}\``,
    `- Pascal: \`${pasSignature(spec)}\``,
    `- Python: \`${pySignatureLine(spec)}\``,
  ];
  return lines.join("\n");
}

// ---------- Constructie input/output de test (aceeasi conventie ca wrapperele) ----------

function formatScalarValue(value, of) {
  if (of === "bool") return value ? "1" : "0";
  if (of === "real") return Number(value).toFixed(REAL_DECIMALS);
  return String(value);
}

function buildInputText(rawSpec, args) {
  const spec = validateSpec(rawSpec);
  const lines = [];
  for (const param of spec.params) {
    const t = parseType(param.type);
    const value = args[param.name];
    if (value === undefined) throw new Error(`Lipseste valoarea pentru parametrul '${param.name}'`);
    if (t.kind === "scalar") {
      lines.push(formatScalarValue(value, t.of));
    } else if (t.kind === "array") {
      lines.push(value.map((v) => formatScalarValue(v, t.of)).join(" "));
    } else if (t.kind === "matrix") {
      for (const row of value) {
        lines.push(row.map((v) => formatScalarValue(v, t.of)).join(" "));
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

function buildOutputText(rawSpec, result) {
  const spec = validateSpec(rawSpec);
  if (spec.returns.mode === "value") {
    const t = parseType(spec.returns.type);
    if (t.kind === "scalar") return `${formatScalarValue(result, t.of)}\n`;
    return `${result.map((v) => formatScalarValue(v, t.of)).join(" ")}\n`;
  }
  if (spec.returns.mode === "out-params") {
    const parts = spec.returns.outs.map((o) => formatScalarValue(result[o.name], parseType(o.type).of));
    return `${parts.join(" ")}\n`;
  }
  if (spec.returns.mode === "mutate-array") {
    const target = findParam(spec, spec.returns.paramName);
    const tt = parseType(target.type);
    return `${result.map((v) => formatScalarValue(v, tt.of)).join(" ")}\n`;
  }
  throw new Error("mod de retur nesuportat pentru buildOutputText");
}

function generateArtifacts(rawSpec) {
  const spec = validateSpec(rawSpec);
  return {
    signature: humanSignature(spec),
    templates: {
      cpp: cppWrapper(spec),
      c: cWrapper(spec),
      pascal: pasWrapper(spec),
      python: pyWrapper(spec),
    },
    stubs: {
      cpp: cppStub(spec),
      c: cStub(spec),
      pascal: pasStub(spec),
      python: pyStub(spec),
    },
  };
}

module.exports = { generateArtifacts, buildInputText, buildOutputText, buildSignatureBlock, parseType, REAL_DECIMALS };
