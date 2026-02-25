"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PRIORITY_COLORS } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  priority: string;
  date: string;
  color: string;
}

interface AddTaskModalProps {
  date: string;
  onClose: () => void;
  onTaskAdded: (task: Task) => void;
}

const PRIORITIES = [
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "medium", label: "Medium", color: "#6366f1" },
  { value: "high", label: "High", color: "#f59e0b" },
  { value: "urgent", label: "Urgent", color: "#ef4444" },
];

const TASK_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6"];

export function AddTaskModal({ date, onClose, onTaskAdded }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [taskDate, setTaskDate] = useState(date);
  const [color, setColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), priority, date: taskDate, color }),
      });
      if (!res.ok) throw new Error();
      const task = await res.json();
      onTaskAdded(task);
      onClose();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1e1e2e] border border-[#313244] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#313244]">
          <h2 className="text-lg font-semibold text-[#cdd6f4]">Add New Task</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#cdd6f4] mb-1.5">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review design documents"
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-[#181825] border border-[#313244] rounded-lg text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[#cdd6f4] mb-2">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className="py-2 px-3 text-xs font-medium rounded-lg border transition-all"
                  style={{
                    backgroundColor: priority === p.value ? `${p.color}20` : "transparent",
                    borderColor: priority === p.value ? p.color : "#313244",
                    color: priority === p.value ? p.color : "#9399b2",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[#cdd6f4] mb-1.5">Date</label>
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#181825] border border-[#313244] rounded-lg text-[#cdd6f4] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-[#cdd6f4] mb-2">Color</label>
            <div className="flex gap-2">
              {TASK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
