'use client';

import { useCallback, useId, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils/cn';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue,
  className,
  disabled = false,
}: SliderProps) {
  const id = useId();

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const percent = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-medium text-zinc-300"
            >
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm tabular-nums text-zinc-400">
              {displayValue}
            </span>
          )}
        </div>
      )}
      <div className="relative flex items-center h-5">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-zinc-800" />
        {/* Track fill */}
        <div
          className="absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
          style={{ width: `${percent}%` }}
        />
        {/* Native range input */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'relative w-full h-1.5 bg-transparent appearance-none cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Thumb styles
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-black/30',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-violet-500',
            '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150',
            '[&::-webkit-slider-thumb]:hover:scale-125',
            '[&::-webkit-slider-thumb]:active:scale-110',
            // Firefox thumb
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-violet-500',
            '[&::-moz-range-thumb]:shadow-md',
            // Firefox track
            '[&::-moz-range-track]:bg-transparent',
            '[&::-moz-range-track]:h-1.5'
          )}
        />
      </div>
    </div>
  );
}
