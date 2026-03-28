import type { UIAdapterModule } from "../types";
import { parseGstackStdoutLine } from "@paperclipai/adapter-gstack-local/ui";
import { GstackLocalConfigFields } from "./config-fields";
import { buildGstackLocalConfig } from "@paperclipai/adapter-gstack-local/ui";

export const gstackLocalUIAdapter: UIAdapterModule = {
  type: "gstack_local",
  label: "gstack (local)",
  parseStdoutLine: parseGstackStdoutLine,
  ConfigFields: GstackLocalConfigFields,
  buildAdapterConfig: buildGstackLocalConfig,
};
