#!/usr/bin/env node

/**
 * J.A.R.V.I.S. CLI
 *
 * Usage:
 *   jarvis test          — Test voice engine with a greeting
 *   jarvis install       — Install Claude Code hooks
 *   jarvis uninstall     — Remove Claude Code hooks
 *   jarvis status        — Show current configuration
 *   jarvis say <text>    — Speak arbitrary text
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..", "src");

const { speak, getVoiceInfo } = await import(path.join(srcDir, "voice.mjs"));
const personality = await import(path.join(srcDir, "personality.mjs"));

const command = process.argv[2] || "help";

switch (command) {
  case "test": {
    const info = await getVoiceInfo();
    console.log(`[JARVIS] Voice engine: ${info.engine} (${info.detail})`);
    console.log("[JARVIS] Speaking test greeting...");
    const msg = personality.greeting();
    console.log(`[JARVIS] "${msg}"`);
    await speak(msg);
    console.log("[JARVIS] Test complete.");
    break;
  }

  case "say": {
    const text = process.argv.slice(3).join(" ");
    if (!text) {
      console.error("Usage: jarvis say <text>");
      process.exit(1);
    }
    await speak(text);
    break;
  }

  case "install": {
    const { installHooks } = await import(path.join(__dirname, "install.mjs"));
    await installHooks();
    break;
  }

  case "uninstall": {
    const { uninstallHooks } = await import(path.join(__dirname, "uninstall.mjs"));
    await uninstallHooks();
    break;
  }

  case "status": {
    const info = await getVoiceInfo();
    console.log("╔═══════════════════════════════════════╗");
    console.log("║       J.A.R.V.I.S. Status            ║");
    console.log("╚═══════════════════════════════════════╝");
    console.log(`  Voice engine:  ${info.engine}`);
    console.log(`  Detail:        ${info.detail}`);
    console.log(`  ElevenLabs:    ${process.env.ELEVENLABS_API_KEY ? "configured" : "not set"}`);
    console.log(`  Hook script:   ${path.join(__dirname, "..", "hooks", "jarvis-hook.mjs")}`);
    break;
  }

  case "help":
  default:
    console.log(`
J.A.R.V.I.S. — Voice Assistant for Claude Code

Commands:
  jarvis test        Test voice engine with a greeting
  jarvis install     Install Claude Code hooks
  jarvis uninstall   Remove Claude Code hooks
  jarvis status      Show current configuration
  jarvis say <text>  Speak arbitrary text

Environment:
  ELEVENLABS_API_KEY   ElevenLabs API key for premium voice
  JARVIS_VOICE_ID      ElevenLabs voice ID (default: Daniel)
  JARVIS_MACOS_VOICE   macOS voice name (default: Daniel)
`);
    break;
}
