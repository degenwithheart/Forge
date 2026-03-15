import { useState } from 'react';
import type { CachedModel } from '@/types/models';
import { Trash2, Clock, HardDrive, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CacheManagerProps {
  cachedModels: CachedModel[];
  totalSizeMB: number;
  onRemove: (modelId: string) => void;
  onPrune: (olderThanMs?: number) => void;
  onClearAll: () => void;
  compact?: boolean;
  activeModels?: { modelId: string; name: string }[];
}

function formatSize(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${mb} MB`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function CacheManager({ cachedModels, totalSizeMB, onRemove, onPrune, onClearAll, compact, activeModels = [] }: CacheManagerProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const activeIds = new Set(activeModels.map(m => m.modelId));

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <span className="forge-label flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          Local Cache
        </span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {formatSize(totalSizeMB)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onPrune(7 * 24 * 60 * 60 * 1000)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5
            text-[10px] font-mono font-bold uppercase tracking-[0.1em]
            bg-secondary text-foreground hover:bg-surface-hover border border-border
            rounded-sm transition-all duration-100 active:scale-[0.98]"
        >
          <Clock className="w-3 h-3" />
          Prune 7d+
        </button>
        {confirmClear ? (
          <button
            onClick={() => { onClearAll(); setConfirmClear(false); }}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5
              text-[10px] font-mono font-bold uppercase tracking-[0.1em]
              bg-destructive/20 text-destructive border border-destructive/30
              rounded-sm transition-all duration-100 active:scale-[0.98]"
          >
            <AlertTriangle className="w-3 h-3" />
            Confirm
          </button>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5
              text-[10px] font-mono font-bold uppercase tracking-[0.1em]
              bg-secondary text-destructive hover:bg-destructive/10 border border-border
              rounded-sm transition-all duration-100 active:scale-[0.98]"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Model list */}
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        <AnimatePresence>
          {cachedModels.length === 0 ? (
            <p className="forge-label text-center py-4">No cached models</p>
          ) : (
            cachedModels.map(m => (
              <motion.div
                key={m.modelId}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="forge-surface p-2 flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] text-foreground truncate">{m.name}</p>
                  <div className="flex items-center gap-2 forge-label">
                    <span>{m.provider}</span>
                    <span>{formatSize(m.estimatedSizeMB)}</span>
                    <span>{timeAgo(m.lastUsed)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(m.modelId)}
                  className="shrink-0 p-1 text-muted-foreground hover:text-destructive
                    transition-colors rounded-sm"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
