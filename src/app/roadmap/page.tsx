'use client';

import { useState, useEffect, useCallback } from 'react';
import MilestoneCard from '@/components/MilestoneCard';
import { GRADE_THEMES } from '@/types';

interface Milestone {
  milestoneKey: string;
  title: string;
  pillar: string;
  isComplete: boolean;
}

const GRADES = [6, 7, 8, 9, 10, 11, 12];

const PILLAR_FILTERS = [
  { key: 'all', label: '🎓 All' },
  { key: 'Academics', label: '🎓 Academics' },
  { key: 'Extracurriculars', label: '🏆 Extracurriculars' },
  { key: 'Skills', label: '🧠 Skills' },
  { key: 'College Prep', label: '🔍 College Prep' },
  { key: 'Growth', label: '💪 Growth' },
];

export default function RoadmapPage() {
  const [selectedGrade, setSelectedGrade] = useState(7);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [pillarFilter, setPillarFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMilestones = useCallback(async (grade: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/milestones?userId=default-student&grade=${grade}`
      );
      if (!res.ok) throw new Error('Failed to load milestones');
      const data = await res.json();
      setMilestones(data.milestones ?? data ?? []);
    } catch {
      setError('Could not load milestones. Please try again.');
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilestones(selectedGrade);
  }, [selectedGrade, fetchMilestones]);

  const handleToggle = async (milestoneKey: string, currentComplete: boolean) => {
    // Optimistic update
    setMilestones((prev) =>
      prev.map((m) =>
        m.milestoneKey === milestoneKey
          ? { ...m, isComplete: !currentComplete }
          : m
      )
    );

    try {
      await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-student',
          grade: selectedGrade,
          milestoneKey,
          isComplete: !currentComplete,
        }),
      });
    } catch {
      // Revert on failure
      setMilestones((prev) =>
        prev.map((m) =>
          m.milestoneKey === milestoneKey
            ? { ...m, isComplete: currentComplete }
            : m
        )
      );
    }
  };

  const filtered =
    pillarFilter === 'all'
      ? milestones
      : milestones.filter((m) => m.pillar === pillarFilter);

  const completedCount = milestones.filter((m) => m.isComplete).length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const gradeInfo = GRADE_THEMES[selectedGrade];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">🗺️ Your Roadmap</h1>

      {/* Grade timeline */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 py-3">
        {GRADES.map((g, i) => (
          <div key={g} className="flex items-center">
            <button
              onClick={() => setSelectedGrade(g)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-bold transition-all ${
                g === selectedGrade
                  ? 'bg-indigo-600 text-white shadow-lg scale-110'
                  : g <= 7
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {g}
            </button>
            {i < GRADES.length - 1 && (
              <div
                className={`w-4 sm:w-8 h-0.5 ${
                  g < 7 ? 'bg-indigo-300' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Grade title & theme */}
      {gradeInfo && (
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-700">
            {gradeInfo.title}
          </h2>
          <p className="text-sm text-slate-500">{gradeInfo.theme}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Progress</span>
          <span className="text-slate-500">
            {completedCount}/{total} milestones ({pct}%)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Pillar filters */}
      <div className="flex flex-wrap gap-2">
        {PILLAR_FILTERS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPillarFilter(p.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              pillarFilter === p.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Milestones */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading milestones…</div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => fetchMilestones(selectedGrade)}
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          No milestones found for this filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <MilestoneCard
              key={m.milestoneKey}
              title={m.title}
              pillar={m.pillar}
              isComplete={m.isComplete}
              onToggle={() => handleToggle(m.milestoneKey, m.isComplete)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
