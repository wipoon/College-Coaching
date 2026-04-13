'use client';

import { useState, useEffect, useCallback } from 'react';
import GoalCard from '@/components/GoalCard';

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  targetDate?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'academic', label: '📚 Academic' },
  { value: 'extracurricular', label: '🏆 Extracurricular' },
  { value: 'personal', label: '💪 Personal' },
];

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'academic', label: '📚 Academic' },
  { key: 'extracurricular', label: '🏆 Extracurricular' },
  { key: 'personal', label: '💪 Personal' },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('academic');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/goals?userId=default-student');
      if (!res.ok) throw new Error('Failed to load goals');
      const data = await res.json();
      setGoals(data.goals ?? data ?? []);
    } catch {
      setError('Could not load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-student',
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          targetDate: targetDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create goal');
      const data = await res.json();
      setGoals((prev) => [data.goal ?? data, ...prev]);
      setTitle('');
      setDescription('');
      setCategory('academic');
      setTargetDate('');
      setShowForm(false);
    } catch {
      setError('Could not create goal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
    );

    try {
      await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch {
      fetchGoals(); // Revert by re-fetching
    }
  };

  const filtered =
    filter === 'all'
      ? goals
      : goals.filter((g) => g.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">🎯 My Goals</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Get an A in Math"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about your goal…"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none resize-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating…' : 'Create Goal'}
          </button>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading goals…</div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchGoals}
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-slate-500 text-sm">
            {filter === 'all'
              ? 'No goals yet! Set your first goal to start tracking your progress.'
              : 'No goals in this category yet.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-indigo-600 hover:underline"
            >
              Create your first goal →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
