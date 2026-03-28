#!/usr/bin/env node

/**
 * J.A.R.V.I.S. Hook Installer
 *
 * Adds Jarvis hooks to ~/.claude/settings.json so Claude Code
 * automatically triggers voice announcements on lifecycle events.
 *
 * Resolves absolute paths to `node` and the hook script so it works
 * in the desktop app (which doesn't inherit shell env vars).
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOOK_SCRIPT = path.join(__dirname, "..", "hooks", "jarvis-hook.mjs");
const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
const ENV_FILE = path.join(os.homedir(), ".claude", "jarvis-env.json");

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

function findNodePath() {
  // Try to find absolute path to node so desktop app can use it
  try {
    // Check common shell to resolve the right node (respects nvm/fnm/volta)
    const shell = process.env.SHELL || "/bin/zsh";
    const nodePath = execSync(`${shell} -ilc "which node" 2>/dev/null`, {
      encoding: "utf8",
    }).trim();
    if (nodePath && fs.existsSync(nodePath)) return nodePath;
  } catch {
    // fall through
  }

  // Try process.execPath (current node)
  if (fs.existsSync(process.execPath)) return process.execPath;

  // Common locations
  for (const p of [
    "/usr/local/bin/node",
    "/opt/homebrew/bin/node",
    `${os.homedir()}/.nvm/versions/node/current/bin/node`,
    `${os.homedir()}/.volta/bin/node`,
    `${os.homedir()}/.fnm/current/bin/node`,
  ]) {
    if (fs.existsSync(p)) return p;
  }

  return "node"; // fallback to bare name
}

function buildHookEntry(eventName, nodePath) {
  return {
    type: "command",
    command: `"${nodePath}" "${HOOK_SCRIPT}" ${eventName}`,
    timeout: 15,
  };
}

function saveEnvFile() {
  // Save relevant env vars to a file the hook can read at runtime
  // (desktop app won't have these in its environment)
  const env = {};
  if (process.env.ELEVENLABS_API_KEY) env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (process.env.JARVIS_VOICE_ID) env.JARVIS_VOICE_ID = process.env.JARVIS_VOICE_ID;
  if (process.env.JARVIS_MODEL) env.JARVIS_MODEL = process.env.JARVIS_MODEL;
  if (process.env.JARVIS_MACOS_VOICE) env.JARVIS_MACOS_VOICE = process.env.JARVIS_MACOS_VOICE;
  if (process.env.JARVIS_MACOS_RATE) env.JARVIS_MACOS_RATE = process.env.JARVIS_MACOS_RATE;

  if (Object.keys(env).length > 0) {
    fs.writeFileSync(ENV_FILE, JSON.stringify(env, null, 2) + "\n", "utf8");
    return true;
  }
  return false;
}

export async function installHooks() {
  // Ensure ~/.claude/ exists
  const claudeDir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Resolve absolute node path
  const nodePath = findNodePath();

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
        hooks: [buildHookEntry(eventName, nodePath)],
      });
      added++;
    }
  }

  // Write back
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n", "utf8");

  // Save env vars for desktop app
  const savedEnv = saveEnvFile();

  console.log("[JARVIS] Hook installation complete.");
  console.log(`  Added: ${added} hooks`);
  console.log(`  Skipped: ${skipped} (already installed)`);
  console.log(`  Node: ${nodePath}`);
  console.log(`  Settings: ${SETTINGS_PATH}`);
  console.log(`  Hook script: ${HOOK_SCRIPT}`);
  if (savedEnv) {
    console.log(`  Env vars: saved to ${ENV_FILE}`);
  }
  console.log("");
  console.log("[JARVIS] Restart Claude Code for hooks to take effect.");
}
