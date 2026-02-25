"use client";

import { useState } from "react";
import { PRIORITY_COLORS } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  priority: string;
  color: string;
}

interface BulkAssignModalProps {
  tasks: Task[];
  selectedCount: number;
  onClose: () => void;
  onAssign: (taskId: string | null) => void;
}

export function BulkAssignModal({ tasks, selectedCount, onClose, onAssign }: BulkAssignModalProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#1e1e2e] border border-[#313244] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#313244]">
          <div>
            <h2 className="text-base font-semibold text-[#cdd6f4]">Assign to {selectedCount} Cells</h2>
            <p className="text-xs text-[#9399b2] mt-0.5">Select a task to assign to all selected time blocks</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-1 max-h-72 overflow-y-auto">
          {/* Clear option */}
          <div
            onClick={() => setSelectedTaskId(null)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              selectedTaskId === null ? "bg-[#313244]" : "hover:bg-[#313244]/50"
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-[#6c7086]" />
            <span className="text-sm text-[#9399b2]">— Clear assignment</span>
          </div>
          <div className="border-t border-[#313244] my-1" />
          {tasks.length === 0 ? (
            <p className="text-sm text-[#6c7086] px-3 py-2 italic">No tasks available</p>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  selectedTaskId === t.id ? "bg-indigo-500/20 border border-indigo-500/40" : "hover:bg-[#313244]/50 border border-transparent"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PRIORITY_COLORS[t.priority] || t.color }}
                />
                <span className="text-sm text-[#cdd6f4] flex-1 truncate">{t.title}</span>
                <span className="text-xs text-[#6c7086] capitalize flex-shrink-0">{t.priority}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-[#313244]">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onAssign(selectedTaskId)}
            className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {selectedTaskId === null ? "Clear Cells" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
