import type { ShortcutActionId, ShortcutDefinition } from "./types";

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { id: "undo", label: "\uC2E4\uD589 \uCDE8\uC18C", defaultKeys: "ctrl+z", category: "\uD3B8\uC9D1" },
  { id: "redo", label: "\uB2E4\uC2DC \uC2E4\uD589", defaultKeys: "ctrl+shift+z", category: "\uD3B8\uC9D1" },
  { id: "save", label: "\uC800\uC7A5", defaultKeys: "ctrl+s", category: "\uD3B8\uC9D1" },
  { id: "delete", label: "\uC0AD\uC81C", defaultKeys: "delete", category: "\uD3B8\uC9D1" },
  { id: "deselect", label: "\uC120\uD0DD \uD574\uC81C", defaultKeys: "escape", category: "\uD3B8\uC9D1" },
  { id: "duplicate", label: "\uBCC0\uD615 \uBCF5\uC81C (Clip)", defaultKeys: "ctrl+j", category: "\uD3B8\uC9D1" },
  { id: "tool.select", label: "\uC120\uD0DD \uB3C4\uAD6C", defaultKeys: "v", category: "\uB3C4\uAD6C" },
  { id: "tool.text", label: "\uB300\uC0AC", defaultKeys: "t", category: "\uB3C4\uAD6C" },
  { id: "tool.sfx", label: "\uD6A8\uACFC\uC74C", defaultKeys: "s", category: "\uB3C4\uAD6C" },
  { id: "tool.bubble-oval", label: "\uD0C0\uC6D0 \uB9D0\uD48D\uC120", defaultKeys: "1", category: "\uB3C4\uAD6C" },
  { id: "tool.bubble-round", label: "\uB458\uADFC \uB9D0\uD48D\uC120", defaultKeys: "2", category: "\uB3C4\uAD6C" },
  { id: "tool.bubble-thought", label: "\uC0DD\uAC01 \uB9D0\uD48D\uC120", defaultKeys: "3", category: "\uB3C4\uAD6C" },
  { id: "tool.bubble-shout", label: "\uC678\uCE68 \uB9D0\uD48D\uC120", defaultKeys: "4", category: "\uB3C4\uAD6C" },
  { id: "tool.bubble-whisper", label: "\uC18D\uC0AD\uC784", defaultKeys: "5", category: "\uB3C4\uAD6C" },
  { id: "layer.bring-forward", label: "\uC55E\uC73C\uB85C", defaultKeys: "ctrl+]", category: "\uB808\uC774\uC5B4" },
  { id: "layer.send-backward", label: "\uB4A4\uB85C", defaultKeys: "ctrl+[", category: "\uB808\uC774\uC5B4" },
  { id: "layer.bring-to-front", label: "\uB9E8 \uC55E\uC73C\uB85C", defaultKeys: "ctrl+shift+]", category: "\uB808\uC774\uC5B4" },
  { id: "layer.send-to-back", label: "\uB9E8 \uB4A4\uB85C", defaultKeys: "ctrl+shift+[", category: "\uB808\uC774\uC5B4" },
  { id: "dock.cuts", label: "\uCEF7 \uD328\uB110 \uC5F4\uAE30", defaultKeys: "f1", category: "\uD328\uB110" },
  { id: "dock.tools", label: "\uB3C4\uAD6C \uD328\uB110", defaultKeys: "f2", category: "\uD328\uB110" },
  { id: "dock.layers", label: "\uB808\uC774\uC5B4 \uD328\uB110", defaultKeys: "f3", category: "\uD328\uB110" },
  { id: "dock.properties", label: "\uC18D\uC131 \uD328\uB110", defaultKeys: "f4", category: "\uD328\uB110" },
  { id: "assets.open", label: "\uC5D0\uC14B \uB77C\uC774\uBE0C\uB7EC\uB9AC", defaultKeys: "ctrl+shift+o", category: "\uD328\uB110" },
  { id: "shortcuts.open", label: "\uB2E8\uCD95\uD0A4 \uC124\uC815", defaultKeys: "ctrl+/", category: "\uD328\uB110" },
];

const EXTRA_DEFAULTS: { actionId: ShortcutActionId; keys: string }[] = [
  { actionId: "redo", keys: "ctrl+y" },
  { actionId: "delete", keys: "backspace" },
];

export function getDefaultBindings() {
  const bindings = SHORTCUT_DEFINITIONS.map((d) => ({
    actionId: d.id,
    keys: d.defaultKeys,
  }));
  return [...bindings, ...EXTRA_DEFAULTS];
}
