import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@paperclipai/adapter-utils";
import { asString, parseObject } from "@paperclipai/adapter-utils/server-utils";
import { testEnvironment as claudeTestEnvironment } from "@paperclipai/adapter-claude-local/server";

const DEFAULT_GSTACK_PATH = path.join(os.homedir(), ".claude", "skills", "gstack");

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  // Run Claude's environment checks first
  const claudeResult = await claudeTestEnvironment(ctx);
  const checks: AdapterEnvironmentCheck[] = [...claudeResult.checks];

  // Check gstack installation
  const config = parseObject(ctx.config);
  const gstackPath = asString(config.gstackPath, "").trim() || DEFAULT_GSTACK_PATH;

  try {
    const stat = await fs.stat(gstackPath);
    if (!stat.isDirectory()) {
      checks.push({
        code: "gstack_path_not_directory",
        level: "error",
        message: `gstack path exists but is not a directory: ${gstackPath}`,
        hint: `Remove the file and install gstack: git clone https://github.com/garrytan/gstack.git ${gstackPath} && cd ${gstackPath} && ./setup`,
      });
    } else {
      // Check for setup completion (browse binary should exist)
      const browsePath = path.join(gstackPath, "browse", "dist", "browse");
      let setupComplete = false;
      try {
        await fs.access(browsePath, fs.constants.X_OK);
        setupComplete = true;
      } catch {
        // browse binary not found or not executable
      }

      if (setupComplete) {
        checks.push({
          code: "gstack_installed",
          level: "info",
          message: `gstack is installed and set up at ${gstackPath}`,
        });
      } else {
        checks.push({
          code: "gstack_setup_incomplete",
          level: "warn",
          message: `gstack directory found at ${gstackPath} but setup may be incomplete.`,
          hint: `Run: cd ${gstackPath} && ./setup`,
        });
      }
    }
  } catch {
    checks.push({
      code: "gstack_not_installed",
      level: "warn",
      message: `gstack is not installed at ${gstackPath}`,
      hint: `Install gstack: git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ${gstackPath} && cd ${gstackPath} && ./setup`,
    });
  }

  return {
    adapterType: "gstack_local",
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
