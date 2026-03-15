import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (text: string) => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function PromptInput({ onSubmit, isGenerating, disabled, placeholder }: PromptInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isGenerating || disabled) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = '0';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [value]);

  return (
    <div className="forge-surface forge-inset-shadow">
      <div className="flex items-end gap-2 p-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Enter prompt...'}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[13px] font-mono text-foreground
            placeholder:text-muted-foreground resize-none focus:outline-none
            min-h-[32px] max-h-[120px] py-1"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isGenerating || disabled}
          className="shrink-0 p-1.5 rounded-sm transition-all duration-100
            active:scale-[0.98] disabled:opacity-30
            bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
