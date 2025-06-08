// Simple cleanup script for removing build artifacts
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";

const execAsync = promisify(exec);

const filesToClean = [
  "dist",
  "dist-chrome",
  "dist-firefox",
  "dist-opera",
  "OmniRoll-Chrome.zip",
  "OmniRoll-Firefox.zip",
  "OmniRoll-Opera.zip",
];

async function cleanup() {
  console.log("🧹 Cleaning build artifacts...");

  for (const file of filesToClean) {
    try {
      if (fs.existsSync(file)) {
        if (fs.statSync(file).isDirectory()) {
          await execAsync(`Remove-Item -Recurse -Force "${file}"`, {
            shell: "powershell.exe",
          });
          console.log(`✅ Removed directory: ${file}`);
        } else {
          await execAsync(`Remove-Item -Force "${file}"`, {
            shell: "powershell.exe",
          });
          console.log(`✅ Removed file: ${file}`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not remove ${file}: ${error.message}`);
    }
  }

  console.log("🎉 Cleanup completed!");
}

cleanup().catch(console.error);
