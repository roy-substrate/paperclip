import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import { asString, asStringArray, parseObject } from "@paperclipai/adapter-utils/server-utils";
import { execute as claudeExecute } from "@paperclipai/adapter-claude-local/server";

const DEFAULT_GSTACK_PATH = path.join(os.homedir(), ".claude", "skills", "gstack");

async function resolveGstackPath(config: Record<string, unknown>): Promise<string> {
  const configured = asString(config.gstackPath, "").trim();
  return configured || DEFAULT_GSTACK_PATH;
}

async function gstackExists(gstackPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(gstackPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Execute a gstack-powered Claude Code agent.
 *
 * gstack skills are installed at ~/.claude/skills/gstack (or a custom path).
 * We inject the gstack path as an extra --add-dir so Claude Code discovers
 * the skills, then delegate to the standard claude_local execute.
 */
export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = { ...ctx.config };
  const gstackPath = await resolveGstackPath(config);

  if (await gstackExists(gstackPath)) {
    // Inject gstack skills dir via extraArgs so Claude Code discovers them
    const existing = asStringArray(config.extraArgs);
    config.extraArgs = [...existing, "--add-dir", gstackPath];
  } else {
    await ctx.onLog(
      "stderr",
      `[paperclip] Warning: gstack not found at "${gstackPath}". Running as plain Claude Code. Install: git clone https://github.com/garrytan/gstack.git ${gstackPath} && cd ${gstackPath} && ./setup\n`,
    );
  }

  // Remove gstackPath from config so claude_local doesn't see unknown keys
  delete config.gstackPath;

  return claudeExecute({ ...ctx, config });
}
