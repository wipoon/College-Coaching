'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GoalSummary {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface CheckInSummary {
  id: string;
  weekOf: string;
  wentWell?: string;
  wasHard?: string;
  aiSummary?: string;
  createdAt: string;
}

const PARENT_RESOURCES = [
  {
    title: 'How to Support Your Student',
    description:
      'Tips for encouraging academic growth without adding pressure.',
    icon: '💡',
  },
  {
    title: 'Understanding Financial Aid',
    description:
      'An overview of scholarships, grants, and the FAFSA process.',
    icon: '💰',
  },
  {
    title: 'Choosing the Right High School',
    description:
      'What to look for in high school programs, magnets, and prep schools.',
    icon: '🏫',
  },
];

export default function ParentDashboard() {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [goalsRes, checkInsRes] = await Promise.all([
          fetch('/api/goals?userId=default-student'),
          fetch('/api/checkin?userId=default-student'),
        ]);

        if (goalsRes.ok) {
          const gData = await goalsRes.json();
          setGoals(gData.goals ?? gData ?? []);
        }
        if (checkInsRes.ok) {
          const cData = await checkInsRes.json();
          setCheckIns(cData.checkIns ?? cData ?? []);
        }
      } catch {
        // Silently fail — sections will show empty states
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const goalsDone = goals.filter((g) => g.status === 'done').length;
  const goalsInProgress = goals.filter((g) => g.status === 'in_progress').length;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-800">Parent Dashboard 👪</h1>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : (
        <>
          {/* Current Status */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              📊 Current Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">7th</p>
                <p className="text-xs text-slate-500 mt-1">Current Grade</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {goals.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Total Goals</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {goalsDone}
                </p>
                <p className="text-xs text-slate-500 mt-1">Goals Completed</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {goalsInProgress}
                </p>
                <p className="text-xs text-slate-500 mt-1">In Progress</p>
              </div>
            </div>
          </section>

          {/* Recent Goals */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700">
                🎯 Recent Goals
              </h2>
              <Link
                href="/goals"
                className="text-xs text-indigo-600 hover:underline"
              >
                View all →
              </Link>
            </div>
            {goals.length === 0 ? (
              <p className="text-sm text-slate-400">No goals set yet.</p>
            ) : (
              <div className="space-y-2">
                {goals.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-sm text-slate-700">{g.title}</span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        g.status === 'done'
                          ? 'bg-green-100 text-green-700'
                          : g.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {g.status === 'done'
                        ? '✓ Done'
                        : g.status === 'in_progress'
                          ? '◑ In Progress'
                          : '○ Not Started'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Weekly Check-In Summary */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700">
                📝 Weekly Check-In Summary
              </h2>
              <Link
                href="/check-in"
                className="text-xs text-indigo-600 hover:underline"
              >
                View all →
              </Link>
            </div>
            {checkIns.length === 0 ? (
              <p className="text-sm text-slate-400">
                No check-ins submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {checkIns.slice(0, 3).map((ci) => (
                  <div
                    key={ci.id}
                    className="bg-slate-50 rounded-lg p-3 space-y-1"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      Week of{' '}
                      {new Date(
                        ci.weekOf || ci.createdAt
                      ).toLocaleDateString()}
                    </p>
                    {ci.aiSummary && (
                      <p className="text-sm text-slate-700">{ci.aiSummary}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Resources for Parents */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              📚 Resources for Parents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PARENT_RESOURCES.map((r) => (
                <div
                  key={r.title}
                  className="p-4 rounded-lg border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                >
                  <p className="text-2xl mb-2">{r.icon}</p>
                  <h3 className="text-sm font-semibold text-slate-700">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {r.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
            <strong>🔒 Privacy Note:</strong> Chat conversations are private to
            your student. You can see topics discussed but not full transcripts.
          </div>
        </>
      )}
    </div>
  );
}
