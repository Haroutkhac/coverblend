'use client';

import { useCallback } from 'react';
import type { BlendSettings, BlendMode } from '@/types/blend';
import { Slider } from '@/components/ui/Slider';
import { cn } from '@/lib/utils/cn';

interface BlendControlsProps {
  settings: BlendSettings;
  onChange: (settings: Partial<BlendSettings>) => void;
}

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
];

export function BlendControls({ settings, onChange }: BlendControlsProps) {
  const update = useCallback(
    <K extends keyof BlendSettings>(key: K, value: BlendSettings[K]) => {
      onChange({ [key]: value });
    },
    [onChange]
  );

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-zinc-200">Blend Settings</h3>

      {/* Sliders */}
      <Slider
        label="Opacity"
        value={settings.opacity}
        onChange={(v) => update('opacity', v)}
        min={0}
        max={1}
        step={0.01}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label="Feather Radius"
        value={settings.featherRadius}
        onChange={(v) => update('featherRadius', v)}
        min={0}
        max={200}
        step={1}
        formatValue={(v) => `${v}px`}
      />

      <Slider
        label="Scale"
        value={settings.scale}
        onChange={(v) => update('scale', v)}
        min={0.1}
        max={3}
        step={0.01}
        formatValue={(v) => `${v.toFixed(2)}x`}
      />

      <Slider
        label="Position X"
        value={settings.positionX}
        onChange={(v) => update('positionX', v)}
        min={0}
        max={1}
        step={0.01}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label="Position Y"
        value={settings.positionY}
        onChange={(v) => update('positionY', v)}
        min={0}
        max={1}
        step={0.01}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      {/* Blend mode dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Blend Mode</label>
        <select
          value={settings.blendMode}
          onChange={(e) => update('blendMode', e.target.value as BlendMode)}
          className={cn(
            'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100',
            'focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500',
            'appearance-none cursor-pointer',
            'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[center_right_0.75rem]'
          )}
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color transfer toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">Color Transfer</span>
        <button
          type="button"
          role="switch"
          aria-checked={settings.colorTransferEnabled}
          onClick={() => update('colorTransferEnabled', !settings.colorTransferEnabled)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 cursor-pointer',
            settings.colorTransferEnabled ? 'bg-violet-500' : 'bg-zinc-700'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
              settings.colorTransferEnabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Color transfer strength (only when enabled) */}
      {settings.colorTransferEnabled && (
        <Slider
          label="Transfer Strength"
          value={settings.colorTransferStrength}
          onChange={(v) => update('colorTransferStrength', v)}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      )}
    </div>
  );
}
