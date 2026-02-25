"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { HOURS, TIME_BLOCK_MINUTES, formatHour, cn, PRIORITY_COLORS } from "@/lib/utils";
import { AddTaskModal } from "@/components/AddTaskModal";
import { BulkAssignModal } from "@/components/BulkAssignModal";
import { useKeyboardShortcuts, KeyboardShortcutsModal } from "@/components/KeyboardShortcuts";

interface Task {
  id: string;
  title: string;
  priority: string;
  date: string;
  color: string;
  category: string;
}

interface TimeBlock {
  id?: string;
  hour: number;
  minute: number;
  date: string;
  taskId: string | null;
  isCompleted: boolean;
  task?: Task | null;
}

interface TimeBoxViewProps {
  date: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  work: "💼",
  personal: "🏠",
  health: "💪",
  learning: "📚",
  other: "✨",
};

export function TimeBoxView({ date }: TimeBoxViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<Record<string, TimeBlock>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [currentDate, setCurrentDate] = useState(date);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const tableRef = useRef<HTMLDivElement>(null);

  const cellKey = (hour: number, minute: number) => `${hour}-${minute}`;

  const goToPrevDay = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  }, [currentDate]);

  const goToNextDay = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  }, [currentDate]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Apply recurring tasks for this date first
      await fetch(`/api/recurring-tasks?date=${currentDate}`);

      const [tasksRes, blocksRes] = await Promise.all([
        fetch(`/api/tasks?date=${currentDate}`),
        fetch(`/api/time-blocks?date=${currentDate}`),
      ]);
      const tasksData = await tasksRes.json();
      const blocksData = await blocksRes.json();

      setTasks(tasksData);
      const blockMap: Record<string, TimeBlock> = {};
      for (const b of blocksData) {
        blockMap[cellKey(b.hour, b.minute)] = b;
      }
      setBlocks(blockMap);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updateBlock(hour: number, minute: number, update: Partial<TimeBlock>) {
    const key = cellKey(hour, minute);
    const existing = blocks[key] || { hour, minute, date: currentDate, taskId: null, isCompleted: false };
    const optimistic = { ...existing, ...update };
    setBlocks((prev) => ({ ...prev, [key]: optimistic }));

    try {
      const res = await fetch("/api/time-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [{ hour, minute, date: currentDate, ...update }],
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to update cell");
      setBlocks((prev) => ({ ...prev, [key]: existing }));
    }
  }

  async function bulkUpdateBlocks(cellKeys: Set<string>, taskId: string | null) {
    const updates = Array.from(cellKeys).map((key) => {
      const [h, m] = key.split("-").map(Number);
      return { hour: h, minute: m, date: currentDate, taskId };
    });

    const newBlocks = { ...blocks };
    for (const u of updates) {
      const key = cellKey(u.hour, u.minute);
      newBlocks[key] = { ...newBlocks[key], ...u, isCompleted: false, task: tasks.find((t) => t.id === taskId) || null };
    }
    setBlocks(newBlocks);
    setSelectedCells(new Set());

    try {
      const res = await fetch("/api/time-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: updates }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Assigned to ${updates.length} time block(s)`);
    } catch {
      toast.error("Failed to bulk assign");
      fetchData();
    }
  }

  // Cell selection
  function handleCellMouseDown(key: string, e: React.MouseEvent) {
    if (e.shiftKey && selectedCells.size > 0) {
      setSelectedCells((prev) => new Set([...prev, key]));
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    } else {
      setIsSelecting(true);
      setSelectionStart(key);
      setSelectedCells(new Set([key]));
    }
  }

  function handleCellMouseEnter(key: string) {
    if (isSelecting && selectionStart) {
      const [sh, sm] = selectionStart.split("-").map(Number);
      const [ch, cm] = key.split("-").map(Number);
      const minH = Math.min(sh, ch);
      const maxH = Math.max(sh, ch);
      const minM = Math.min(sm, cm);
      const maxM = Math.max(sm, cm);
      const newSelected = new Set<string>();
      for (const hour of HOURS) {
        for (const minute of TIME_BLOCK_MINUTES) {
          if (hour >= minH && hour <= maxH && minute >= minM && minute <= maxM) {
            newSelected.add(cellKey(hour, minute));
          }
        }
      }
      setSelectedCells(newSelected);
    }
  }

  function handleMouseUp() {
    setIsSelecting(false);
    if (selectedCells.size > 1) {
      setShowBulkAssign(true);
    }
  }

  function clearSelection() {
    setSelectedCells(new Set());
    setSelectionStart(null);
  }

  // Drag and drop
  function handleDragStart(taskId: string) {
    setDragTaskId(taskId);
  }

  function handleCellDragOver(key: string, e: React.DragEvent) {
    e.preventDefault();
    setDragOverCell(key);
  }

  function handleCellDrop(hour: number, minute: number, e: React.DragEvent) {
    e.preventDefault();
    if (dragTaskId) {
      const task = tasks.find((t) => t.id === dragTaskId);
      updateBlock(hour, minute, { taskId: dragTaskId, task });
      toast.success(`Assigned "${task?.title}" to ${formatHour(hour)}:${minute.toString().padStart(2, "0")}`);
    }
    setDragTaskId(null);
    setDragOverCell(null);
  }

  function handleDragEnd() {
    setDragTaskId(null);
    setDragOverCell(null);
  }

  function exportCSV() {
    const from = currentDate;
    window.open(`/api/export?format=csv&from=${from}&to=${from}`, "_blank");
  }

  // Keyboard shortcuts
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts({
    onNewTask: () => setShowAddTask(true),
    onToday: goToToday,
    onPrevDay: goToPrevDay,
    onNextDay: goToNextDay,
    onEscape: clearSelection,
    onAssign: () => selectedCells.size > 0 && setShowBulkAssign(true),
  });

  const filteredTasks = categoryFilter === "all"
    ? tasks
    : tasks.filter((t) => t.category === categoryFilter);

  const uniqueCategories = ["all", ...new Set(tasks.map((t) => t.category))];

  return (
    <div
      className="flex h-full"
      onMouseUp={handleMouseUp}
    >
      {/* Task Panel (left sidebar) */}
      <div className="w-52 flex-shrink-0 border-r border-[#313244] bg-[#181825] flex flex-col">
        <div className="px-3 py-3 border-b border-[#313244]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9399b2] uppercase tracking-wide">Tasks</span>
            <span className="text-xs text-[#6c7086]">{tasks.length}</span>
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1">
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-2 py-0.5 text-[10px] rounded-full border transition-colors capitalize",
                  categoryFilter === cat
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                    : "border-[#313244] text-[#6c7086] hover:text-[#9399b2]"
                )}
              >
                {cat === "all" ? "All" : `${CATEGORY_ICONS[cat] ?? "•"} ${cat}`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredTasks.length === 0 ? (
            <p className="text-xs text-[#6c7086] text-center mt-4 px-2">
              No tasks yet.<br />Click + to add one.
            </p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "group p-2 rounded-lg border border-[#313244] bg-[#1e1e2e] cursor-grab active:cursor-grabbing transition-all hover:border-indigo-500/50",
                  dragTaskId === task.id && "opacity-50 scale-95"
                )}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PRIORITY_COLORS[task.priority] || task.color }}
                  />
                  <span className="text-xs text-[#cdd6f4] truncate font-medium flex-1">{task.title}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#6c7086]">
                  <span>{CATEGORY_ICONS[task.category] ?? "•"}</span>
                  <span className="capitalize">{task.category}</span>
                  <span className="ml-auto capitalize" style={{ color: PRIORITY_COLORS[task.priority] }}>
                    {task.priority}
                  </span>
                </div>
                <div className="text-[9px] text-[#45475a] mt-0.5 group-hover:text-[#6c7086]">
                  ⣿ drag to assign
                </div>
              </div>
            ))
          )}
        </div>
        {/* Export button */}
        <div className="p-2 border-t border-[#313244]">
          <button
            onClick={exportCSV}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Main grid area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#313244] bg-[#1e1e2e]">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#cdd6f4]">TimeBox</h1>
            <div className="flex items-center gap-1.5">
              <button
                onClick={goToPrevDay}
                className="p-1.5 text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="px-3 py-1.5 bg-[#181825] border border-[#313244] rounded-lg text-[#cdd6f4] text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={goToNextDay}
                className="p-1.5 text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
              >
                Today
              </button>
            </div>
            <span className="text-sm text-[#9399b2] hidden md:block">
              {format(parseISO(currentDate), "EEEE, MMMM d yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedCells.size > 0 && (
              <>
                <span className="text-xs text-indigo-400">{selectedCells.size} selected</span>
                <button
                  onClick={() => setShowBulkAssign(true)}
                  className="px-2.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Assign
                </button>
                <button
                  onClick={clearSelection}
                  className="px-2.5 py-1.5 text-xs bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] rounded-lg transition-colors"
                >
                  Clear
                </button>
              </>
            )}
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-1.5 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-1.5 text-xs text-[#6c7086] bg-[#181825] border-b border-[#313244]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500/50 border border-indigo-500" />
            Multi-select (drag / Ctrl+click / Shift+click)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-green-500/30 border border-green-500/50" />
            Completed
          </span>
          <span className="text-indigo-400/70">? for shortcuts • Drag tasks onto cells</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-3" ref={tableRef}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ userSelect: "none" }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-[#1e1e2e] px-3 py-2 text-left text-xs font-semibold text-[#6c7086] border border-[#313244] min-w-[70px]">
                      Hour
                    </th>
                    {TIME_BLOCK_MINUTES.map((m) => (
                      <th
                        key={m}
                        className="px-2 py-2 text-center text-xs font-semibold text-[#6c7086] border border-[#313244] min-w-[110px]"
                      >
                        :{m.toString().padStart(2, "0")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((hour) => (
                    <tr key={hour}>
                      <td className="sticky left-0 z-10 bg-[#1e1e2e] px-3 py-1.5 font-semibold text-[#9399b2] text-xs border border-[#313244] whitespace-nowrap">
                        {formatHour(hour)}
                      </td>
                      {TIME_BLOCK_MINUTES.map((minute) => {
                        const key = cellKey(hour, minute);
                        const block = blocks[key];
                        const isSelected = selectedCells.has(key);
                        const isCompleted = block?.isCompleted || false;
                        const assignedTask = block?.task;
                        const isDragOver = dragOverCell === key;

                        return (
                          <TimeBoxCell
                            key={key}
                            cellKey={key}
                            hour={hour}
                            minute={minute}
                            block={block}
                            tasks={tasks}
                            isSelected={isSelected}
                            isCompleted={isCompleted}
                            assignedTask={assignedTask}
                            isDragOver={isDragOver}
                            isDragging={dragTaskId !== null}
                            onMouseDown={handleCellMouseDown}
                            onMouseEnter={handleCellMouseEnter}
                            onTaskChange={(taskId) => updateBlock(hour, minute, { taskId, task: tasks.find((t) => t.id === taskId) || null })}
                            onToggleComplete={() => updateBlock(hour, minute, { isCompleted: !isCompleted })}
                            onDragOver={(e) => handleCellDragOver(key, e)}
                            onDrop={(e) => handleCellDrop(hour, minute, e)}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FAB - Add Task */}
      <button
        onClick={() => setShowAddTask(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center z-50"
        title="Add task (N)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modals */}
      {showAddTask && (
        <AddTaskModal
          date={currentDate}
          onClose={() => setShowAddTask(false)}
          onTaskAdded={(task) => {
            setTasks((prev) => [task, ...prev]);
            toast.success(`Task "${task.title}" added`);
          }}
        />
      )}
      {showBulkAssign && selectedCells.size > 0 && (
        <BulkAssignModal
          tasks={tasks}
          selectedCount={selectedCells.size}
          onClose={() => setShowBulkAssign(false)}
          onAssign={(taskId) => {
            bulkUpdateBlocks(selectedCells, taskId);
            setShowBulkAssign(false);
          }}
        />
      )}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}



// -------------------------------------------------------
// TimeBoxCell sub-component
// -------------------------------------------------------
interface TimeBoxCellProps {
  cellKey: string;
  hour: number;
  minute: number;
  block?: TimeBlock;
  tasks: Task[];
  isSelected: boolean;
  isCompleted: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  assignedTask?: Task | null;
  onMouseDown: (key: string, e: React.MouseEvent) => void;
  onMouseEnter: (key: string) => void;
  onTaskChange: (taskId: string | null) => void;
  onToggleComplete: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function TimeBoxCell({
  cellKey,
  block,
  tasks,
  isSelected,
  isCompleted,
  isDragOver,
  isDragging,
  assignedTask,
  onMouseDown,
  onMouseEnter,
  onTaskChange,
  onToggleComplete,
  onDragOver,
  onDrop,
}: TimeBoxCellProps) {
  const [open, setOpen] = useState(false);

  const bgColor = isCompleted
    ? "bg-green-500/15 border-green-500/30"
    : assignedTask
    ? "bg-[#2a2a3e] border-[#3d3d5c]"
    : "bg-[#181825] border-[#313244]";

  return (
    <td
      className={cn(
        "timebox-cell border p-1 relative cursor-pointer transition-colors",
        bgColor,
        isSelected && "!bg-indigo-500/20 !border-indigo-500 selected",
        isDragOver && isDragging && "!bg-purple-500/20 !border-purple-400"
      )}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(cellKey, e); }}
      onMouseEnter={() => onMouseEnter(cellKey)}
      onClick={(e) => e.stopPropagation()}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col gap-0.5 min-h-[52px] p-0.5">
        {assignedTask && (
          <div className="h-1 rounded-full mb-0.5" style={{ backgroundColor: PRIORITY_COLORS[assignedTask.priority] || "#6366f1" }} />
        )}

        <div className="relative" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
          <div className={cn("flex items-center gap-1 px-1.5 py-1 rounded text-xs cursor-pointer hover:bg-[#313244] transition-colors",
            assignedTask ? "text-[#cdd6f4]" : isDragging ? "text-purple-400/50" : "text-[#6c7086]")}>
            <span className="truncate max-w-[85px]">
              {assignedTask ? assignedTask.title : isDragging ? "drop here" : "—"}
            </span>
            {!isDragging && (
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>

          {open && (
            <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}>
              <div className="px-3 py-2 text-xs text-[#9399b2] hover:bg-[#313244] cursor-pointer transition-colors"
                onClick={() => { onTaskChange(null); setOpen(false); }}>
                — None
              </div>
              <div className="border-t border-[#313244]" />
              <div className="max-h-48 overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[#6c7086] italic">No tasks for this date</div>
                ) : (
                  tasks.map((t) => (
                    <div key={t.id}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#cdd6f4] hover:bg-[#313244] cursor-pointer transition-colors"
                      onClick={() => { onTaskChange(t.id); setOpen(false); }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[t.priority] || t.color }} />
                      <span className="truncate">{t.title}</span>
                      <span className="ml-auto text-[10px] text-[#6c7086] capitalize">{t.priority}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {block?.taskId && (
          <div className="flex items-center gap-1 px-1.5 cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}>
            <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
              isCompleted ? "bg-green-500 border-green-500" : "border-[#6c7086] hover:border-green-400")}>
              {isCompleted && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[10px] text-[#6c7086]">{isCompleted ? "Done" : "Mark done"}</span>
          </div>
        )}
      </div>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </td>
  );
}
