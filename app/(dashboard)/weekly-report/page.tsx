"use client";

import { useEffect, useState } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";

interface DailyStat {
  date: string;
  totalTasks: number;
  assignedBlocks: number;
  completedBlocks: number;
  completionRate: number;
  focusMinutes: number;
}

interface WeeklyData {
  weekDates: string[];
  dailyStats: DailyStat[];
}

export default function WeeklyReportPage() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(monday, "yyyy-MM-dd");
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await fetch(`/api/analytics?type=weekly&date=${weekStart}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    fetchData();
  }, [weekStart]);

  function goToPrevWeek() {
    const d = parseISO(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(format(d, "yyyy-MM-dd"));
  }

  function goToNextWeek() {
    const d = parseISO(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(format(d, "yyyy-MM-dd"));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.dailyStats.map((s) => ({
    day: format(parseISO(s.date), "EEE"),
    date: s.date,
    Planned: s.assignedBlocks,
    Completed: s.completedBlocks,
    "Focus (min)": s.focusMinutes,
    Rate: s.completionRate,
  }));

  const totalFocusMinutes = data.dailyStats.reduce((sum, s) => sum + s.focusMinutes, 0);
  const totalCompleted = data.dailyStats.reduce((sum, s) => sum + s.completedBlocks, 0);
  const totalPlanned = data.dailyStats.reduce((sum, s) => sum + s.assignedBlocks, 0);
  const avgRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  const totalTasks = data.dailyStats.reduce((sum, s) => sum + s.totalTasks, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#cdd6f4]">Weekly Report</h1>
          <p className="text-sm text-[#9399b2] mt-1">
            {format(parseISO(weekStart), "MMM d")} – {format(parseISO(data.weekDates[6] || weekStart), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevWeek} className="p-2 text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={goToNextWeek} className="p-2 text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <div className="text-2xl font-bold text-[#cdd6f4]">{totalTasks}</div>
          <div className="text-xs text-[#9399b2] mt-1">Total Tasks Created</div>
        </div>
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <div className="text-2xl font-bold text-green-400">{Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m</div>
          <div className="text-xs text-[#9399b2] mt-1">Total Focus Time</div>
        </div>
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <div className="text-2xl font-bold text-indigo-400">{avgRate}%</div>
          <div className="text-xs text-[#9399b2] mt-1">Avg Completion Rate</div>
        </div>
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <div className="text-2xl font-bold text-purple-400">{totalCompleted}/{totalPlanned}</div>
          <div className="text-xs text-[#9399b2] mt-1">Blocks Completed</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planned vs Completed */}
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#cdd6f4] mb-4">Planned vs Completed Blocks</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
              <XAxis dataKey="day" tick={{ fill: "#9399b2", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9399b2", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #313244", borderRadius: "8px", color: "#cdd6f4" }} />
              <Bar dataKey="Planned" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Completed" fill="#a6e3a1" radius={[4, 4, 0, 0]} />
              <Legend formatter={(v) => <span style={{ color: "#9399b2", fontSize: 12 }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Rate Trend */}
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#cdd6f4] mb-4">Daily Completion Rate (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
              <XAxis dataKey="day" tick={{ fill: "#9399b2", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#9399b2", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #313244", borderRadius: "8px", color: "#cdd6f4" }} />
              <Area type="monotone" dataKey="Rate" stroke="#6366f1" strokeWidth={2} fill="url(#rateGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#313244]">
          <h3 className="text-sm font-semibold text-[#cdd6f4]">Daily Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#313244]">
                {["Day", "Date", "Tasks", "Planned Blocks", "Completed", "Rate", "Focus Time"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#6c7086] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.dailyStats.map((s, i) => (
                <tr key={s.date} className={`border-b border-[#313244]/50 ${i % 2 === 0 ? "" : "bg-[#181825]/30"}`}>
                  <td className="px-5 py-3 text-[#cdd6f4] font-medium">{format(parseISO(s.date), "EEEE")}</td>
                  <td className="px-5 py-3 text-[#9399b2]">{format(parseISO(s.date), "MMM d")}</td>
                  <td className="px-5 py-3 text-[#cdd6f4]">{s.totalTasks}</td>
                  <td className="px-5 py-3 text-[#cdd6f4]">{s.assignedBlocks}</td>
                  <td className="px-5 py-3 text-green-400">{s.completedBlocks}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#313244] rounded-full max-w-[60px]">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.completionRate}%` }} />
                      </div>
                      <span className="text-[#cdd6f4] text-xs">{s.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#9399b2]">{Math.floor(s.focusMinutes / 60)}h {s.focusMinutes % 60}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
