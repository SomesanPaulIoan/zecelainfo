const { runMain } = require("./lib/oop-runner");
const m1 = require("./seed-oop-batch1.js");
const m2 = require("./seed-oop-batch2.js");
const m3 = require("./seed-oop-batch3.js");
const m4 = require("./seed-oop-batch4.js");
const m5 = require("./seed-oop-batch5.js");
const m6 = require("./seed-oop-batch6.js");
const m7 = require("./seed-oop-batch7.js");
const m8 = require("./seed-oop-batch8.js");
const m9 = require("./seed-oop-batch9.js");
const m10 = require("./seed-oop-batch10.js");
const m11 = require("./seed-oop-batch11.js");
const m12 = require("./seed-oop-batch12.js");

const all = [
  ...m1.problems1, ...m2.problems2, ...m3.problems3, ...m4.problems4a, ...m4.problems4b,
  ...m5.problems5, ...m6.problems6, ...m7.problems7, ...m8.problems8a, ...m8.problems8b, ...m8.problems8c,
  ...m9.problems9, ...m10.problems10, ...m11.problems11, ...m12.problems12,
];

runMain(all, "oop", "Zece la Info - OOP (probleme originale)");
