"use client";

import { useEffect, useState } from "react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  completedBlocksTotal: number;
  badges: { id: string; label: string; icon: string; description: string }[];
}

export function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    fetch("/api/streaks")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-20 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Streak stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#181825] border border-[#313244] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{data.currentStreak}</div>
          <div className="text-xs text-[#6c7086] mt-0.5">Current Streak</div>
          <div className="text-lg mt-0.5">🔥</div>
        </div>
        <div className="bg-[#181825] border border-[#313244] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{data.longestStreak}</div>
          <div className="text-xs text-[#6c7086] mt-0.5">Longest Streak</div>
          <div className="text-lg mt-0.5">🏆</div>
        </div>
        <div className="bg-[#181825] border border-[#313244] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{data.completedBlocksTotal}</div>
          <div className="text-xs text-[#6c7086] mt-0.5">Total Blocks</div>
          <div className="text-lg mt-0.5">✅</div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <button
          onClick={() => setShowBadges(!showBadges)}
          className="flex items-center justify-between w-full text-sm font-semibold text-[#cdd6f4] mb-2"
        >
          <span>Badges ({data.badges.length})</span>
          <svg
            className={`w-4 h-4 text-[#6c7086] transition-transform ${showBadges ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showBadges && (
          <div className="grid grid-cols-2 gap-2">
            {data.badges.length === 0 ? (
              <p className="col-span-2 text-sm text-[#6c7086] text-center py-2">
                Complete time blocks to earn badges!
              </p>
            ) : (
              data.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-[#181825] border border-[#313244] rounded-xl p-3 flex items-center gap-2"
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-[#cdd6f4]">{badge.label}</div>
                    <div className="text-[10px] text-[#6c7086]">{badge.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
