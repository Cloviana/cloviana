'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { isAgentMode, MODES } from '../../chat/model/mode';
import type { AgentMode } from '../../types';

/** Chat, Plan or Build: what the next message is allowed to do. */
export function ModePicker({
  value,
  onChange,
  disabled,
}: {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      disabled={disabled}
      aria-label="What the agent may do"
      onValueChange={(next) => isAgentMode(next) && onChange(next)}
    >
      {MODES.map((mode) => (
        <ToggleGroupItem
          key={mode.value}
          value={mode.value}
          title={mode.hint}
          size="sm"
        >
          {mode.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
