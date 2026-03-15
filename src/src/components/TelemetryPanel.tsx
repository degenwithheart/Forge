import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { TelemetryData, InferenceParams, CachedModel, ProviderConfig, Provider, ApiValidationStatus } from '@/types/models';
import { HardDrive, Activity, Settings, Database, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { ParameterControls } from '@/components/ParameterControls';
import { CacheManagerSimple } from '@/components/CacheManagerSimple';
import { ProviderSettings } from '@/components/ProviderSettings';

interface TelemetryPanelProps {
  data: TelemetryData;
  isGenerating: boolean;
  params: InferenceParams;
  onParamsChange: (params: InferenceParams) => void;
  providers: ProviderConfig[];
  onProviderUpdate: (id: Provider, updates: Partial<ProviderConfig>) => void;
  validationStatus?: ApiValidationStatus[];
  isValidating?: boolean;
}

const telemetrySpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  restDelta: 0.001,
};

type Tab = 'engine' | 'params' | 'cache' | 'providers';

function GaugeBar({ label, value, max, unit, warn }: {
  label: string; value: number; max: number; unit: string; warn?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="forge-label">{label}</span>
        <span className={`font-mono text-[11px] tabular-nums ${warn ? 'text-warning' : 'text-foreground'}`}>
          {value.toFixed(1)}{unit} / {max.toFixed(1)}{unit}
        </span>
      </div>
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${warn ? 'bg-warning' : 'bg-primary'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={telemetrySpring}
        />
      </div>
      {pct > 85 && <span className="forge-label text-warning">Peak</span>}
    </div>
  );
}

export function TelemetryPanel({
  data,
  isGenerating,
  params,
  onParamsChange,
  providers,
  onProviderUpdate,
  validationStatus = [],
  isValidating = false,
}: TelemetryPanelProps) {
  const [tab, setTab] = useState<Tab>('engine');

  const handleParamsChange = useCallback((newParams: InferenceParams) => {
    onParamsChange(newParams);
    if (data.modelsLoaded > 0) {
      toast.success('Parameters updated', {
        description: 'New settings will apply to next inference',
        duration: 2000,
      });
    }
  }, [onParamsChange, data.modelsLoaded]);

  const validationMap = useMemo(() => {
    const map: Record<Provider, { isValid: boolean; error?: string }> = {
      huggingface: { isValid: false },
      openai: { isValid: false },
    };
    validationStatus.forEach(s => {
      map[s.provider] = { isValid: s.isValid, error: s.error };
    });
    return map;
  }, [validationStatus]);

  const tabs: { id: Tab; icon: typeof Activity; label: string }[] = [
    { id: 'engine', icon: Activity, label: 'ENG' },
    { id: 'params', icon: Settings, label: 'PRM' },
    { id: 'cache', icon: Database, label: 'DSK' },
    { id: 'providers', icon: Layers, label: 'API' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 forge-label transition-colors
              ${tab === t.id ? 'text-primary bg-secondary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-3 space-y-4 overflow-y-auto">
        {tab === 'engine' && (
          <>
            {/* TPS */}
            <div className="forge-surface p-3 space-y-1">
              <span className="forge-label">Tokens / sec</span>
              <div className="flex items-baseline gap-1">
                <motion.span
                  className="font-mono text-2xl font-bold tabular-nums text-primary"
                  key={Math.floor(data.tps)}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.05 }}
                >
                  {data.tps.toFixed(1)}
                </motion.span>
                <span className="forge-label">tps</span>
              </div>
              {isGenerating && (
                <div className="h-[2px] rounded-full overflow-hidden bg-border">
                  <motion.div
                    className="h-full bg-primary forge-glow-pulse"
                    animate={{ width: ['20%', '90%', '40%', '80%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </div>

            {/* Memory - Always available (JS Heap) */}
            <GaugeBar
              label="JS Heap"
              value={data.vramUsed}
              max={data.vramTotal || 256}
              unit="MB"
              warn={data.vramTotal > 0 && (data.vramUsed / data.vramTotal) > 0.85}
            />

            {/* System Metrics from Node.js Server (if available) */}
            {data.cpuUsage > 0 || data.gpuUsage > 0 ? (
              <>
                {/* CPU is available from server */}
                {data.cpuUsage > 0 && (
                  <GaugeBar
                    label="CPU"
                    value={data.cpuUsage}
                    max={100}
                    unit="%"
                    warn={data.cpuUsage > 90}
                  />
                )}

                {/* GPU is available from server */}
                {data.gpuUsage > 0 && (
                  <GaugeBar
                    label="GPU"
                    value={data.gpuUsage}
                    max={100}
                    unit="%"
                    warn={data.gpuUsage > 85}
                  />
                )}
              </>
            ) : (
              /* System Metrics - Unavailable in Browser */
              <div className="forge-surface p-3 space-y-2 border border-warning/20 bg-warning/5">
                <div className="flex items-center gap-2">
                  <span className="forge-label text-warning">⚠️ System Metrics Unavailable</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Browsers cannot access system CPU/GPU usage due to security sandboxing. Only JavaScript heap memory (shown above) is measurable in the browser environment.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  To enable real metrics:
                </p>
                <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-1">
                  <li>Run Node.js telemetry server: <code className="bg-secondary px-1 rounded">npm run dev:full</code></li>
                  <li>Linux/Windows: Install <code className="bg-secondary px-1 rounded">nvidia-smi</code> for GPU (NVIDIA only)</li>
                  <li>macOS: CPU/memory only (GPU access restricted)</li>
                </ul>
              </div>
            )}

            <div className="forge-surface p-3 space-y-2">
              <span className="forge-label">Status</span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isGenerating ? 'bg-primary forge-glow-pulse' : 'bg-muted-foreground'
                    }`}
                  />
                  <span className="font-mono text-[11px] text-foreground">
                    {isGenerating ? 'Generating' : 'Idle'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {data.modelsLoaded} model{data.modelsLoaded !== 1 ? 's' : ''} loaded
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'params' && <ParameterControls params={params} onChange={handleParamsChange} disabled={data.modelsLoaded === 0} activeModel={data.modelsLoaded > 0 ? { modelId: 'current', name: 'Model Active' } : null} />}

        {tab === 'cache' && <CacheManagerSimple />}

        {tab === 'providers' && (
          <ProviderSettings
            providers={providers}
            onUpdate={onProviderUpdate}
            validationStatus={validationMap}
            isValidating={isValidating}
          />
        )}
      </div>
    </div>
  );
}
