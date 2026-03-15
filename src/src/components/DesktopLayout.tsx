import { ModalityTabs } from '@/components/ModalityTabs';
import { ModelLibrary } from '@/components/ModelLibrary';
import { PromptInput } from '@/components/PromptInput';
import { OutputStream } from '@/components/OutputStream';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { useForgeEngine } from '@/hooks/useForgeEngine';
import { AnimatePresence, motion } from 'framer-motion';

export function DesktopLayout() {
  const engine = useForgeEngine();

  return (
    <div className={`flex h-screen bg-background ${engine.isGenerating ? 'border border-primary/20 forge-glow-pulse' : 'border border-transparent'}`}>
      {/* Left Sidebar — Model Library (280px) */}
      <aside className="w-[280px] shrink-0 border-r border-border flex flex-col bg-card">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="font-mono text-sm font-bold tracking-tighter text-foreground">FORGE</h1>
            <p className="forge-label mt-0.5">Local Intelligence</p>
          </div>
        </div>

        <div className="border-b border-border">
          <ModalityTabs active={engine.activeModality} onChange={engine.setActiveModality} variant="horizontal" />
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={engine.activeModality}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <ModelLibrary
                modality={engine.activeModality}
                onModelLoad={engine.handleModelLoad}
                onModelUnload={engine.handleModelUnload}
                loadedModels={engine.loadedModels}
                loadingModels={engine.loadingModels}
                openaiModels={engine.openaiModels}
                providersState={engine.providers.providers}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </aside>

      {/* Center — Stage */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-2 border-b border-border flex items-center gap-3">
          {engine.activeModel ? (
            <>
              <div className={`w-2 h-2 rounded-full ${engine.isGenerating ? 'bg-primary forge-glow-pulse' : 'bg-primary/40'}`} />
              <span className="font-mono text-[13px] text-foreground truncate">
                {engine.activeModel.modelId}
              </span>
              <span className="forge-label text-primary ml-auto">
                {engine.activeModel.pipeline_tag}
              </span>
            </>
          ) : (
            <span className="font-mono text-[13px] text-muted-foreground">No model loaded</span>
          )}
        </div>

        <OutputStream
          results={engine.results}
          streamingText={engine.streamingText}
          isGenerating={engine.isGenerating}
        />

        <div className="p-4">
          <div className="max-w-[768px] mx-auto">
            <PromptInput
              onSubmit={engine.handleInference}
              isGenerating={engine.isGenerating}
              disabled={!engine.activeModel}
              placeholder={engine.activeModel ? `Prompt ${engine.activeModel.name}...` : 'Load a model first'}
            />
          </div>
        </div>
      </main>

      {/* Right Sidebar — Telemetry Rail (240px) */}
      <aside className="w-[240px] shrink-0 border-l border-border bg-card">
        <TelemetryPanel
          data={engine.telemetry}
          isGenerating={engine.isGenerating}
          params={engine.params}
          onParamsChange={engine.setParams}
          providers={engine.providers.providers}
          onProviderUpdate={engine.providers.updateProvider}
          validationStatus={engine.providers.validationStatus}
          isValidating={engine.providers.isValidating}
        />
      </aside>
    </div>
  );
}
