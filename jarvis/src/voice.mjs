/**
 * J.A.R.V.I.S. Voice Engine
 *
 * Speaks text aloud using:
 *   1. ElevenLabs API (premium AI voice) — if ELEVENLABS_API_KEY is set
 *   2. System TTS fallback — macOS `say`, Linux `espeak`/`piper`/`spd-say`
 *
 * All speech is async and non-blocking to avoid slowing down Claude Code.
 */

import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import https from "node:https";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const execAsync = promisify(exec);

// ── Config ──────────────────────────────────────────────
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
// Default to "Daniel" — a British male voice, closest to Jarvis
const ELEVENLABS_VOICE_ID = process.env.JARVIS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9";
const ELEVENLABS_MODEL = process.env.JARVIS_MODEL || "eleven_turbo_v2_5";

// ── ElevenLabs TTS ──────────────────────────────────────
function speakElevenLabs(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.85,
        style: 0.3,
      },
    });

    const options = {
      hostname: "api.elevenlabs.io",
      path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
        Accept: "audio/mpeg",
      },
    };

    const tmpFile = path.join(os.tmpdir(), `jarvis-${Date.now()}.mp3`);

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => reject(new Error(`ElevenLabs ${res.statusCode}: ${body}`)));
        return;
      }

      const fileStream = fs.createWriteStream(tmpFile);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        // Play the audio file
        playAudioFile(tmpFile)
          .then(resolve)
          .catch(reject)
          .finally(() => {
            fs.unlink(tmpFile, () => {});
          });
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("ElevenLabs request timed out"));
    });
    req.write(postData);
    req.end();
  });
}

// ── Audio Playback ──────────────────────────────────────
async function playAudioFile(filePath) {
  const platform = os.platform();
  let cmd;

  if (platform === "darwin") {
    cmd = `afplay "${filePath}"`;
  } else if (platform === "linux") {
    // Try multiple players
    for (const player of ["mpv --no-video", "ffplay -nodisp -autoexit", "aplay", "paplay"]) {
      const bin = player.split(" ")[0];
      try {
        await execAsync(`which ${bin}`);
        cmd = `${player} "${filePath}"`;
        break;
      } catch {
        continue;
      }
    }
    if (!cmd) {
      throw new Error("No audio player found (install mpv, ffplay, or aplay)");
    }
  } else {
    // Windows / other
    cmd = `start "" "${filePath}"`;
  }

  await execAsync(cmd);
}

// ── System TTS ──────────────────────────────────────────
async function speakSystem(text) {
  const platform = os.platform();
  // Sanitize for shell
  const safe = text.replace(/"/g, '\\"').replace(/`/g, "").replace(/\$/g, "");

  if (platform === "darwin") {
    // macOS: use `say` with a British-sounding voice
    const voice = process.env.JARVIS_MACOS_VOICE || "Daniel";
    const rate = process.env.JARVIS_MACOS_RATE || "180";
    await execAsync(`say -v "${voice}" -r ${rate} "${safe}"`);
    return;
  }

  if (platform === "linux") {
    // Try espeak-ng first (better quality), then espeak, then spd-say
    for (const [bin, buildCmd] of [
      ["espeak-ng", () => `espeak-ng -v en-gb -s 160 -p 40 "${safe}"`],
      ["espeak", () => `espeak -v en+m3 -s 160 -p 40 "${safe}"`],
      ["spd-say", () => `spd-say -l en -t female -r -20 "${safe}"`],
      ["piper", () => `echo "${safe}" | piper --model en_GB-alan-medium --output-raw | aplay -r 22050 -f S16_LE -c 1`],
    ]) {
      try {
        await execAsync(`which ${bin}`);
        await execAsync(buildCmd());
        return;
      } catch {
        continue;
      }
    }

    // Last resort: write to stderr so user at least sees it
    process.stderr.write(`[JARVIS] (no TTS engine found) ${text}\n`);
    return;
  }

  // Windows fallback
  const psCmd = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = 1; $s.Speak("${safe}")`;
  await execAsync(`powershell -Command "${psCmd.replace(/"/g, '\\"')}"`);
}

// ── Public API ──────────────────────────────────────────

/**
 * Speak text aloud. Tries ElevenLabs first, falls back to system TTS.
 * Non-blocking — fires and forgets (logs errors but doesn't throw).
 */
export async function speak(text) {
  if (!text || text.trim().length === 0) return;

  try {
    if (ELEVENLABS_API_KEY) {
      await speakElevenLabs(text);
      return;
    }
  } catch (err) {
    // ElevenLabs failed, fall through to system TTS
    process.stderr.write(`[JARVIS] ElevenLabs failed, using system TTS: ${err.message}\n`);
  }

  try {
    await speakSystem(text);
  } catch (err) {
    process.stderr.write(`[JARVIS] Voice error: ${err.message}\n`);
  }
}

/**
 * Fire-and-forget speak — starts speaking but doesn't await completion.
 * Use this in hooks where you don't want to block Claude Code.
 */
export function speakAsync(text) {
  speak(text).catch(() => {});
}

/**
 * Check which voice engine is available.
 */
export async function getVoiceInfo() {
  const info = {
    engine: "none",
    detail: "",
  };

  if (ELEVENLABS_API_KEY) {
    info.engine = "elevenlabs";
    info.detail = `Voice: ${ELEVENLABS_VOICE_ID}, Model: ${ELEVENLABS_MODEL}`;
    return info;
  }

  const platform = os.platform();
  if (platform === "darwin") {
    info.engine = "macos-say";
    info.detail = `Voice: ${process.env.JARVIS_MACOS_VOICE || "Daniel"}`;
    return info;
  }

  if (platform === "linux") {
    for (const bin of ["espeak-ng", "espeak", "spd-say", "piper"]) {
      try {
        await execAsync(`which ${bin}`);
        info.engine = bin;
        info.detail = `Using ${bin}`;
        return info;
      } catch {
        continue;
      }
    }
  }

  return info;
}
