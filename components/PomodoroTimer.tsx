"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type Phase = "work" | "break" | "longBreak";

const PHASES: Record<Phase, { label: string; seconds: number; color: string }> = {
  work: { label: "Focus", seconds: 25 * 60, color: "text-red-400 border-red-500" },
  break: { label: "Short Break", seconds: 5 * 60, color: "text-green-400 border-green-500" },
  longBreak: { label: "Long Break", seconds: 15 * 60, color: "text-blue-400 border-blue-500" },
};

export function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(PHASES.work.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [customWork, setCustomWork] = useState(25);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback((p: Phase = phase) => {
    setIsRunning(false);
    const secs = p === "work" ? customWork * 60 : PHASES[p].seconds;
    setSecondsLeft(secs);
  }, [phase, customWork]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            // Auto-advance phase
            setPhase((curPhase) => {
              if (curPhase === "work") {
                const newCount = sessionCount + 1;
                setSessionCount(newCount);
                const nextPhase = newCount % 4 === 0 ? "longBreak" : "break";
                setSecondsLeft(PHASES[nextPhase].seconds);
                return nextPhase;
              } else {
                setSecondsLeft(customWork * 60);
                return "work";
              }
            });
            // Play notification sound
            if (typeof window !== "undefined" && "Notification" in window) {
              Notification.requestPermission().then((perm) => {
                if (perm === "granted") {
                  new Notification("Pomodoro", { body: phase === "work" ? "Time for a break!" : "Back to work!" });
                }
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, phase, sessionCount, customWork]);

  function switchPhase(p: Phase) {
    setPhase(p);
    setIsRunning(false);
    const secs = p === "work" ? customWork * 60 : PHASES[p].seconds;
    setSecondsLeft(secs);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSecs = phase === "work" ? customWork * 60 : PHASES[phase].seconds;
  const progress = ((totalSecs - secondsLeft) / totalSecs) * 100;
  const phaseConfig = PHASES[phase];
  const circumference = 2 * Math.PI * 54;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-8 w-12 h-12 bg-[#1e1e2e] border border-[#313244] hover:border-red-500/50 text-[#cdd6f4] rounded-full shadow-lg transition-all flex items-center justify-center z-40 group"
        title="Pomodoro Timer"
      >
        <span className="text-lg">🍅</span>
        {isRunning && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-28 right-8 w-72 bg-[#1e1e2e] border border-[#313244] rounded-2xl shadow-2xl z-40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#313244]">
        <span className="text-sm font-semibold text-[#cdd6f4] flex items-center gap-2">
          🍅 Pomodoro
          <span className="text-xs text-[#6c7086]">#{sessionCount + 1}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-[#6c7086] hover:text-[#cdd6f4] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-[#6c7086] hover:text-[#cdd6f4] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-[#181825] border-b border-[#313244]">
          <label className="text-xs text-[#9399b2] mb-1 block">Focus Duration (minutes)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={5}
              max={90}
              step={5}
              value={customWork}
              onChange={(e) => {
                setCustomWork(Number(e.target.value));
                if (!isRunning && phase === "work") setSecondsLeft(Number(e.target.value) * 60);
              }}
              className="flex-1 accent-red-500"
            />
            <span className="text-sm text-[#cdd6f4] w-8 text-right">{customWork}</span>
          </div>
        </div>
      )}

      {/* Phase tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {(["work", "break", "longBreak"] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => switchPhase(p)}
            className={cn(
              "flex-1 py-1 text-xs rounded-lg transition-colors",
              phase === p
                ? "bg-[#313244] text-[#cdd6f4] font-semibold"
                : "text-[#6c7086] hover:text-[#9399b2]"
            )}
          >
            {p === "work" ? "Focus" : p === "break" ? "Break" : "Long"}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center py-4 px-4">
        <div className="relative w-32 h-32 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#313244" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={phase === "work" ? "#ef4444" : phase === "break" ? "#22c55e" : "#3b82f6"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold tabular-nums", phaseConfig.color.split(" ")[0])}>
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </span>
            <span className="text-xs text-[#6c7086] mt-0.5">{phaseConfig.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => resetTimer()}
            className="p-2 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "px-6 py-2 text-sm font-semibold text-white rounded-xl transition-all",
              isRunning
                ? "bg-[#313244] hover:bg-[#45475a]"
                : phase === "work" ? "bg-red-600 hover:bg-red-500" : phase === "break" ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"
            )}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => {
              const phases: Phase[] = ["work", "break", "longBreak"];
              const next = phases[(phases.indexOf(phase) + 1) % phases.length];
              switchPhase(next);
            }}
            className="p-2 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
            title="Skip"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex items-center justify-center gap-1.5 pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              i < (sessionCount % 4) ? "bg-red-500" : "bg-[#313244]"
            )}
          />
        ))}
        <span className="text-[10px] text-[#6c7086] ml-1">{sessionCount} sessions done</span>
      </div>
    </div>
  );
}
