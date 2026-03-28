<p align="center">
  <img src="https://img.shields.io/badge/J.A.R.V.I.S.-Claude_Code-blue?style=for-the-badge" alt="JARVIS for Claude Code" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green?style=for-the-badge" alt="Node >= 18" />
  <img src="https://img.shields.io/badge/zero-dependencies-orange?style=for-the-badge" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/license-MIT-purple?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">J.A.R.V.I.S.</h1>
<p align="center"><strong>Just A Rather Very Intelligent System</strong></p>
<p align="center">
  A voice assistant for <a href="https://docs.anthropic.com/en/docs/claude-code">Claude Code</a> that speaks to you like Tony Stark's AI butler.<br/>
  Announces task completions, errors, permission requests, session events — all in classic Jarvis style.
</p>

---

## Demo

```
$ jarvis install
[JARVIS] Hook installation complete.
  Added: 11 hooks
  Node: /opt/homebrew/bin/node
  Settings: /Users/you/.claude/settings.json

[JARVIS] Restart Claude Code for hooks to take effect.
```

Then open Claude Code and hear:

> *"Good day, sir. All systems are online and at your disposal."*

When a task completes:

> *"Finished, sir. Rather efficiently, if I may say so. Completed 12 operations in 45 seconds."*

When something breaks:

> *"I'm afraid we've hit a snag, sir. TypeError: Cannot read property 'x' of undefined"*

---

## Install

```bash
# Clone and install globally (one command)
git clone https://github.com/roy-substrate/paperclip.git && cd paperclip/jarvis && npm install -g .

# Or if you already have the repo
cd paperclip/jarvis && npm install -g .
```

Then:

```bash
jarvis install     # Wire up Claude Code hooks
jarvis test        # Hear Jarvis speak
```

**Restart Claude Code** (Cmd+Q and reopen) for hooks to take effect.

Works in **Terminal CLI** and **Desktop App**.

---

## What It Does

Jarvis listens to **11 Claude Code lifecycle events** and speaks context-aware messages:

| Event | What You Hear |
|---|---|
| **Session starts** | *"Welcome back, sir. Shall we build something extraordinary today?"* |
| **Task completes** | *"All done, sir. Completed 8 operations in 30 seconds."* |
| **Permission needed** | *"Your authorization is needed. A terminal command is awaiting permission."* |
| **Error occurs** | *"We have a situation, sir. Module not found..."* |
| **Build/test runs** | *"Build successful, sir. All green."* |
| **Agent dispatched** | *"Delegating to a specialist, sir. Code review."* |
| **Session ends** | *"Signing off, sir. The code will be here when you return."* |
| **API error** | *"Something has gone sideways, sir. Rate limit exceeded."* |
| **Long-running task** | *"It's been 5 minutes, sir. This is a rather demanding operation."* |
| **Sub-agent done** | *"Sub-agent dispatch complete. Explore has completed its work."* |
| **Context compaction** | *"Still working on it, sir. Shouldn't be much longer."* |

Every message has **5-6 randomized variants** so it never gets repetitive.

---

## Voice Engines

Jarvis tries these in order:

| Priority | Engine | Setup |
|---|---|---|
| 1 | **ElevenLabs** | Set `ELEVENLABS_API_KEY` env var |
| 2 | **macOS `say`** | Works out of the box (Daniel voice) |
| 3 | **Linux TTS** | `apt install espeak-ng` |
| 4 | **stderr** | Prints message if no TTS available |

### ElevenLabs (Premium AI Voice)

```bash
export ELEVENLABS_API_KEY="sk_your_key_here"
jarvis install   # Saves key for desktop app too
```

Get a key at [elevenlabs.io](https://elevenlabs.io). Free tier works.

### macOS (Free, No Setup)

Works immediately on any Mac. Uses the built-in `say` command with the Daniel voice at rate 180.

```bash
# Customize voice (optional)
export JARVIS_MACOS_VOICE="Daniel"
export JARVIS_MACOS_RATE="180"
```

### Linux

```bash
sudo apt install espeak-ng   # Best free option
# Or: sudo apt install espeak
# Or: sudo apt install speech-dispatcher
```

---

## CLI Commands

```bash
jarvis install     # Install Claude Code hooks
jarvis uninstall   # Remove all hooks
jarvis test        # Test voice engine
jarvis status      # Show config and voice engine
jarvis say "text"  # Speak anything
jarvis help        # Show help
```

---

## How It Works

```
Claude Code Event (e.g. "task complete")
        |
        v
~/.claude/settings.json hooks
        |
        v
jarvis-hook.mjs [event-type]
  - Reads JSON payload from stdin
  - Picks message from personality.mjs
  - Sends to voice.mjs
        |
        v
voice.mjs
  - ElevenLabs API? -> stream audio
  - macOS? -> `say -v Daniel`
  - Linux? -> espeak-ng / espeak / spd-say
```

### Architecture

```
jarvis/
├── bin/
│   ├── jarvis.mjs        # CLI entry point
│   ├── install.mjs       # Hook installer (resolves absolute node path)
│   └── uninstall.mjs     # Hook uninstaller
├── hooks/
│   └── jarvis-hook.mjs   # Unified handler for all 11 events
├── src/
│   ├── voice.mjs         # TTS engine (ElevenLabs + system fallback)
│   └── personality.mjs   # Message library (Jarvis-style wit)
├── package.json
├── LICENSE
└── README.md
```

### Key Design Choices

- **Zero dependencies** — Only uses Node.js built-in modules
- **Single hook handler** — One script handles all 11 events
- **Always exits 0** — Never blocks Claude Code, even if TTS fails
- **Smart filtering** — Only announces significant events (builds, agents), not every file read
- **10s debounce** — Notifications are throttled to prevent spam
- **Desktop app support** — Resolves absolute `node` path and persists env vars to `~/.claude/jarvis-env.json`
- **State tracking** — Tracks session time and tool count via `/tmp/jarvis-state.json`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ELEVENLABS_API_KEY` | — | ElevenLabs API key for premium voice |
| `JARVIS_VOICE_ID` | `onwK4e9ZLuTAKqWW03F9` | ElevenLabs voice ID |
| `JARVIS_MODEL` | `eleven_turbo_v2_5` | ElevenLabs model |
| `JARVIS_MACOS_VOICE` | `Daniel` | macOS `say` voice name |
| `JARVIS_MACOS_RATE` | `180` | macOS `say` speech rate |

---

## Uninstall

```bash
jarvis uninstall          # Remove hooks from Claude Code
npm uninstall -g jarvis-claude-code  # Remove the CLI
```

---

## Requirements

- **Node.js >= 18**
- **Claude Code** (CLI, Desktop App, or VS Code extension)
- **macOS / Linux / Windows** (macOS has best out-of-box voice support)

---

## Troubleshooting

**No sound in Desktop App?**
Run `jarvis uninstall && jarvis install` in Terminal, then Cmd+Q and reopen the desktop app. The installer resolves the absolute path to `node` so the desktop app can find it.

**ElevenLabs 401 error?**
Your API key needs the `text_to_speech` permission. Check your plan at elevenlabs.io. Jarvis falls back to system TTS automatically.

**Linux no sound?**
Install a TTS engine: `sudo apt install espeak-ng`

**Want different personality?**
Edit `src/personality.mjs` — each function has an array of message variants. Add your own style.

---

## Contributing

PRs welcome. The code is simple — six files, zero dependencies, all ESM.

---

## License

MIT

---

<p align="center">
  <em>"At your service, sir."</em>
</p>
