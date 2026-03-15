import { useState, useCallback } from 'react';
import type { Modality } from '@/types/models';
import { MODALITY_LABELS } from '@/types/models';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalityTabsProps {
  active: Modality;
  onChange: (m: Modality) => void;
  variant?: 'horizontal' | 'vertical';
}

const modalities: Modality[] = ['text', 'image', 'audio', 'video'];

export function ModalityTabs({ active, onChange, variant = 'horizontal' }: ModalityTabsProps) {
  const isVertical = variant === 'vertical';

  return (
    <div className={`flex ${isVertical ? 'flex-col gap-1' : 'gap-0.5'}`}>
      {modalities.map((m) => {
        const isActive = active === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`
              relative forge-label px-3 py-2 transition-all duration-100
              ${isActive
                ? 'text-primary bg-secondary'
                : 'text-muted-foreground hover:text-foreground forge-interactive'
              }
              ${isVertical ? 'text-left' : ''}
            `}
          >
            {MODALITY_LABELS[m]}
            {isActive && (
              <motion.div
                layoutId="modality-indicator"
                className={`absolute ${isVertical ? 'left-0 top-0 bottom-0 w-[2px]' : 'bottom-0 left-0 right-0 h-[2px]'} bg-primary`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
