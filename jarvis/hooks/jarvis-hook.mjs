#!/usr/bin/env node

/**
 * J.A.R.V.I.S. — Unified Claude Code Hook Handler
 *
 * Single entry point for all hook events. Reads the event type
 * from argv[2] and stdin JSON, generates a Jarvis-style message,
 * and speaks it aloud.
 *
 * Usage:  node jarvis-hook.mjs <event-type>
 * Stdin:  JSON payload from Claude Code hook system
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..", "src");

// Load env vars from ~/.claude/jarvis-env.json (for desktop app support)
// Desktop apps don't inherit shell env vars, so the installer saves them here.
try {
  const envFile = path.join(os.homedir(), ".claude", "jarvis-env.json");
  const envData = JSON.parse(fs.readFileSync(envFile, "utf8"));
  for (const [key, value] of Object.entries(envData)) {
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // No env file or parse error — that's fine, use process.env as-is
}

// Dynamic import so paths resolve correctly
const { speak } = await import(path.join(srcDir, "voice.mjs"));
const personality = await import(path.join(srcDir, "personality.mjs"));

// ── Read stdin ──────────────────────────────────────────
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    // If no stdin within 500ms, resolve empty
    setTimeout(() => resolve({}), 500);
  });
}

// ── State file for tracking long-running ops ────────────

const STATE_FILE = path.join(os.tmpdir(), "jarvis-state.json");

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state), "utf8");
}

// ── Main ────────────────────────────────────────────────
const eventType = process.argv[2] || "unknown";
const input = await readStdin();

const toolName = input.tool_name || "";
const toolInput = input.tool_input || {};

let message = null;

switch (eventType) {
  // ── Session lifecycle ─────────────────────────────────
  case "SessionStart": {
    message = personality.greeting();
    writeState({ sessionStart: Date.now(), toolCount: 0 });
    break;
  }

  case "SessionEnd": {
    message = personality.sessionEnd();
    break;
  }

  // ── Notification (permission prompts, idle) ───────────
  case "Notification": {
    const state = readState();
    // Debounce: don't announce more than once per 10 seconds
    if (state.lastNotification && Date.now() - state.lastNotification < 10000) {
      break;
    }
    message = personality.permissionNeeded(toolName || "action");
    writeState({ ...state, lastNotification: Date.now() });
    break;
  }

  // ── Permission Request ────────────────────────────────
  case "PermissionRequest": {
    message = personality.permissionNeeded(toolName);
    break;
  }

  // ── Tool lifecycle ────────────────────────────────────
  case "PreToolUse": {
    // Only announce for "big" tools, not every Read/Grep
    if (toolName === "Agent") {
      const desc = toolInput.description || toolInput.prompt?.slice(0, 50) || "";
      message = personality.agentDispatched(desc);
    }
    // Track tool count for long-running detection
    const state = readState();
    state.toolCount = (state.toolCount || 0) + 1;
    state.lastToolTime = Date.now();
    writeState(state);
    break;
  }

  case "PostToolUse": {
    // Only announce for significant completions
    if (toolName === "Bash") {
      const cmd = toolInput.command || "";
      // Detect build/test commands
      if (/\b(test|build|deploy|push|install)\b/i.test(cmd)) {
        message = personality.buildResult(true, `Command: ${cmd.slice(0, 50)}`);
      }
    }
    break;
  }

  case "PostToolUseFailure": {
    const errorMsg = input.error || input.tool_error || "";
    message = personality.errorOccurred(
      typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg).slice(0, 80)
    );
    break;
  }

  // ── Stop (Claude finished responding) ─────────────────
  case "Stop": {
    const state = readState();
    const toolCount = state.toolCount || 0;
    const elapsed = state.sessionStart
      ? Math.floor((Date.now() - state.sessionStart) / 1000)
      : 0;

    if (toolCount > 5) {
      // Substantial work was done
      message = personality.taskComplete(
        `Completed ${toolCount} operations in ${elapsed} seconds.`
      );
    } else if (toolCount > 0) {
      message = personality.taskComplete();
    } else {
      message = personality.waitingForInput();
    }

    // Reset tool count for next turn
    writeState({ ...state, toolCount: 0 });
    break;
  }

  case "StopFailure": {
    const errorType = input.error_type || "unknown error";
    message = personality.errorOccurred(`API error: ${errorType}`);
    break;
  }

  // ── Subagent lifecycle ────────────────────────────────
  case "SubagentStop": {
    const agentType = input.agent_type || "sub-agent";
    message = personality.toolSuccess("Agent", `${agentType} has completed its work.`);
    break;
  }

  // ── Long-running detection ────────────────────────────
  case "PreCompact": {
    message = personality.longRunningUpdate(300);
    break;
  }

  default:
    // Unknown event — stay silent
    break;
}

if (message) {
  await speak(message);
}

// Always exit 0 so we never block Claude Code
process.exit(0);
