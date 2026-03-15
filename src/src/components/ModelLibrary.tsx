import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHuggingFaceModels, searchModelsRealTime } from '@/hooks/useHuggingFaceModels';
import { ModelCard } from '@/components/ModelCard';
import type { HFModel, Modality, ProviderConfig } from '@/types/models';
import { AnimatePresence } from 'framer-motion';
import { Search, Loader2, RefreshCw } from 'lucide-react';

interface ModelLibraryProps {
  modality: Modality;
  onModelLoad: (model: HFModel) => void;
  onModelUnload: (model: HFModel) => void;
  loadedModels: Set<string>;
  loadingModels: Set<string>;
  openaiModels?: HFModel[];
  compact?: boolean;
  providersState?: ProviderConfig[];
}

export function ModelLibrary({
  modality,
  onModelLoad,
  onModelUnload,
  loadedModels,
  loadingModels,
  openaiModels = [],
  compact,
  providersState = [],
}: ModelLibraryProps) {
  const { data: hfModels, isLoading: hfLoading, error: hfError, refetch } = useHuggingFaceModels(modality);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<HFModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<number | null>(null);

  // Check provider enable state from props
  const openaiEnabled = providersState.find(p => p.id === 'openai')?.enabled || false;
  const huggingfaceEnabled = providersState.find(p => p.id === 'huggingface')?.enabled || false;

  // Real-time search
  const handleSearch = useCallback((query: string) => {
    setSearch(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchModelsRealTime(query, 'downloads', 30);
        setSearchResults(results.filter(m => m.modality === modality));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms
  }, [modality]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const allModels = useMemo(() => {
    const models: HFModel[] = [];

    // Add OpenAI models if enabled
    if (openaiEnabled && openaiModels.length > 0) {
      const openaiForModality = openaiModels
        .filter(m => m.modality === modality)
        .map(m => ({ ...m, isLoaded: false, isLoading: false }));
      models.push(...openaiForModality);
    }

    // Add HuggingFace models if enabled
    if (huggingfaceEnabled && hfModels) {
      models.push(...hfModels);
    }

    // If searching, filter results by enabled providers too
    if (search.trim()) {
      return searchResults.filter(m => {
        if (m.provider === 'openai') return openaiEnabled;
        if (m.provider === 'huggingface') return huggingfaceEnabled;
        return huggingfaceEnabled; // default to HF
      });
    }

    return models;
  }, [hfModels, searchResults, search, modality, openaiEnabled, huggingfaceEnabled, openaiModels, providersState]);

  const enrichedModels = useMemo(
    () =>
      allModels.map(m => ({
        ...m,
        isLoaded: loadedModels.has(m.modelId),
        isLoading: loadingModels.has(m.modelId),
      })),
    [allModels, loadedModels, loadingModels]
  );

  const isLoading = hfLoading || isSearching;

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search models real-time..."
            className="w-full bg-secondary border border-border rounded-sm pl-7 pr-2 py-1.5
              text-[13px] font-mono text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="forge-label">{search.trim() ? 'Searching' : 'Fetching models'}</span>
          </div>
        ) : hfError && !search.trim() ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <span className="forge-label">Failed to fetch models</span>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1 text-primary forge-label forge-interactive px-2 py-1 rounded-sm"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        ) : enrichedModels.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <span className="forge-label">
              {search.trim() ? 'No models found for this search' : 'No models available'}
            </span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {enrichedModels.map(model => (
              <ModelCard
                key={model.modelId}
                model={model}
                onLoad={onModelLoad}
                onUnload={onModelUnload}
                compact={compact}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
