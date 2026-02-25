"use client";

import { useEffect, useState } from "react";
import { getTodayString, PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

interface DailyAnalytics {
  date: string;
  totalTasks: number;
  totalBlocks: number;
  assignedBlocks: number;
  completedBlocks: number;
  completionRate: number;
  focusMinutes: number;
  priorityCounts: Record<string, { total: number; completed: number }>;
  hourlyData: Record<number, { assigned: number; completed: number }>;
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DailyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(getTodayString());

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const res = await fetch(`/api/analytics?type=daily&date=${date}`);
      const data = await res.json();
      setAnalytics(data);
      setLoading(false);
    }
    fetchAnalytics();
  }, [date]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) return null;

  const priorityChartData = Object.entries(analytics.priorityCounts).map(([key, val]) => ({
    name: PRIORITY_LABELS[key],
    Assigned: val.total,
    Completed: val.completed,
    fill: PRIORITY_COLORS[key],
  }));

  const hourlyChartData = Object.entries(analytics.hourlyData)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([hour, data]) => ({
      hour: `${Number(hour) > 12 ? Number(hour) - 12 : Number(hour)}${Number(hour) >= 12 ? "pm" : "am"}`,
      Assigned: data.assigned,
      Completed: data.completed,
    }));

  const pieData = [
    { name: "Completed", value: analytics.completedBlocks, color: "#a6e3a1" },
    { name: "Assigned", value: Math.max(0, analytics.assignedBlocks - analytics.completedBlocks), color: "#6366f1" },
    { name: "Unplanned", value: Math.max(0, analytics.totalBlocks - analytics.assignedBlocks), color: "#313244" },
  ].filter((d) => d.value > 0);

  const focusHours = Math.floor(analytics.focusMinutes / 60);
  const focusMins = analytics.focusMinutes % 60;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#cdd6f4]">Dashboard</h1>
          <p className="text-sm text-[#9399b2] mt-1">Your productivity metrics</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 bg-[#1e1e2e] border border-[#313244] rounded-lg text-[#cdd6f4] text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={analytics.totalTasks} icon="📋" color="indigo" />
        <StatCard label="Focus Time" value={`${focusHours}h ${focusMins}m`} icon="⏱️" color="green" />
        <StatCard label="Completion Rate" value={`${analytics.completionRate}%`} icon="✅" color="blue" />
        <StatCard label="Blocks Completed" value={`${analytics.completedBlocks}/${analytics.assignedBlocks}`} icon="⬜" color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Pie */}
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#cdd6f4] mb-4">Time Block Overview</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1e1e2e", border: "1px solid #313244", borderRadius: "8px", color: "#cdd6f4" }}
                />
                <Legend iconType="circle" formatter={(v) => <span style={{ color: "#9399b2", fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-[#6c7086] text-sm">No data for this date</div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#cdd6f4] mb-4">Priority Breakdown</h3>
          {priorityChartData.some((d) => d.Assigned > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityChartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
                <XAxis dataKey="name" tick={{ fill: "#9399b2", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9399b2", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #313244", borderRadius: "8px", color: "#cdd6f4" }} />
                <Bar dataKey="Assigned" fill="#313244" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Legend formatter={(v) => <span style={{ color: "#9399b2", fontSize: 11 }}>{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-[#6c7086] text-sm">No task data for this date</div>
          )}
        </div>
      </div>

      {/* Hourly Activity */}
      {hourlyChartData.length > 0 && (
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#cdd6f4] mb-4">Hourly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hourlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
              <XAxis dataKey="hour" tick={{ fill: "#9399b2", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9399b2", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #313244", borderRadius: "8px", color: "#cdd6f4" }} />
              <Line type="monotone" dataKey="Assigned" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Completed" stroke="#a6e3a1" strokeWidth={2} dot={false} />
              <Legend formatter={(v) => <span style={{ color: "#9399b2", fontSize: 11 }}>{v}</span>} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500/10 border-indigo-500/20",
    green: "bg-green-500/10 border-green-500/20",
    blue: "bg-blue-500/10 border-blue-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
  };
  return (
    <div className={`${colorMap[color]} border rounded-xl p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-[#cdd6f4]">{value}</div>
      <div className="text-xs text-[#9399b2] mt-1">{label}</div>
    </div>
  );
}
