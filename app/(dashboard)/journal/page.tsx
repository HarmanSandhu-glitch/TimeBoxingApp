"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { getTodayString } from "@/lib/utils";

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  updatedAt: string;
}

export default function JournalPage() {
  const [date, setDate] = useState(getTodayString());
  const [content, setContent] = useState("");
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fetchEntry = useCallback(async () => {
    const res = await fetch(`/api/journal?date=${date}`);
    const data = await res.json();
    if (data) {
      setEntry(data);
      setContent(data.content || "");
    } else {
      setEntry(null);
      setContent("");
    }
  }, [date]);

  const fetchRecent = useCallback(async () => {
    const res = await fetch("/api/journal");
    const data = await res.json();
    setRecentEntries(data || []);
  }, []);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Autosave with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (date) {
        setSaving(true);
        try {
          await fetch("/api/journal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, content }),
          });
          setLastSaved(new Date());
          fetchRecent();
        } catch {
          //
        } finally {
          setSaving(false);
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [content, date, fetchRecent]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, content }),
      });
      const data = await res.json();
      setEntry(data);
      setLastSaved(new Date());
      toast.success("Journal saved!");
      fetchRecent();
    } catch {
      toast.error("Failed to save journal");
    } finally {
      setSaving(false);
    }
  }

  const prompts = [
    "What went off track today?",
    "What distracted me?",
    "What could I have planned better?",
    "What did I learn today?",
    "What will I do differently tomorrow?",
    "What am I proud of today?",
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#cdd6f4]">What We Off Track</h1>
          <p className="text-sm text-[#9399b2] mt-1">Daily reflection journal — track what went wrong and plan improvements</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-[#1e1e2e] border border-[#313244] rounded-lg text-[#cdd6f4] text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Journal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Date display */}
          <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#cdd6f4]">
                {format(parseISO(date), "EEEE, MMMM d, yyyy")}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#6c7086]">
                {saving && <span className="text-indigo-400">Saving...</span>}
                {lastSaved && !saving && (
                  <span>Saved at {format(lastSaved, "HH:mm")}</span>
                )}
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write about what went off track today... What distracted you? What could you have done differently? What patterns are you noticing?"
              rows={16}
              className="w-full px-4 py-3 bg-[#181825] border border-[#313244] rounded-lg text-[#cdd6f4] placeholder-[#45475a] focus:outline-none focus:border-indigo-500 transition-colors resize-none text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-[#6c7086]">{content.length} characters</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Writing Prompts */}
          <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#cdd6f4] mb-3">Reflection Prompts</h3>
            <div className="space-y-2">
              {prompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const addition = content ? `\n\n${prompt}\n` : `${prompt}\n`;
                    setContent((prev) => prev + addition);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Entries */}
          <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#cdd6f4] mb-3">Recent Entries</h3>
            <div className="space-y-2">
              {recentEntries.length === 0 ? (
                <p className="text-xs text-[#6c7086] italic">No entries yet</p>
              ) : (
                recentEntries.slice(0, 7).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setDate(e.date)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      e.date === date
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "hover:bg-[#313244] text-[#9399b2]"
                    }`}
                  >
                    <div className="text-xs font-medium">{format(parseISO(e.date), "EEE, MMM d")}</div>
                    <div className="text-xs text-[#6c7086] truncate mt-0.5">
                      {e.content.substring(0, 60) || "Empty entry"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
