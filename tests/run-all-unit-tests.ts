import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const unitDir = path.join(__dirname, "unit");
const files = fs.readdirSync(unitDir).filter((f) => f.endsWith(".ts"));

console.log(`Running all ${files.length} unit tests in tests/unit/...\n`);

let passedCount = 0;
let failedCount = 0;
const failedTests: string[] = [];

for (const file of files) {
  const filePath = path.join(unitDir, file);
  process.stdout.write(`Testing ${file}... `);
  try {
    execSync(`npx tsx "${filePath}"`, { stdio: "pipe" });
    console.log("PASS");
    passedCount++;
  } catch (err: unknown) {
    console.log("FAIL");
    failedCount++;
    const e = err as { stdout?: Buffer; stderr?: Buffer; message: string };
    const errOutput = e.stderr?.toString() || e.stdout?.toString() || e.message;
    failedTests.push(`\n=== FAILED: ${file} ===\n${errOutput}`);
  }
}

console.log(`\n========================================`);
console.log(`Results: ${passedCount} passed, ${failedCount} failed (${files.length} total)`);
console.log(`========================================`);

if (failedCount > 0) {
  console.error("\nFailure Details:");
  for (const f of failedTests) {
    console.error(f);
  }
  process.exit(1);
} else {
  console.log("\nALL UNIT TESTS PASSED WITH 100% SUCCESS RATE!");
}
