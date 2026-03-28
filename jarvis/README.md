# J.A.R.V.I.S.

**Just A Rather Very Intelligent System** — A voice notification assistant for Claude Code.

Jarvis speaks aloud when important events happen during your Claude Code session: task completions, permission requests, errors, session start/end, and more. Think Iron Man's AI butler, but for your terminal.

## Quick Start

```bash
# Install hooks into Claude Code
node jarvis/bin/jarvis.mjs install

# Restart Claude Code — Jarvis is now active

# Test voice output
node jarvis/bin/jarvis.mjs test

# Uninstall when done
node jarvis/bin/jarvis.mjs uninstall
```

## How It Works

Jarvis uses [Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) — shell commands that fire automatically on lifecycle events. The installer adds hook entries to `~/.claude/settings.json` that call `jarvis-hook.mjs` with event data via stdin.

### Events Handled

| Event | What Jarvis Says |
|---|---|
| **SessionStart** | Greeting ("All systems online, sir.") |
| **SessionEnd** | Farewell ("Signing off, sir.") |
| **Stop** | Task summary with tool count and elapsed time |
| **StopFailure** | API error announcement |
| **Notification** | Permission prompt (debounced to 10s) |
| **PermissionRequest** | Tool-specific approval request |
| **PreToolUse** | Agent dispatch announcement (Agent tool only) |
| **PostToolUse** | Build/test result (Bash tool only) |
| **PostToolUseFailure** | Error description |
| **SubagentStop** | Sub-agent completion |
| **PreCompact** | Long-running task update |

## Voice Engines

Jarvis tries voice engines in this order:

1. **ElevenLabs API** — Premium AI voice (requires API key)
2. **System TTS** — Platform-native fallback:
   - **macOS**: `say` command (Daniel voice, rate 180)
   - **Linux**: `espeak-ng` → `espeak` → `spd-say` → `piper`
   - **Windows**: PowerShell SAPI
3. **Stderr** — If no TTS is available, messages print to stderr

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|---|---|---|
| `ELEVENLABS_API_KEY` | *(none)* | ElevenLabs API key for premium voice |
| `JARVIS_VOICE_ID` | `onwK4e9ZLuTAKqWW03F9` | ElevenLabs voice ID (default: Daniel) |
| `JARVIS_MODEL` | `eleven_turbo_v2_5` | ElevenLabs model |
| `JARVIS_MACOS_VOICE` | `Daniel` | macOS `say` voice name |
| `JARVIS_MACOS_RATE` | `180` | macOS `say` speech rate |

## CLI Commands

```
jarvis test        — Test voice engine with a greeting
jarvis install     — Install Claude Code hooks
jarvis uninstall   — Remove Claude Code hooks
jarvis status      — Show current configuration
jarvis say <text>  — Speak arbitrary text
jarvis help        — Show help
```

## Architecture

```
jarvis/
├── bin/
│   ├── jarvis.mjs      # CLI entry point
│   ├── install.mjs      # Hook installer
│   └── uninstall.mjs    # Hook uninstaller
├── hooks/
│   └── jarvis-hook.mjs  # Unified hook handler (all events)
├── src/
│   ├── voice.mjs        # TTS engine (ElevenLabs + system fallback)
│   └── personality.mjs  # Message generator (Jarvis-style wit)
└── package.json
```

### Key Design Decisions

- **Single hook handler** — One script (`jarvis-hook.mjs`) handles all events, reading the event type from `argv[2]` and payload from stdin JSON.
- **State tracking** — A temp file (`/tmp/jarvis-state.json`) tracks session start time, tool count, and debounce timestamps across hook invocations.
- **Always exits 0** — The hook never blocks Claude Code, even if TTS fails.
- **Debounced notifications** — Notification events are throttled to once per 10 seconds to prevent spam.
- **Smart filtering** — Only announces "big" events: Agent dispatches (not every file read), build/test commands (not every `ls`).

## Installing a TTS Engine (Linux)

```bash
# Best quality free option
sudo apt install espeak-ng

# Alternative
sudo apt install espeak

# Or for speech-dispatcher
sudo apt install speech-dispatcher
```

## License

Part of the [Paperclip](https://github.com/roy-substrate/paperclip) project.
