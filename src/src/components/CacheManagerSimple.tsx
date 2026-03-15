import { useModelCache } from '@/hooks/useModelCache';
import { Trash2, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatSize(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function CacheManagerSimple() {
  const cache = useModelCache();
  const { cachedModels, totalSizeMB, removeFromCache, pruneUnused, clearAll } = cache;

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <span className="forge-label flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          Cache
        </span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {formatSize(totalSizeMB)}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="forge-surface p-2 text-center">
          <div className="font-mono text-[11px] text-muted-foreground">Models</div>
          <div className="font-mono text-lg font-bold text-foreground">{cachedModels.length}</div>
        </div>
        <div className="forge-surface p-2 text-center">
          <div className="font-mono text-[11px] text-muted-foreground">Size</div>
          <div className="font-mono text-lg font-bold text-foreground">{formatSize(totalSizeMB)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => pruneUnused(7 * 24 * 60 * 60 * 1000)}
          disabled={cachedModels.length === 0}
          className="flex-1 px-2 py-1.5 text-[10px] font-mono font-bold uppercase
            bg-secondary text-foreground hover:bg-surface-hover border border-border
            rounded-sm transition-all disabled:opacity-30 active:scale-[0.98]"
        >
          Prune 7d+
        </button>
        <button
          onClick={clearAll}
          disabled={cachedModels.length === 0}
          className="flex-1 px-2 py-1.5 text-[10px] font-mono font-bold uppercase
            bg-secondary text-destructive hover:bg-destructive/10 border border-border
            rounded-sm transition-all disabled:opacity-30 active:scale-[0.98]"
        >
          Clear
        </button>
      </div>

      {/* Models list */}
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
        <AnimatePresence>
          {cachedModels.length === 0 ? (
            <div className="forge-surface p-3 text-center">
              <p className="forge-label">No cached models</p>
            </div>
          ) : (
            cachedModels.map(m => (
              <motion.div
                key={m.modelId}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="forge-surface p-2 flex items-center gap-2 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] text-foreground truncate">{m.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{m.provider}</span>
                    <span>•</span>
                    <span>{formatSize(m.estimatedSizeMB)}</span>
                    <span>•</span>
                    <span>{timeAgo(m.lastUsed)} ago</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCache(m.modelId)}
                  className="shrink-0 p-1 text-muted-foreground hover:text-destructive
                    transition-colors rounded-sm opacity-0 group-hover:opacity-100"
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
