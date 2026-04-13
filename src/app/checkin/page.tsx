'use client';

import { useState, useEffect, useCallback } from 'react';
import WeeklyCheckIn from '@/components/WeeklyCheckIn';

interface CheckInRecord {
  id: string;
  weekOf: string;
  wentWell?: string;
  wasHard?: string;
  aiSummary?: string;
  createdAt: string;
}

export default function CheckInPage() {
  const [history, setHistory] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [latestSummary, setLatestSummary] = useState('');
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkin?userId=default-student');
      if (!res.ok) throw new Error('Failed to load check-ins');
      const data = await res.json();
      setHistory(data.checkIns ?? data ?? []);
    } catch {
      setError('Could not load check-in history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (wentWell: string, wasHard: string) => {
    setSubmitting(true);
    setError('');
    setLatestSummary('');

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-student',
          grade: 7,
          wentWell,
          wasHard,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit check-in');

      const data = await res.json();
      setLatestSummary(
        data.aiSummary ?? data.summary ?? 'Check-in submitted successfully!'
      );
      fetchHistory();
    } catch {
      setError('Could not submit check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800">📝 Weekly Check-In</h1>

      {/* Check-in form */}
      <WeeklyCheckIn onSubmit={handleSubmit} isLoading={submitting} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* AI Summary (latest submission) */}
      {latestSummary && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-indigo-800 mb-2">
            🎓 Coach Feedback
          </h3>
          <p className="text-sm text-indigo-700 leading-relaxed whitespace-pre-wrap">
            {latestSummary}
          </p>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-3">
          Past Check-Ins
        </h2>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading…</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-slate-500 text-sm">
              Start your first weekly check-in! Reflecting on your week helps
              you grow.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((ci) => (
              <button
                key={ci.id}
                type="button"
                onClick={() => toggleExpand(ci.id)}
                className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Week of{' '}
                    {new Date(ci.weekOf || ci.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {expandedId === ci.id ? '▲' : '▼'}
                  </span>
                </div>
                {expandedId === ci.id && (
                  <div className="mt-3 space-y-2 text-sm">
                    {ci.wentWell && (
                      <div>
                        <span className="font-medium text-green-700">
                          🎉 Went well:{' '}
                        </span>
                        <span className="text-slate-600">{ci.wentWell}</span>
                      </div>
                    )}
                    {ci.wasHard && (
                      <div>
                        <span className="font-medium text-amber-700">
                          💪 Was hard:{' '}
                        </span>
                        <span className="text-slate-600">{ci.wasHard}</span>
                      </div>
                    )}
                    {ci.aiSummary && (
                      <div className="mt-2 bg-indigo-50 rounded-lg p-3">
                        <span className="font-medium text-indigo-700">
                          🎓 Coach:{' '}
                        </span>
                        <span className="text-indigo-600">{ci.aiSummary}</span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
