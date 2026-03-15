import type { InferenceParams } from '@/types/models';
import { DEFAULT_PARAMS } from '@/types/models';

interface ParamSliderProps {
  label: string;
  paramKey: keyof InferenceParams;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (key: keyof InferenceParams, value: number) => void;
}

function ParamSlider({ label, paramKey, value, min, max, step, unit, onChange }: ParamSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="forge-label">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {value}{unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(paramKey, parseFloat(e.target.value))}
        className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform"
      />
    </div>
  );
}

interface ParameterControlsProps {
  params: InferenceParams;
  onChange: (params: InferenceParams) => void;
  compact?: boolean;
  disabled?: boolean;
  activeModel?: { modelId: string; name: string } | null;
}

export function ParameterControls({ params, onChange, compact, disabled, activeModel }: ParameterControlsProps) {
  const handleChange = (key: keyof InferenceParams, value: number) => {
    if (!disabled) onChange({ ...params, [key]: value });
  };

  const handleReset = () => {
    if (!disabled) onChange(DEFAULT_PARAMS);
  };

  return (
    <div className={`space-y-${compact ? '2' : '3'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="forge-label">Parameters</span>
          {disabled && <p className="forge-label text-muted-foreground text-[10px] mt-0.5">Load a model to adjust</p>}
          {activeModel && <p className="forge-label text-primary text-[10px] mt-0.5">✅ {activeModel.name}</p>}
        </div>
        <button
          onClick={handleReset}
          disabled={disabled}
          className={`forge-label px-1.5 py-0.5 rounded-sm ${
            disabled
              ? 'text-muted-foreground cursor-not-allowed'
              : 'text-primary forge-interactive'
          }`}
        >
          Reset
        </button>
      </div>

      <ParamSlider
        label="Temperature"
        paramKey="temperature"
        value={params.temperature}
        min={0}
        max={2}
        step={0.05}
        onChange={handleChange}
      />

      <ParamSlider
        label="Top-P"
        paramKey="topP"
        value={params.topP}
        min={0}
        max={1}
        step={0.05}
        onChange={handleChange}
      />

      <ParamSlider
        label="Max Tokens"
        paramKey="maxTokens"
        value={params.maxTokens}
        min={16}
        max={4096}
        step={16}
        onChange={handleChange}
      />

      <ParamSlider
        label="Context Window"
        paramKey="contextWindow"
        value={params.contextWindow}
        min={512}
        max={32768}
        step={512}
        onChange={handleChange}
      />

      {/* Estimated memory impact */}
      <div className="forge-surface p-2 space-y-0.5">
        <span className="forge-label">Est. Memory Impact</span>
        <p className="font-mono text-[11px] tabular-nums text-foreground">
          ~{((params.contextWindow / 1024) * 0.25 + (params.maxTokens / 256) * 0.1).toFixed(2)} GB
        </p>
      </div>
    </div>
  );
}
