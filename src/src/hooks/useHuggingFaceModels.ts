import { useQuery } from '@tanstack/react-query';
import type { HFModel, Modality } from '@/types/models';
import { MODALITY_MAP, PIPELINE_TAG_MAP } from '@/types/models';
import { getSearchCache, saveSearchCache, getModelMetadata, saveModelMetadata, initDB } from '@/lib/db';

const HF_API = 'https://huggingface.co/api/models';

interface HFApiModel {
  _id: string;
  id: string;
  modelId?: string;
  author?: string;
  pipeline_tag?: string;
  downloads: number;
  likes: number;
  tags?: string[];
  lastModified?: string;
  gated?: boolean;
  description?: string;
}

async function parseModelWithCard(raw: HFApiModel, modality: Modality): Promise<HFModel> {
  const parts = raw.id.split('/');
  const author = parts.length > 1 ? parts[0] : 'unknown';
  const name = parts.length > 1 ? parts.slice(1).join('/') : raw.id;

  const quantTag = raw.tags?.find(t => /gguf|gptq|awq|exl2|q[0-9]/i.test(t));

  // Fetch model card for full metadata
  let cardData: Partial<HFApiModel> = {};
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const cardRes = await fetch(`https://huggingface.co/api/models/${raw.id}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (cardRes.ok) {
      cardData = await cardRes.json();
    }
  } catch {
    // Continue without card data
  }

  return {
    id: raw._id || raw.id,
    modelId: raw.id,
    author,
    name,
    description: raw.description || cardData.description || '',
    tags: raw.tags || [],
    stats: {
      downloads: raw.downloads || 0,
      likes: raw.likes || 0,
    },
    requirements: {
      contextLength: cardData.context_length || cardData.config?.max_position_embeddings,
      architecture: cardData.architecture || cardData.config?.architectures?.[0],
    },
    gated: raw.gated || false,
    pipeline_tag: raw.pipeline_tag || '',
    lastModified: raw.lastModified || cardData.lastModified || '',
    modality,
    isLoaded: false,
    isLoading: false,
    quantization: quantTag,
    provider: 'huggingface',
  } as HFModel;
}

async function fetchModelsByModality(modality: Modality, page = 0, perPage = 30): Promise<HFModel[]> {
  const pipelineTags = MODALITY_MAP[modality];
  const results: HFModel[] = [];

  const perTag = Math.ceil(perPage / pipelineTags.length);

  const fetches = pipelineTags.map(async (tag) => {
    const url = `${HF_API}?pipeline_tag=${tag}&sort=downloads&direction=-1&limit=${perTag}&skip=${page * perPage}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return [];
      const data: HFApiModel[] = await res.json();
      const parsed = await Promise.all(data.map(m => parseModelWithCard(m, modality)));
      return parsed;
    } catch {
      return [];
    }
  });

  const allResults = await Promise.all(fetches);
  allResults.forEach(batch => results.push(...batch));

  // Deduplicate by modelId
  const seen = new Set<string>();
  return results.filter(m => {
    if (seen.has(m.modelId)) return false;
    seen.add(m.modelId);
    return true;
  }).sort((a, b) => b.stats.downloads - a.stats.downloads);
}

export function useHuggingFaceModels(modality: Modality, query = '', limit = 30) {
  return useQuery({
    queryKey: ['hf-models', modality, query, limit],
    queryFn: async () => {
      // Check cache first
      if (query) {
        const cached = await getSearchCache(query, modality);
        if (cached) return cached.slice(0, limit);
      }

      const results = await fetchModelsByModality(modality, 0, limit);

      if (query) {
        const q = query.toLowerCase();
        const filtered = results.filter(
          m => m.name.toLowerCase().includes(q)
            || m.author.toLowerCase().includes(q)
            || m.pipeline_tag.includes(q)
            || m.tags.some(t => t.toLowerCase().includes(q))
            || m.description.toLowerCase().includes(q)
        );

        await saveSearchCache(query, modality, filtered);
        return filtered;
      }

      // Cache non-search results
      for (const model of results) {
        try {
          await saveModelMetadata({
            modelId: model.modelId,
            name: model.name,
            author: model.author,
            description: model.description,
            provider: 'huggingface',
            modality,
            card: {
              modelId: model.modelId,
              name: model.name,
              author: model.author,
              description: model.description,
              tags: model.tags,
              stats: model.stats,
              requirements: model.requirements,
              license: undefined,
              gated: model.gated || false,
              previewUrl: undefined,
            },
            fetchedAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          });
        } catch {
          // Continue on cache save failure
        }
      }

      return results;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export async function searchModelsRealTime(query: string, sort: 'downloads' | 'likes' | 'trending' = 'downloads', limit = 20): Promise<HFModel[]> {
  if (!query.trim()) return [];

  try {
    const url = `${HF_API}?search=${encodeURIComponent(query)}&sort=${sort}&direction=-1&limit=${limit}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data: HFApiModel[] = await res.json();

    const models = await Promise.all(
      data.map(async (m) => {
        let modality: Modality = 'text';
        const tag = m.pipeline_tag || '';
        if (tag in PIPELINE_TAG_MAP) {
          modality = PIPELINE_TAG_MAP[tag];
        }
        return parseModelWithCard(m, modality);
      })
    );

    await initDB();
    return models;
  } catch {
    return [];
  }
}
