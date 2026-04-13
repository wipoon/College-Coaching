'use client';

import { useState } from 'react';

export interface WeeklyCheckInProps {
  onSubmit: (wentWell: string, wasHard: string) => void;
  isLoading: boolean;
}

export default function WeeklyCheckIn({ onSubmit, isLoading }: WeeklyCheckInProps) {
  const [wentWell, setWentWell] = useState('');
  const [wasHard, setWasHard] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wentWell.trim() && !wasHard.trim()) return;
    onSubmit(wentWell.trim(), wasHard.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          What went well this week? 🎉
        </label>
        <textarea
          value={wentWell}
          onChange={(e) => setWentWell(e.target.value)}
          placeholder="Share a win — big or small! Maybe you finished an assignment, tried something new, or helped a friend…"
          disabled={isLoading}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none disabled:opacity-50 resize-none transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          What was challenging? 💪
        </label>
        <textarea
          value={wasHard}
          onChange={(e) => setWasHard(e.target.value)}
          placeholder="It's okay — challenges help us grow! What felt tough, confusing, or stressful?"
          disabled={isLoading}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none disabled:opacity-50 resize-none transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || (!wentWell.trim() && !wasHard.trim())}
        className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Thinking…
          </>
        ) : (
          'Get Coach Feedback'
        )}
      </button>
    </form>
  );
}
