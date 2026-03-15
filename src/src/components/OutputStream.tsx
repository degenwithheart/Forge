import { useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InferenceResult } from '@/types/models';

interface OutputStreamProps {
  results: InferenceResult[];
  streamingText: string;
  isGenerating: boolean;
}

export const OutputStream = memo(function OutputStream({ results, streamingText, isGenerating }: OutputStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [results, streamingText]);

  const hasContent = results.length > 0 || streamingText;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {!hasContent && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <p className="font-mono text-2xl font-bold tracking-tighter text-foreground">
              Forge
            </p>
            <p className="forge-label">Local Intelligence</p>
            <p className="font-mono text-[13px] text-muted-foreground max-w-md">
              Select a modality, load a model, and enter a prompt to begin inference.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {results.map((result, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-1"
          >
            {result.prompt && (
              <div className="p-2 rounded bg-secondary/50 border border-border">
                <div className="text-[10px] font-semibold text-muted-foreground mb-1">YOU</div>
                <div className="font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {result.prompt}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground">
                {result.role === 'user' ? 'YOU' : 'MODEL'}
              </div>
              {result.type === 'text' && (
                <div className="font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {result.content}
                </div>
              )}
              {result.type === 'image' && (
                <div className="forge-surface p-2 inline-block">
                  <img src={result.content} alt="Generated" className="max-w-full max-h-[400px] rounded-sm" />
                </div>
              )}
              {result.tokens && result.duration && (
                <div className="forge-label flex gap-3">
                  <span>{result.tokens} tokens</span>
                  <span>{(result.duration / 1000).toFixed(2)}s</span>
                  {result.tps && <span>{result.tps.toFixed(1)} tps</span>}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Streaming text */}
      {streamingText && (
        <div className="font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
          {streamingText}
          {isGenerating && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="inline-block w-[6px] h-[14px] bg-primary ml-0.5 align-middle"
            />
          )}
        </div>
      )}
    </div>
  );
});
