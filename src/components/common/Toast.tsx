import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export const Toast: React.FC = () => {
  const { toast, clearToast } = useAppStore();

  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-2.5 border border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 shadow-xl transition-colors">
      {toast.type === "success" && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-zinc-900 dark:text-zinc-100" />
      )}
      {toast.type === "error" && (
        <AlertCircle className="h-4 w-4 shrink-0 text-zinc-900 dark:text-zinc-100" />
      )}
      {toast.type === "info" && (
        <Info className="h-4 w-4 shrink-0 text-zinc-900 dark:text-zinc-100" />
      )}
      <span className="font-sans font-medium">{toast.text}</span>
      <button
        type="button"
        onClick={clearToast}
        className="ml-auto p-0.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        aria-label="Tutup notifikasi"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
