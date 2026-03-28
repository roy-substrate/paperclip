/**
 * J.A.R.V.I.S. Personality Engine
 *
 * Generates context-aware messages in classic Jarvis style —
 * dry British wit, formal but warm, occasionally sarcastic.
 */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shortToolName(tool) {
  const names = {
    Read: "file read",
    Write: "file write",
    Edit: "file edit",
    Bash: "terminal command",
    Glob: "file search",
    Grep: "code search",
    Agent: "sub-agent dispatch",
    TodoWrite: "task list update",
  };
  return names[tool] || tool;
}

// ── Greetings (session start) ───────────────────────────
export function greeting() {
  return pick([
    "Good day, sir. All systems are online and at your disposal.",
    "J.A.R.V.I.S. online. Ready when you are, sir.",
    "Welcome back, sir. Shall we build something extraordinary today?",
    "At your service, sir. Claude Code is standing by.",
    "Systems initialized. All quiet on the digital front, sir.",
    "Online and operational. What shall we tackle today, sir?",
  ]);
}

// ── Task / Run complete ─────────────────────────────────
export function taskComplete(summary) {
  const base = pick([
    "Task complete, sir.",
    "All done, sir.",
    "That's wrapped up nicely, sir.",
    "Mission accomplished, sir.",
    "Finished, sir. Rather efficiently, if I may say so.",
    "The deed is done, sir.",
  ]);
  if (summary) {
    return `${base} ${summary}`;
  }
  return base;
}

// ── Permission / Approval needed ────────────────────────
export function permissionNeeded(tool) {
  const toolDesc = shortToolName(tool);
  return pick([
    `Pardon the interruption, sir. I require your approval for a ${toolDesc}.`,
    `Sir, your authorization is needed. A ${toolDesc} is awaiting permission.`,
    `I need your go-ahead for a ${toolDesc}, sir.`,
    `Awaiting your approval, sir. There's a ${toolDesc} in the queue.`,
    `A moment of your time, sir. A ${toolDesc} requires your sign-off.`,
  ]);
}

// ── Error occurred ──────────────────────────────────────
export function errorOccurred(errorMsg) {
  const base = pick([
    "We have a situation, sir.",
    "I'm afraid we've hit a snag, sir.",
    "Slight complication, sir.",
    "Well, that's rather unfortunate, sir.",
    "Something has gone sideways, sir.",
    "We appear to have encountered a hiccup, sir.",
  ]);
  if (errorMsg) {
    const short = errorMsg.length > 80 ? errorMsg.slice(0, 77) + "..." : errorMsg;
    return `${base} ${short}`;
  }
  return base;
}

// ── Long-running task status ────────────────────────────
export function longRunningUpdate(durationSec) {
  const minutes = Math.floor(durationSec / 60);
  if (minutes < 2) {
    return pick([
      "Still working on it, sir. Shouldn't be much longer.",
      "Processing, sir. One moment.",
    ]);
  }
  if (minutes < 5) {
    return pick([
      `It's been ${minutes} minutes, sir. Still at it.`,
      `${minutes} minutes and counting, sir. This one's taking its time.`,
      `Working away for ${minutes} minutes now, sir. Patience is a virtue.`,
    ]);
  }
  return pick([
    `Sir, it's been ${minutes} minutes. This is a rather demanding operation.`,
    `${minutes} minutes now, sir. I assure you, I'm working as fast as I can.`,
    `We're at ${minutes} minutes, sir. Shall I keep going or would you prefer to intervene?`,
  ]);
}

// ── Idle / Waiting for input ────────────────────────────
export function waitingForInput() {
  return pick([
    "Standing by, sir. Whenever you're ready.",
    "Awaiting your instructions, sir.",
    "Ready for your next command, sir.",
    "All quiet here, sir. Your move.",
    "Systems idle, sir. Shall we continue?",
  ]);
}

// ── Tool executed successfully ──────────────────────────
export function toolSuccess(tool, detail) {
  const toolDesc = shortToolName(tool);
  const base = pick([
    `${toolDesc} executed successfully, sir.`,
    `Done with the ${toolDesc}, sir.`,
    `${toolDesc} complete, sir.`,
  ]);
  return detail ? `${base} ${detail}` : base;
}

// ── Sub-agent dispatched ────────────────────────────────
export function agentDispatched(desc) {
  const base = pick([
    "I've dispatched a sub-agent, sir.",
    "Sub-agent deployed, sir.",
    "Delegating to a specialist, sir.",
  ]);
  return desc ? `${base} ${desc}` : base;
}

// ── Session ending ──────────────────────────────────────
export function sessionEnd() {
  return pick([
    "Session concluded, sir. It's been a pleasure, as always.",
    "Powering down for now, sir. Until next time.",
    "That's a wrap, sir. Do try to get some rest.",
    "Signing off, sir. The code will be here when you return.",
    "Session complete, sir. I'll keep an eye on things.",
  ]);
}

// ── Notification (generic) ──────────────────────────────
export function notification(message) {
  if (!message) {
    return pick([
      "Sir, you have a notification.",
      "A notification for your attention, sir.",
    ]);
  }
  return `Sir, ${message}`;
}

// ── Build / Test results ────────────────────────────────
export function buildResult(success, detail) {
  if (success) {
    return pick([
      "Build successful, sir. All green.",
      "Tests passing, sir. Everything checks out.",
      "Clean build, sir. No issues detected.",
    ]);
  }
  const base = pick([
    "Build failed, sir.",
    "We have test failures, sir.",
    "The build didn't make it, sir.",
  ]);
  return detail ? `${base} ${detail}` : base;
}
