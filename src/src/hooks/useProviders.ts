import { useState, useCallback, useEffect, useRef } from 'react';
import type { ProviderConfig, Provider, ApiValidationStatus } from '@/types/models';
import { validateAPIKey } from '@/lib/system-monitor';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';

const PROVIDERS_KEY = 'forge_providers';
const KEYS_ENCRYPTION_PREFIX = 'enc_';
const VALIDATION_RATE_LIMIT_MS = 2000; // Min 2 seconds between API key validations

function readProviders(): ProviderConfig[] {
  try {
    const stored = localStorage.getItem(PROVIDERS_KEY);
    if (stored) {
      // Graceful fallback for no encryption storage available
      try {
        const providers = JSON.parse(stored) as ProviderConfig[];
        
        // Merge env keys on top of stored providers
        const envProviders = getDefaultProvidersWithEnv();
        return providers.map(p => {
          const envProvider = envProviders.find(ep => ep.id === p.id);
          // If env has a key and stored doesn't, use env key
          if (envProvider?.apiKey && !p.apiKey) {
            return { ...p, apiKey: envProvider.apiKey };
          }
          return p;
        });
      } catch {
        return getDefaultProvidersWithEnv();
      }
    }
  } catch {
    // Storage error (e.g., private browsing)
  }
  return getDefaultProvidersWithEnv();
}

function getDefaultProvidersWithEnv(): ProviderConfig[] {
  // Load from env if available
  const hfToken = import.meta.env.VITE_HUGGINGFACE_TOKEN || '';
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  
  return [
    { id: 'huggingface', name: 'HuggingFace', apiKey: hfToken, enabled: true },
    { id: 'openai', name: 'OpenAI', apiKey: openaiKey, enabled: false }, // Disabled by default - requires paid account
  ];
}

function getDefaultProviders(): ProviderConfig[] {
  return [
    { id: 'huggingface', name: 'HuggingFace', apiKey: '', enabled: true },
    { id: 'openai', name: 'OpenAI', apiKey: '', enabled: false }, // Disabled by default - requires paid account
  ];
}

function writeProviders(providers: ProviderConfig[]): boolean {
  try {
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
    return true;
  } catch {
    // Storage error (e.g., quota exceeded or private browsing)
    console.warn('Failed to persist providers to storage');
    return false;
  }
}

export function useProviders() {
  const [providers, setProviders] = useState<ProviderConfig[]>(() => readProviders());
  const [validationStatus, setValidationStatus] = useState<ApiValidationStatus[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Rate limiting for API key validation
  const lastValidationTime = useRef<Record<string, number>>({});

  const updateProvider = useCallback(async (id: Provider, updates: Partial<ProviderConfig>) => {
    setProviders(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      writeProviders(next);
      return next;
    });

    // Auto-validate if API key was changed (with rate limiting)
    if (updates.apiKey) {
      const now = Date.now();
      const lastValidation = lastValidationTime.current[id] || 0;
      
      if (now - lastValidation < VALIDATION_RATE_LIMIT_MS) {
        return; // Skip validation if called too soon
      }

      lastValidationTime.current[id] = now;
      setIsValidating(true);
      
      try {
        const isValid = await validateAPIKey(id, updates.apiKey, 8000);
        setValidationStatus(prev => {
          const existing = prev.findIndex(s => s.provider === id);
          const newStatus = {
            provider: id,
            isValid,
            error: isValid ? undefined : `Invalid ${id} API key or network error`,
            checkedAt: Date.now(),
          };
          if (existing >= 0) {
            prev[existing] = newStatus;
            return [...prev];
          }
          return [...prev, newStatus];
        });
      } catch (error) {
        setValidationStatus(prev => {
          const existing = prev.findIndex(s => s.provider === id);
          const newStatus = {
            provider: id,
            isValid: false,
            error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            checkedAt: Date.now(),
          };
          if (existing >= 0) {
            prev[existing] = newStatus;
            return [...prev];
          }
          return [...prev, newStatus];
        });
      } finally {
        setIsValidating(false);
      }
    }
  }, []);

  const getApiKey = useCallback((id: Provider): string => {
    return providers.find(p => p.id === id)?.apiKey || '';
  }, [providers]);

  const isProviderEnabled = useCallback((id: Provider): boolean => {
    return providers.find(p => p.id === id)?.enabled || false;
  }, [providers]);

  const getValidationStatus = useCallback((id: Provider): ApiValidationStatus | null => {
    return validationStatus.find(s => s.provider === id) || null;
  }, [validationStatus]);

  return {
    providers,
    updateProvider,
    getApiKey,
    isProviderEnabled,
    validationStatus,
    getValidationStatus,
    isValidating,
  };
}
