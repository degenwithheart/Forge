/**
 * Cache Manager Component
 * 
 * Provides UI for managing local cache:
 * - View all cached models with metadata
 * - Per-model removal with size freed display
 * - 7-day automatic pruning
 * - Clear-all with confirmation
 * - Cache statistics and storage usage
 * - Cross-platform compatible (Windows, macOS, Linux)
 */

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Zap, AlertTriangle } from 'lucide-react';
import { getCacheManager, type CachedModel } from '@/lib/cache-db';

interface CacheStats {
  totalModels: number;
  totalSizeMB: number;
  oldestModel: CachedModel | null;
  newestModel: CachedModel | null;
  mostUsedModel: CachedModel | null;
}

export function CacheManagerPanel() {
  const [models, setModels] = useState<CachedModel[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [showConfirmPrune, setShowConfirmPrune] = useState(false);

  const loadCacheData = async () => {
    setLoading(true);
    try {
      const manager = getCacheManager();
      if (!manager) return;

      const cachedModels = await manager.getCachedModels();
      const cacheStats = await manager.getCacheStats();

      setModels(cachedModels);
      setStats(cacheStats);
    } catch (error) {
      console.error('Failed to load cache data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCacheData();
    const interval = setInterval(loadCacheData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRemoveModel = async (modelId: string) => {
    setRemoving(modelId);
    try {
      const manager = getCacheManager();
      if (!manager) return;

      const result = await manager.removeModel(modelId);
      if (result.success) {
        setModels(models.filter(m => m.modelId !== modelId));
        const newStats = await manager.getCacheStats();
        setStats(newStats);
      }
    } catch (error) {
      console.error('Failed to remove model:', error);
    } finally {
      setRemoving(null);
    }
  };

  const handlePruneOld = async () => {
    setShowConfirmPrune(false);
    try {
      const manager = getCacheManager();
      if (!manager) return;

      const freed = await manager.prunOldEntries(7);
      await loadCacheData();
      alert(`Pruned old entries. Freed ${freed.toFixed(1)} MB`);
    } catch (error) {
      console.error('Failed to prune cache:', error);
    }
  };

  const handleClearAll = async () => {
    setShowConfirmClearAll(false);
    try {
      const manager = getCacheManager();
      if (!manager) return;

      const freed = await manager.clearAll();
      setModels([]);
      setStats({
        totalModels: 0,
        totalSizeMB: 0,
        oldestModel: null,
        newestModel: null,
        mostUsedModel: null,
      });
      alert(`Cleared entire cache. Freed ${freed.toFixed(1)} MB`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cache Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">Loading cache data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cache Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Statistics</CardTitle>
            <CardDescription>Current cache usage and model information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Models</p>
                <p className="text-2xl font-bold">{stats.totalModels}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{stats.totalSizeMB.toFixed(1)} MB</p>
              </div>
            </div>

            {stats.mostUsedModel && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Most Used Model</p>
                <p className="font-semibold">{stats.mostUsedModel.name}</p>
                <p className="text-xs text-muted-foreground">
                  Used {stats.mostUsedModel.accessCount} times
                </p>
              </div>
            )}

            {stats.newestModel && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Recently Added</p>
                <p className="font-semibold">{stats.newestModel.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(stats.newestModel.loadedAt, 'MMM dd, HH:mm')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cached Models List */}
      <Card>
        <CardHeader>
          <CardTitle>Cached Models</CardTitle>
          <CardDescription>
            {models.length === 0
              ? 'No models cached yet'
              : `${models.length} model${models.length !== 1 ? 's' : ''} in cache`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              No cached models. Models will appear here after loading.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {models
                .sort((a, b) => b.lastUsed - a.lastUsed)
                .map((model) => (
                  <div
                    key={model.modelId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate text-sm">{model.name}</p>
                        <Badge className="text-xs" variant="outline">{model.modality}</Badge>
                        <Badge className="text-xs" variant="secondary">{model.provider}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{model.estimatedSizeMB.toFixed(1)} MB</span>
                        <span>Used {model.accessCount}x</span>
                        <span>
                          Last: {format(model.lastUsed, 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveModel(model.modelId)}
                      disabled={removing === model.modelId}
                      className="ml-2"
                    >
                      {removing === model.modelId ? (
                        <span className="text-xs">Removing...</span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>Manage cache storage and cleanup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowConfirmPrune(true)}
            disabled={models.length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Prune Entries Older Than 7 Days
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => setShowConfirmClearAll(true)}
            disabled={models.length === 0}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Clear All Cache
          </Button>
          <p className="text-xs text-muted-foreground pt-2">
            Clearing cache helps with testing first-load scenarios and freeing disk space.
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showConfirmPrune} onOpenChange={setShowConfirmPrune}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prune Old Cache Entries?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all cached models that haven't been used in the last 7 days. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handlePruneOld}>Prune</AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmClearAll} onOpenChange={setShowConfirmClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Cache?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {models.length} cached model{models.length !== 1 ? 's' : ''} and
              free {stats?.totalSizeMB.toFixed(1)} MB of storage. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Clear All
          </AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
