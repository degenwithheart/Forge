import { useState, useMemo, useEffect } from 'react';
import type { ProviderConfig, Provider } from '@/types/models';
import { Eye, EyeOff, Check, AlertCircle, Loader2, Lock } from 'lucide-react';

interface ProviderSettingsProps {
  providers: ProviderConfig[];
  onUpdate: (id: Provider, updates: Partial<ProviderConfig>) => void;
  validationStatus?: Record<Provider, { isValid: boolean; error?: string }>;
  isValidating?: boolean;
}

export function ProviderSettings({ 
  providers, 
  onUpdate,
  validationStatus = {},
  isValidating = false,
}: ProviderSettingsProps) {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editKeys, setEditKeys] = useState<Record<string, string>>({});
  const [envKeys, setEnvKeys] = useState<Record<string, boolean>>({}); // Track which keys are from env

  // Check for environment variables on mount
  useEffect(() => {
    const envKeyMap: Record<string, boolean> = {};
    
    // Check for OpenAI key in env
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      envKeyMap['openai'] = true;
    }
    
    // Check for HuggingFace token in env
    if (import.meta.env.VITE_HUGGINGFACE_TOKEN) {
      envKeyMap['huggingface'] = true;
    }
    
    setEnvKeys(envKeyMap);
  }, []);

  const toggleShow = (id: string) => setShowKeys(p => ({ ...p, [id]: !p[id] }));

  const handleSave = (id: Provider) => {
    if (editKeys[id] !== undefined && !envKeys[id]) {
      onUpdate(id, { apiKey: editKeys[id] });
      setEditKeys(p => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  return (
    <div className="space-y-3">
      <span className="forge-label">Providers</span>

      {providers.map(p => {
        const status = validationStatus[p.id];
        const isEditing = editKeys[p.id] !== undefined;
        const isFromEnv = envKeys[p.id];
        
        return (
          <div key={p.id} className="forge-surface p-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[12px] font-semibold text-foreground">{p.name}</span>
                {isFromEnv && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20">
                    <Lock className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[9px] font-semibold text-primary uppercase">Env</span>
                  </div>
                )}
                {!isEditing && status && (
                  <div className="flex items-center gap-0.5">
                    {isValidating ? (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    ) : status.isValid ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-warning" />
                    )}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={e => onUpdate(p.id, { enabled: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-7 h-4 rounded-full transition-colors relative ${p.enabled ? 'bg-primary' : 'bg-border'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform ${p.enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>

            {isFromEnv ? (
              <div className="flex items-center gap-1">
                <input
                  type={showKeys[p.id] ? 'text' : 'password'}
                  value={p.apiKey || ''}
                  readOnly
                  placeholder={`${p.name} API Key (from environment)`}
                  className="flex-1 bg-secondary border border-border rounded-sm px-2 py-1
                    text-[11px] font-mono text-foreground placeholder:text-muted-foreground
                    focus:outline-none transition-colors cursor-not-allowed"
                />
                <button
                  onClick={() => toggleShow(p.id)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKeys[p.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type={showKeys[p.id] ? 'text' : 'password'}
                  value={editKeys[p.id] ?? p.apiKey}
                  onChange={e => setEditKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder={`${p.name} API Key`}
                  className="flex-1 bg-secondary border border-border rounded-sm px-2 py-1
                    text-[11px] font-mono text-foreground placeholder:text-muted-foreground
                    focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={() => toggleShow(p.id)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKeys[p.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                {editKeys[p.id] !== undefined && (
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={isValidating}
                    className="p-1 text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                  >
                    {isValidating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            )}

            {p.id === 'huggingface' && !isFromEnv && (
              <p className="forge-label">Free tier available without key</p>
            )}
            {p.id === 'openai' && (
              <p className="forge-label text-muted-foreground text-[10px]">
                {!p.apiKey ? '⚠️ Requires paid OpenAI account and API key' : '✓ Configured (paid account)'}
              </p>
            )}
            {p.id === 'openai' && !p.apiKey && p.enabled && !isFromEnv && (
              <p className="forge-label text-warning">API key required</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
