// ========================================================
// 1. DEFINIM TOATE BLOCURILE ÎNAINTE DE BLOCKLY.inject()
// ========================================================

// ---- CITESTE ----
Blockly.Blocks['citeste'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("citește")
            .appendField(new Blockly.FieldTextInput("x"), "VAR");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(90);
    }
};

// ---- SCRIE ----
Blockly.Blocks['scrie'] = {
    init: function () {
        this.appendValueInput("VAL")
            .appendField("scrie");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(90);
    }
};

// ---- DACA-ALTFEL ----
Blockly.Blocks['daca_altfel'] = {
    init: function () {
        this.appendValueInput("COND")
            .setCheck("Boolean")
            .appendField("dacă");
        this.appendStatementInput("THEN")
            .appendField("atunci");
        this.appendStatementInput("ELSE")
            .appendField("altfel");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(160);
    }
};

// ---- CAT TIMP ----
Blockly.Blocks['cat_timp'] = {
    init: function () {
        this.appendValueInput("COND")
            .setCheck("Boolean")
            .appendField("cât timp");
        this.appendStatementInput("DO")
            .appendField("execută");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(210);
    }
};

// ---- RELATIONAL OP ----
Blockly.Blocks['relational_op'] = {
    init: function () {
        this.appendValueInput("A");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["=", "="],
                ["≠", "!="],
                ["<", "<"],
                ["≤", "<="],
                [">", ">"],
                ["≥", ">="]
            ]), "OP");
        this.appendValueInput("B");
        this.setOutput(true, "Boolean");
        this.setColour(200);
    }
};

// ---- LOGIC AND/OR ----
Blockly.Blocks['logic_op'] = {
    init: function () {
        this.appendValueInput("A").setCheck("Boolean");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["și", "AND"],
                ["sau", "OR"]
            ]), "OP");
        this.appendValueInput("B").setCheck("Boolean");
        this.setOutput(true, "Boolean");
        this.setColour(200);
    }
};

// ---- LOGIC NOT ----
Blockly.Blocks['logic_not'] = {
    init: function () {
        this.appendValueInput("A").setCheck("Boolean")
            .appendField("nu");
        this.setOutput(true, "Boolean");
        this.setColour(200);
    }
};

// ---- MODULO ----
Blockly.Blocks['math_modulo'] = {
    init: function () {
        this.appendValueInput("A");
        this.appendDummyInput().appendField("%");
        this.appendValueInput("B");
        this.setOutput(true);
        this.setColour(200);
    }
};

// ========================================================
// 2. BLOCKLY.inject() — ABIA ACUM este legal să-l facem
// ========================================================

var workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    trashcan: true
});

// ========================================================
// 3. GENERATOR PSEUDOCOD
// ========================================================

Blockly.Pseudocode = new Blockly.Generator('Pseudocode');
Blockly.Pseudocode.ORDER_ATOMIC = 0;
Blockly.Pseudocode.level = 0;

function indent() {
    return "│   ".repeat(Blockly.Pseudocode.level);
}

// ---- GENERATORS ----

Blockly.Pseudocode['citeste'] = function (block) {
    return indent() + "citește " + block.getFieldValue('VAR') + "\n";
};

Blockly.Pseudocode['scrie'] = function (block) {
    var v = Blockly.Pseudocode.valueToCode(block, 'VAL') || "";
    return indent() + "scrie " + v + "\n";
};

Blockly.Pseudocode['variables_set'] = function (block) {
    var a = block.getFieldValue('VAR');
    var b = Blockly.Pseudocode.valueToCode(block, 'VALUE') || "0";
    return indent() + a + " ← " + b + "\n";
};

Blockly.Pseudocode['variables_get'] = function (block) {
    return block.getFieldValue('VAR');
};

Blockly.Pseudocode['math_number'] = function (block) {
    return block.getFieldValue('NUM');
};

Blockly.Pseudocode['math_arithmetic'] = function (block) {
    var A = Blockly.Pseudocode.valueToCode(block, 'A') || "0";
    var B = Blockly.Pseudocode.valueToCode(block, 'B') || "0";
    return "(" + A + " " + block.getFieldValue('OP') + " " + B + ")";
};

Blockly.Pseudocode['math_modulo'] = function (block) {
    var A = Blockly.Pseudocode.valueToCode(block, 'A');
    var B = Blockly.Pseudocode.valueToCode(block, 'B');
    return "(" + A + " % " + B + ")";
};

Blockly.Pseudocode['relational_op'] = function (block) {
    var A = Blockly.Pseudocode.valueToCode(block, 'A') || "";
    var B = Blockly.Pseudocode.valueToCode(block, 'B') || "";
    return "(" + A + " " + block.getFieldValue('OP') + " " + B + ")";
};

Blockly.Pseudocode['logic_op'] = function (block) {
    var op = (block.getFieldValue('OP') === "AND") ? "și" : "sau";
    var A = Blockly.Pseudocode.valueToCode(block, 'A');
    var B = Blockly.Pseudocode.valueToCode(block, 'B');
    return "(" + A + " " + op + " " + B + ")";
};

Blockly.Pseudocode['logic_not'] = function (block) {
    var A = Blockly.Pseudocode.valueToCode(block, 'A');
    return "(nu " + A + ")";
};

Blockly.Pseudocode['daca_altfel'] = function (block) {
    var cond = Blockly.Pseudocode.valueToCode(block, 'COND') || "";
    var code = indent() + "dacă " + cond + " atunci\n";

    Blockly.Pseudocode.level++;
    code += Blockly.Pseudocode.statementToCode(block, 'THEN');
    Blockly.Pseudocode.level--;

    code += indent() + "altfel\n";

    Blockly.Pseudocode.level++;
    code += Blockly.Pseudocode.statementToCode(block, 'ELSE');
    Blockly.Pseudocode.level--;

    code += indent() + "sf_dacă\n";
    return code;
};

Blockly.Pseudocode['cat_timp'] = function (block) {
    var cond = Blockly.Pseudocode.valueToCode(block, 'COND') || "";
    var code = indent() + "cât timp " + cond + " execută\n";

    Blockly.Pseudocode.level++;
    code += Blockly.Pseudocode.statementToCode(block, 'DO');
    Blockly.Pseudocode.level--;

    code += indent() + "sf_cât timp\n";
    return code;
};

// ========================================================
// 4. GENERARE COD
// ========================================================

document.getElementById("genereaza").onclick = function () {
    Blockly.Pseudocode.level = 0;
    document.getElementById("pseudocode").textContent =
        Blockly.Pseudocode.workspaceToCode(workspace);
};
