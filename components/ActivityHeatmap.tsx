"use client";

import { useEffect, useState } from "react";
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns";

interface HeatmapDay {
  date: string;
  count: number;
  rate: number;
}

function getColor(rate: number, count: number): string {
  if (count === 0) return "#1e1e2e";
  if (rate < 25) return "#312e5a";
  if (rate < 50) return "#4c3f8a";
  if (rate < 75) return "#6366f1";
  return "#818cf8";
}

export function ActivityHeatmap() {
  const [data, setData] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ date: string; count: number; rate: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    fetch(`/api/analytics?type=heatmap&date=${today}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.heatmap || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Build a full 365-day grid
  const today = new Date();
  const start = subDays(today, 364);
  const allDays = eachDayOfInterval({ start, end: today }).map((d) => format(d, "yyyy-MM-dd"));

  const dataMap: Record<string, HeatmapDay> = {};
  for (const d of data) dataMap[d.date] = d;

  // Group by week (columns) for GitHub-style rendering
  // Find the day of week of the start date to pad
  const startDayOfWeek = start.getDay(); // 0=Sun
  const paddedDays: (string | null)[] = [
    ...Array(startDayOfWeek).fill(null),
    ...allDays,
  ];
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1 pt-5">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="w-3 h-3 text-[9px] text-[#6c7086] flex items-center justify-center">
                {i % 2 === 1 ? d : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* Month labels */}
            <div className="flex gap-[3px] mb-1 text-[10px] text-[#6c7086]">
              {weeks.map((week, wi) => {
                const firstDay = week.find((d) => d !== null);
                if (!firstDay) return <div key={wi} className="w-3" />;
                const d = parseISO(firstDay);
                if (d.getDate() <= 7) {
                  return (
                    <div key={wi} className="w-3 text-center" style={{ minWidth: "12px" }}>
                      {months[d.getMonth()][0]}
                    </div>
                  );
                }
                return <div key={wi} className="w-3" style={{ minWidth: "12px" }} />;
              })}
            </div>

            {/* Cells */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((dateStr, di) => {
                    if (!dateStr) return <div key={di} className="w-3 h-3" />;
                    const dayData = dataMap[dateStr];
                    const count = dayData?.count ?? 0;
                    const rate = dayData?.rate ?? 0;
                    return (
                      <div
                        key={di}
                        className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125"
                        style={{ backgroundColor: getColor(rate, count) }}
                        onMouseEnter={(e) => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setTooltip({ date: dateStr, count, rate, x: rect.left, y: rect.top });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-[#6c7086]">
        <span>Less</span>
        {[0, 25, 50, 75, 100].map((r) => (
          <div
            key={r}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: r === 0 ? "#1e1e2e" : getColor(r, 1) }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-[#313244] border border-[#45475a] rounded-lg text-xs text-[#cdd6f4] shadow-xl pointer-events-none"
          style={{ left: tooltip.x - 20, top: tooltip.y - 70 }}
        >
          <div className="font-semibold">{format(parseISO(tooltip.date), "MMM d, yyyy")}</div>
          {tooltip.count > 0 ? (
            <>
              <div className="text-[#9399b2]">{tooltip.count} blocks completed</div>
              <div className="text-[#9399b2]">{tooltip.rate}% completion rate</div>
            </>
          ) : (
            <div className="text-[#6c7086]">No activity</div>
          )}
        </div>
      )}
    </div>
  );
}
