'use client';

import { InputTabs } from './InputTabs';
import { TextInput } from './TextInput';
import { GenerateButton } from './GenerateButton';

interface InputZoneProps {
  text: string;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  isPrivate: boolean;
  onTogglePrivate: () => void;
  isGenerating: boolean;
}

export function InputZone({
  text,
  onTextChange,
  onGenerate,
  isPrivate,
  onTogglePrivate,
  isGenerating,
}: InputZoneProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <InputTabs activeTab="text" />
      <TextInput
        value={text}
        onChange={onTextChange}
        onSubmit={onGenerate}
        disabled={isGenerating}
      />
      <GenerateButton
        onGenerate={onGenerate}
        isPrivate={isPrivate}
        onTogglePrivate={onTogglePrivate}
        disabled={isGenerating || text.trim().length === 0}
      />
    </div>
  );
}
