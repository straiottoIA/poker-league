"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm border-2 border-ink bg-white p-8">
        <h2 id="dialog-title" className="font-heading text-xl font-bold text-ink">
          {title}
        </h2>
        <p id="dialog-message" className="mt-3 font-body text-sm leading-relaxed text-secondary">
          {message}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-crimson px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#c62828]"
          >
            {confirmLabel}
          </button>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 border-2 border-ink bg-transparent px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-ink transition-all hover:bg-ink hover:text-canvas"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
