#!/usr/bin/env node

/**
 * J.A.R.V.I.S. Hook Uninstaller
 *
 * Removes all Jarvis hooks from ~/.claude/settings.json.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");

export async function uninstallHooks() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    console.log("[JARVIS] No settings.json found. Nothing to uninstall.");
    return;
  }

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch {
    console.error("[JARVIS] Could not parse settings.json.");
    return;
  }

  if (!settings.hooks) {
    console.log("[JARVIS] No hooks configured. Nothing to uninstall.");
    return;
  }

  let removed = 0;

  for (const eventName of Object.keys(settings.hooks)) {
    const entries = settings.hooks[eventName];
    if (!Array.isArray(entries)) continue;

    const filtered = entries.filter((entry) => {
      if (!entry.hooks || !Array.isArray(entry.hooks)) return true;
      const hasJarvis = entry.hooks.some(
        (h) => h.command && h.command.includes("jarvis-hook.mjs")
      );
      if (hasJarvis) removed++;
      return !hasJarvis;
    });

    if (filtered.length === 0) {
      delete settings.hooks[eventName];
    } else {
      settings.hooks[eventName] = filtered;
    }
  }

  // Clean up empty hooks object
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n", "utf8");

  console.log("[JARVIS] Uninstallation complete.");
  console.log(`  Removed: ${removed} hooks`);
  console.log(`  Settings: ${SETTINGS_PATH}`);
}
