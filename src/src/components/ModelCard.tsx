import { memo, forwardRef, type Ref, useState } from 'react';
import type { HFModel } from '@/types/models';
import { motion } from 'framer-motion';
import { Download, Heart, Loader2, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { loadModel, unloadModel, runInference } from '@/lib/model-loader';

interface ModelCardProps {
  model: HFModel;
  onLoad: (model: HFModel) => void;
  onUnload: (model: HFModel) => void;
  compact?: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export const ModelCard = memo(
  forwardRef<HTMLDivElement, ModelCardProps>(function ModelCard(
    { model, onLoad, onUnload, compact }: ModelCardProps,
    ref: Ref<HTMLDivElement>
  ) {
    const [isLoading, setIsLoading] = useState(false);

    const handleLoadClick = async () => {
      if (model.isLoaded) {
        try {
          await unloadModel(model.modelId);
          toast.success(`✅ Unloaded ${model.name}`);
          onUnload(model);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          toast.error(`Failed to unload: ${message}`);
        }
      } else {
        setIsLoading(true);
        try {
          toast.loading(`📥 Starting to load ${model.name}...`, { id: `load-${model.modelId}` });
          
          await loadModel(model.modelId, model.name, (status: string) => {
            toast.loading(`${status}`, { id: `load-${model.modelId}` });
          });
          
          toast.dismiss(`load-${model.modelId}`);
          toast.success(`✅ ${model.name} ready for inference!`, { duration: 3000 });
          onLoad(model);
        } catch (err) {
          toast.dismiss(`load-${model.modelId}`);
          const message = err instanceof Error ? err.message : 'Unknown error';
          toast.error(`Failed to load ${model.name}: ${message}`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        className="forge-surface forge-inset-shadow group"
      >
      <div className={`${compact ? 'p-2' : 'p-3'} space-y-2`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="forge-label mb-0.5">{model.author}</p>
            <h3 className={`font-mono font-semibold text-foreground truncate ${compact ? 'text-xs' : 'text-[13px]'}`}>
              {model.name}
            </h3>
          </div>
          {model.pipeline_tag && (
            <span className="forge-label shrink-0 px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-sm">
              {model.pipeline_tag.replace(/-/g, ' ')}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 forge-label">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {formatNumber(model.stats?.downloads || 0)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {formatNumber(model.stats?.likes || 0)}
          </span>
          {model.quantization && (
            <span className="text-primary">{model.quantization}</span>
          )}
        </div>

        {/* Load button */}
        <button
          onClick={handleLoadClick}
          disabled={isLoading || model.isLoading}
          className={`
            w-full flex items-center justify-center gap-1.5 px-2 py-1.5
            text-[11px] font-mono font-bold uppercase tracking-[0.1em]
            transition-all duration-100 active:scale-[0.98] rounded-sm
            ${model.isLoaded
              ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
              : model.isLoading
                ? 'bg-secondary text-muted-foreground cursor-wait'
                : 'bg-secondary text-foreground hover:bg-surface-hover border border-border'
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading
            </>
          ) : model.isLoaded ? (
            <>
              <Square className="w-3 h-3" />
              Unload
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Load
            </>
          )}
        </button>

        {/* Load progress bar */}
        {isLoading && (
          <div className="h-[2px] bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: '85%' }}
              transition={{ duration: 3, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
  })
);
