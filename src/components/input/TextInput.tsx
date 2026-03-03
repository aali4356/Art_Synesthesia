'use client';

import { useRef, useCallback } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function TextInput({ value, onChange, onSubmit, disabled }: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      // Auto-resize
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit]
  );

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder="Paste anything. A name, a paragraph, a poem, a recipe..."
      aria-label="Text input for artwork generation"
      className={`
        w-full min-h-[150px] bg-transparent
        border-b border-[var(--border)]
        focus:border-[var(--color-accent)]
        outline-none resize-none
        text-base leading-relaxed p-4
        placeholder:text-[var(--muted-foreground)]
        transition-colors duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    />
  );
}
