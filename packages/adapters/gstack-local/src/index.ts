export const type = "gstack_local";
export const label = "gstack (local)";

// gstack runs on Claude Code, so it supports the same models
export const models = [
  { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-6", label: "Claude Haiku 4.6" },
  { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
];

export const agentConfigurationDoc = `# gstack_local agent configuration

Adapter: gstack_local

gstack is an open-source AI agent framework by Garry Tan that transforms Claude Code
into a virtual engineering team with 28+ specialized AI agents and tools.
See: https://github.com/garrytan/gstack

Use when:
- You want a team of specialized AI agents (QA, reviewer, security officer, release manager, etc.)
- You want built-in headless browser testing via the browse tool
- You want structured sprint workflows (Think > Plan > Build > Review > Test > Ship > Reflect)
- You need specialized roles like /qa, /review, /ship, /cso, /investigate, /benchmark

Don't use when:
- You only need vanilla Claude Code without specialized roles (use claude_local)
- You need webhook-style external invocation (use openclaw_gateway or http)
- gstack is not installed on the machine

Core fields:
- cwd (string, optional): default absolute working directory fallback for the agent process
- instructionsFilePath (string, optional): absolute path to a markdown instructions file injected at runtime
- gstackPath (string, optional): absolute path to gstack installation (defaults to ~/.claude/skills/gstack)
- model (string, optional): Claude model id
- effort (string, optional): reasoning effort passed via --effort (low|medium|high)
- chrome (boolean, optional): pass --chrome when running Claude (enables browse tool's live Chrome)
- promptTemplate (string, optional): run prompt template
- maxTurnsPerRun (number, optional): max turns for one run
- dangerouslySkipPermissions (boolean, optional): pass --dangerously-skip-permissions to claude
- command (string, optional): defaults to "claude"
- extraArgs (string[], optional): additional CLI args
- env (object, optional): KEY=VALUE environment variables

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): SIGTERM grace period in seconds

gstack skills available:
- /office-hours: Product strategy and assumption challenging
- /plan-ceo-review: Executive-level scope assessment
- /plan-eng-review: Architecture and technical validation
- /plan-design-review: UI/UX validation
- /review: Production bug analysis with auto-fixes
- /investigate: Systematic debugging workflows
- /qa: Real browser testing with bug detection
- /ship: Testing and automated PR creation
- /land-and-deploy: Merging and production verification
- /cso: OWASP Top 10 + STRIDE threat modeling audits
- /canary: Post-deployment health monitoring
- /benchmark: Performance metric tracking
- /document-release: Auto-updates project docs
- /browse: Headless Chromium browser tool

Notes:
- gstack must be installed at the configured path (default ~/.claude/skills/gstack)
- Install: git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
- gstack runs on top of Claude Code; all Claude Code features remain available
- The browse tool provides headless Chromium automation (~100ms per command)
`;
