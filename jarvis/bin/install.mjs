#!/usr/bin/env node

/**
 * J.A.R.V.I.S. Hook Installer
 *
 * Adds Jarvis hooks to ~/.claude/settings.json so Claude Code
 * automatically triggers voice announcements on lifecycle events.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOOK_SCRIPT = path.join(__dirname, "..", "hooks", "jarvis-hook.mjs");
const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");

// All hook events Jarvis listens to, with matchers
const JARVIS_HOOKS = {
  SessionStart: [{ matcher: "" }],
  SessionEnd: [{ matcher: "" }],
  Notification: [{ matcher: "" }],
  PermissionRequest: [{ matcher: "" }],
  PreToolUse: [{ matcher: "Agent" }],
  PostToolUse: [{ matcher: "Bash" }],
  PostToolUseFailure: [{ matcher: "" }],
  Stop: [{ matcher: "" }],
  StopFailure: [{ matcher: "" }],
  SubagentStop: [{ matcher: "" }],
  PreCompact: [{ matcher: "" }],
};

function buildHookEntry(eventName) {
  return {
    type: "command",
    command: `node "${HOOK_SCRIPT}" ${eventName}`,
    timeout: 15,
  };
}

export async function installHooks() {
  // Ensure ~/.claude/ exists
  const claudeDir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Read existing settings
  let settings = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
    } catch {
      console.error("[JARVIS] Warning: Could not parse existing settings.json, creating fresh.");
      settings = {};
    }
  }

  if (!settings.hooks) {
    settings.hooks = {};
  }

  let added = 0;
  let skipped = 0;

  for (const [eventName, matchers] of Object.entries(JARVIS_HOOKS)) {
    if (!settings.hooks[eventName]) {
      settings.hooks[eventName] = [];
    }

    for (const { matcher } of matchers) {
      // Check if Jarvis hook already exists for this event+matcher
      const existing = settings.hooks[eventName].find((entry) => {
        if (!entry.hooks) return false;
        return entry.hooks.some((h) => h.command && h.command.includes("jarvis-hook.mjs"));
      });

      if (existing) {
        skipped++;
        continue;
      }

      settings.hooks[eventName].push({
        matcher,
        hooks: [buildHookEntry(eventName)],
      });
      added++;
    }
  }

  // Write back
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n", "utf8");

  console.log("[JARVIS] Hook installation complete.");
  console.log(`  Added: ${added} hooks`);
  console.log(`  Skipped: ${skipped} (already installed)`);
  console.log(`  Settings: ${SETTINGS_PATH}`);
  console.log(`  Hook script: ${HOOK_SCRIPT}`);
  console.log("");
  console.log("[JARVIS] Restart Claude Code for hooks to take effect.");
}
