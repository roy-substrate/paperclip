// gstack runs on Claude Code, so stdout parsing is identical
export { parseClaudeStdoutLine as parseGstackStdoutLine } from "@paperclipai/adapter-claude-local/ui";
export { buildGstackLocalConfig } from "./build-config.js";
