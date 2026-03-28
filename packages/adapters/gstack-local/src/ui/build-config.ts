import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { buildClaudeLocalConfig } from "@paperclipai/adapter-claude-local/ui";

export function buildGstackLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac = buildClaudeLocalConfig(v);
  if (v.gstackPath) ac.gstackPath = v.gstackPath;
  return ac;
}
