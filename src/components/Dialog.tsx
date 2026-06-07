import React from 'react';
import { X, Check } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  primaryAction: () => void;
  primaryLabel: string;
  secondaryAction?: () => void;
  secondaryLabel?: string;
  isDanger?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  primaryAction,
  primaryLabel,
  secondaryAction,
  secondaryLabel,
  isDanger
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-base w-full max-w-sm rounded-[2rem] p-6 border border-border-subtle shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-page-bg bg-page-text">
          {isDanger ? <X className="w-6 h-6 text-page-bg" /> : <Check className="w-6 h-6 text-page-bg" />}
        </div>
        <h3 className="text-xl font-bold text-page-text mb-2 tracking-tight">{title}</h3>
        <p className="text-text-muted mb-6">{description}</p>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={primaryAction}
            className={`w-full py-3 rounded-full font-bold transition-all border shadow-sm ${
              isDanger 
                ? 'bg-danger-base text-white border-danger-base/50 hover:bg-danger-base/90 shadow-[var(--theme-shadow-danger-glow)]' 
                : 'bg-page-text text-page-bg outline-none border-transparent hover:opacity-90'
            }`}
          >
            {primaryLabel}
          </button>
          
          {secondaryAction && secondaryLabel && (
            <button 
              onClick={secondaryAction}
              className="w-full py-3 rounded-full font-bold bg-surface-base border border-border-subtle text-page-text hover:bg-surface-hover transition-colors shadow-sm"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
