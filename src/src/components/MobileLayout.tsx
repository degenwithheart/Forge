import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ModalityTabs } from '@/components/ModalityTabs';
import { ModelLibrary } from '@/components/ModelLibrary';
import { PromptInput } from '@/components/PromptInput';
import { OutputStream } from '@/components/OutputStream';
import { ParameterControls } from '@/components/ParameterControls';
import { CacheManagerSimple } from '@/components/CacheManagerSimple';
import { ProviderSettings } from '@/components/ProviderSettings';
import { ChevronUp, ChevronDown, Settings, Database, Layers } from 'lucide-react';
import { useForgeEngine } from '@/hooks/useForgeEngine';

type MobileView = 'output' | 'models' | 'settings' | 'cache' | 'providers';

export function MobileLayout() {
  const engine = useForgeEngine();
  const [deckExpanded, setDeckExpanded] = useState(false);
  const [view, setView] = useState<MobileView>('output');

  const handleParamsChange = (params: typeof engine.params) => {
    engine.setParams(params);
    if (engine.activeModel) {
      toast.success('Parameters updated', {
        description: 'New settings will apply to next inference',
        duration: 2000,
      });
    }
  };

  const viewButtons: { id: MobileView; label: string; icon?: typeof Settings }[] = [
    { id: 'output', label: 'Out' },
    { id: 'models', label: 'Lib' },
    { id: 'settings', label: 'Prm', icon: Settings },
    { id: 'cache', label: 'Dsk', icon: Database },
    { id: 'providers', label: 'Api', icon: Layers },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-2 py-1.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-tighter text-foreground">FORGE</span>
          {engine.activeModel && (
            <span className="forge-label text-primary truncate max-w-[120px]">
              {engine.activeModel.name}
            </span>
          )}
        </div>
        <div className="flex gap-0.5">
          {viewButtons.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`forge-label px-1.5 py-1 rounded-sm transition-colors
                ${view === v.id ? 'text-primary bg-secondary' : 'text-muted-foreground'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 overflow-y-auto"
          >
            {view === 'output' && (
              <OutputStream
                results={engine.results}
                streamingText={engine.streamingText}
                isGenerating={engine.isGenerating}
              />
            )}
            {view === 'models' && (
              <ModelLibrary
                modality={engine.activeModality}
                onModelLoad={engine.handleModelLoad}
                onModelUnload={engine.handleModelUnload}
                loadedModels={engine.loadedModels}
                loadingModels={engine.loadingModels}
                openaiModels={engine.openaiModels}
                compact
                providersState={engine.providers.providers}
              />
            )}
            {view === 'settings' && (
              <div className="p-3">
                <ParameterControls params={engine.params} onChange={handleParamsChange} compact />
              </div>
            )}
            {view === 'cache' && (
              <div className="p-3">
                <CacheManagerSimple />
              </div>
            )}
            {view === 'providers' && (
              <div className="p-3">
                <ProviderSettings
                  providers={engine.providers.providers}
                  onUpdate={engine.providers.updateProvider}
                  validationStatus={engine.providers.validationStatus.reduce((acc, s) => {
                    acc[s.provider] = { isValid: s.isValid, error: s.error };
                    return acc;
                  }, {} as Record<string, { isValid: boolean; error?: string }>)}
                  isValidating={engine.providers.isValidating}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Command Deck */}
      <div className={`border-t border-border bg-card ${engine.isGenerating ? 'forge-glow-pulse' : ''}`}>
        <div className="px-2 pt-2">
          <PromptInput
            onSubmit={engine.handleInference}
            isGenerating={engine.isGenerating}
            disabled={!engine.activeModel}
            placeholder={engine.activeModel ? `Prompt ${engine.activeModel.name}...` : 'Load a model first'}
          />
        </div>

        <button
          onClick={() => setDeckExpanded(!deckExpanded)}
          className="w-full flex items-center justify-center py-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {deckExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        <div className="px-2 pb-2">
          <ModalityTabs active={engine.activeModality} onChange={engine.setActiveModality} />
        </div>

        <AnimatePresence>
          {deckExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="forge-surface p-2">
                    <span className="forge-label">VRAM</span>
                    <p className="font-mono text-[13px] tabular-nums text-foreground">
                      {engine.telemetry.vramUsed.toFixed(1)} / {engine.telemetry.vramTotal}GB
                    </p>
                  </div>
                  <div className="forge-surface p-2">
                    <span className="forge-label">TPS</span>
                    <p className="font-mono text-[13px] tabular-nums text-primary">
                      {engine.telemetry.tps.toFixed(1)}
                    </p>
                  </div>
                  <div className="forge-surface p-2">
                    <span className="forge-label">CPU</span>
                    <p className="font-mono text-[13px] tabular-nums text-foreground">
                      {engine.telemetry.cpuUsage.toFixed(0)}%
                    </p>
                  </div>
                  <div className="forge-surface p-2">
                    <span className="forge-label">Cache</span>
                    <p className="font-mono text-[13px] tabular-nums text-foreground">
                      {engine.cache.cachedModels.length} models
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
