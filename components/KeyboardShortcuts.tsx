"use client";

import { useEffect, useState } from "react";

interface Shortcut {
  key: string;
  description: string;
  modifier?: string;
}

const SHORTCUTS: Shortcut[] = [
  { key: "N", description: "New task" },
  { key: "T", description: "Go to today" },
  { key: "←", description: "Previous day", modifier: "Alt" },
  { key: "→", description: "Next day", modifier: "Alt" },
  { key: "Esc", description: "Clear selection / close modal" },
  { key: "A", description: "Assign task to selected cells" },
  { key: "?", description: "Show keyboard shortcuts" },
];

export function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e2e] border border-[#313244] rounded-2xl shadow-2xl p-6 w-96">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#cdd6f4]">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key + s.description} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[#9399b2]">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.modifier && (
                  <>
                    <kbd className="px-2 py-0.5 bg-[#181825] border border-[#45475a] rounded text-xs text-[#cdd6f4] font-mono">
                      {s.modifier}
                    </kbd>
                    <span className="text-[#6c7086] text-xs">+</span>
                  </>
                )}
                <kbd className="px-2 py-0.5 bg-[#181825] border border-[#45475a] rounded text-xs text-[#cdd6f4] font-mono">
                  {s.key}
                </kbd>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#6c7086] text-center">
          Shortcuts are active when not typing in an input
        </p>
      </div>
    </div>
  );
}

// Hook to use in TimeBoxView
export function useKeyboardShortcuts(handlers: {
  onNewTask?: () => void;
  onToday?: () => void;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onEscape?: () => void;
  onAssign?: () => void;
}) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        handlers.onEscape?.();
        setShowShortcuts(false);
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handlers.onNewTask?.();
        return;
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        handlers.onToday?.();
        return;
      }
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handlers.onPrevDay?.();
        return;
      }
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        handlers.onNextDay?.();
        return;
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handlers.onAssign?.();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);

  return { showShortcuts, setShowShortcuts };
}
