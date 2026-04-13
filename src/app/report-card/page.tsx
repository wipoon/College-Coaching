'use client';

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SUBJECTS } from '@/lib/grading-scale';
import { percentageToLetter } from '@/lib/grading-scale';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubjectEntry {
  id: string;
  subject: string;
  gradeType: 'percentage' | 'letter' | 'pass_fail';
  rawGrade: string;
  includeInAnalysis: boolean;
  notes: string;
}

interface AnalyzedSubject {
  subject: string;
  gradeType: string;
  rawGrade: string;
  percentage: number | null;
  letterGrade: string | null;
  gpa: number | null;
  color: string;
  status: string;
  isCore: boolean;
  includeInAnalysis: boolean;
}

interface AnalysisResult {
  subjects: AnalyzedSubject[];
  coreAverage: number | null;
  overallAverage: number | null;
  estimatedGpa: number | null;
  strengths: AnalyzedSubject[];
  needsImprovement: AnalyzedSubject[];
  critical: AnalyzedSubject[];
}

interface TrendItem {
  subject: string;
  currentPct: number | null;
  previousPct: number | null;
  change: number | null;
  direction: 'up' | 'down' | 'stable' | 'na';
}

interface TrendAnalysis {
  subjects: TrendItem[];
  overallDirection: string;
  previousTerm: string;
}

interface SubjectPlan {
  subject: string;
  currentGrade: string;
  status: string;
  recommendations: string[];
  weeklyMinutes: number;
}

interface CoachPlan {
  overallAssessment: string;
  subjectPlans: SubjectPlan[];
  weeklySchedule: string;
  parentTalkingPoints: string[];
  generatedBy: 'ai' | 'template';
}

interface PastReportCard {
  id: string;
  schoolYear: string;
  term: string;
  grade: number;
  createdAt: string;
  subjects: Array<{
    subject: string;
    gradeType: string;
    rawGrade: string;
    percentage: number | null;
    letterGrade: string | null;
    includeInAnalysis: boolean;
    notes: string | null;
  }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCHOOL_YEARS = ['2025-2026', '2024-2025', '2023-2024'];
const TERMS = ['Fall', 'Spring', 'Q1', 'Q2', 'Semester 1', 'Semester 2'];
const LETTER_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

function uid(): string {
  return crypto.randomUUID();
}

function buildDefaultSubjects(grade: number): SubjectEntry[] {
  const defaults = DEFAULT_SUBJECTS[grade] ?? DEFAULT_SUBJECTS[7];
  return defaults.map((d) => ({
    id: uid(),
    subject: d.subject,
    gradeType: d.gradeType as SubjectEntry['gradeType'],
    rawGrade: '',
    includeInAnalysis: d.gradeType !== 'pass_fail',
    notes: '',
  }));
}

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    excellent: { label: 'Excellent', cls: 'bg-emerald-100 text-emerald-800' },
    good: { label: 'Good', cls: 'bg-blue-100 text-blue-800' },
    'needs-improvement': { label: 'Needs Improvement', cls: 'bg-amber-100 text-amber-800' },
    critical: { label: 'Critical', cls: 'bg-red-100 text-red-800' },
    pass: { label: 'Pass', cls: 'bg-emerald-100 text-emerald-800' },
    fail: { label: 'Fail', cls: 'bg-red-100 text-red-800' },
    na: { label: '—', cls: 'bg-slate-100 text-slate-600' },
  };
  const info = map[status] ?? map.na;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${info.cls}`}>
      {info.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportCardPage() {
  // Header state
  const [schoolYear, setSchoolYear] = useState(SCHOOL_YEARS[0]);
  const [term, setTerm] = useState(TERMS[0]);
  const [gradeLevel] = useState(7);

  // Subject rows
  const [subjects, setSubjects] = useState<SubjectEntry[]>(() => buildDefaultSubjects(7));

  // Save / analysis state
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [trends, setTrends] = useState<TrendAnalysis | null>(null);
  const [error, setError] = useState('');

  // Coach plan state
  const [coachPlan, setCoachPlan] = useState<CoachPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Past report cards
  const [pastCards, setPastCards] = useState<PastReportCard[]>([]);

  // -----------------------------------------------------------------------
  // Fetch past report cards on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/report-card?userId=default-student');
        if (res.ok) setPastCards(await res.json());
      } catch {
        /* ignore */
      }
    })();
  }, [savedId]);

  // -----------------------------------------------------------------------
  // Subject row helpers
  // -----------------------------------------------------------------------
  const updateSubject = useCallback(
    (id: string, patch: Partial<SubjectEntry>) => {
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [],
  );

  const removeSubject = useCallback((id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addSubject = useCallback(() => {
    setSubjects((prev) => [
      ...prev,
      { id: uid(), subject: '', gradeType: 'percentage', rawGrade: '', includeInAnalysis: true, notes: '' },
    ]);
  }, []);

  // -----------------------------------------------------------------------
  // Save & Analyze
  // -----------------------------------------------------------------------
  const handleSave = async () => {
    setError('');
    setSaving(true);
    setAnalysis(null);
    setTrends(null);
    setCoachPlan(null);

    try {
      const payload = {
        userId: 'default-student',
        schoolYear,
        term,
        grade: gradeLevel,
        subjects: subjects
          .filter((s) => s.subject.trim())
          .map((s) => ({
            subject: s.subject,
            gradeType: s.gradeType,
            rawGrade: s.rawGrade,
            includeInAnalysis: s.includeInAnalysis,
            notes: s.notes,
          })),
      };

      const saveRes = await fetch('/api/report-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!saveRes.ok) throw new Error('Failed to save report card');
      const saved = await saveRes.json();
      setSavedId(saved.id);

      // Analyze
      const analyzeRes = await fetch(`/api/report-card/${saved.id}/analyze`);
      if (!analyzeRes.ok) throw new Error('Failed to analyze report card');
      const data = await analyzeRes.json();
      setAnalysis(data.analysis);
      setTrends(data.trends ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Coach Plan
  // -----------------------------------------------------------------------
  const fetchCoachPlan = async () => {
    if (!savedId) return;
    setPlanLoading(true);
    setCoachPlan(null);

    try {
      const res = await fetch(`/api/report-card/${savedId}/coach-plan`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate coach plan');
      const data = await res.json();
      setCoachPlan(data.plan);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan');
    } finally {
      setPlanLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Load a past report card into the form
  // -----------------------------------------------------------------------
  const loadPastCard = (card: PastReportCard) => {
    setSchoolYear(card.schoolYear);
    setTerm(card.term);
    setSavedId(card.id);
    setAnalysis(null);
    setTrends(null);
    setCoachPlan(null);
    setSubjects(
      card.subjects.map((s) => ({
        id: uid(),
        subject: s.subject,
        gradeType: s.gradeType as SubjectEntry['gradeType'],
        rawGrade: s.rawGrade,
        includeInAnalysis: s.includeInAnalysis,
        notes: s.notes ?? '',
      })),
    );
  };

  // -----------------------------------------------------------------------
  // Letter grade helper for percentage display
  // -----------------------------------------------------------------------
  const letterHint = (entry: SubjectEntry) => {
    if (entry.gradeType !== 'percentage' || !entry.rawGrade) return null;
    const pct = parseFloat(entry.rawGrade);
    if (isNaN(pct)) return null;
    return percentageToLetter(Math.min(Math.max(pct, 0), 100));
  };

  // -----------------------------------------------------------------------
  // Has any filled subject?
  // -----------------------------------------------------------------------
  const canSave = subjects.some((s) => s.subject.trim() && s.rawGrade.trim());

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* ============================================================= */}
        {/* Header */}
        {/* ============================================================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">📝 Enter Your Report Card</h1>
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              School Year
              <select
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {SCHOOL_YEARS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col text-sm font-medium text-slate-700">
              Term
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TERMS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>

            <div className="flex flex-col text-sm font-medium text-slate-700">
              Grade Level
              <span className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {gradeLevel}th Grade
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* Subject Entry Form */}
        {/* ============================================================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Subjects</h2>

          {/* Column headers (desktop) */}
          <div className="mb-2 hidden grid-cols-[1fr_140px_160px_60px_36px] items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid">
            <span>Subject</span>
            <span>Grade Type</span>
            <span>Grade</span>
            <span className="text-center">Incl.</span>
            <span />
          </div>

          <div className="space-y-3">
            {subjects.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-1 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-[1fr_140px_160px_60px_36px]"
              >
                {/* Subject name */}
                <input
                  type="text"
                  placeholder="Subject name"
                  value={entry.subject}
                  onChange={(e) => updateSubject(entry.id, { subject: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                {/* Grade type */}
                <select
                  value={entry.gradeType}
                  onChange={(e) =>
                    updateSubject(entry.id, {
                      gradeType: e.target.value as SubjectEntry['gradeType'],
                      rawGrade: '',
                    })
                  }
                  className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="letter">Letter Grade</option>
                  <option value="pass_fail">Pass/Fail</option>
                </select>

                {/* Grade input */}
                <div className="flex items-center gap-2">
                  {entry.gradeType === 'percentage' && (
                    <>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0-100"
                        value={entry.rawGrade}
                        onChange={(e) => updateSubject(entry.id, { rawGrade: e.target.value })}
                        className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      {letterHint(entry) && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                          {letterHint(entry)}
                        </span>
                      )}
                    </>
                  )}
                  {entry.gradeType === 'letter' && (
                    <select
                      value={entry.rawGrade}
                      onChange={(e) => updateSubject(entry.id, { rawGrade: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select…</option>
                      {LETTER_GRADES.map((lg) => (
                        <option key={lg}>{lg}</option>
                      ))}
                    </select>
                  )}
                  {entry.gradeType === 'pass_fail' && (
                    <select
                      value={entry.rawGrade}
                      onChange={(e) => updateSubject(entry.id, { rawGrade: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select…</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </select>
                  )}
                </div>

                {/* Include in analysis */}
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={entry.includeInAnalysis}
                    onChange={(e) => updateSubject(entry.id, { includeInAnalysis: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeSubject(entry.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                  title="Remove subject"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSubject}
            className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50"
          >
            ➕ Add Subject
          </button>
        </div>

        {/* ============================================================= */}
        {/* Save & Analyze */}
        {/* ============================================================= */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {saving ? 'Saving & Analyzing…' : 'Save & Analyze'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* ============================================================= */}
        {/* Analysis Results */}
        {/* ============================================================= */}
        {analysis && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">📊 Overview</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Average</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {analysis.overallAverage != null ? `${analysis.overallAverage.toFixed(1)}%` : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Est. GPA</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {analysis.estimatedGpa != null ? analysis.estimatedGpa.toFixed(2) : '—'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">estimated — your school may calculate differently</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overall Grade</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {analysis.overallAverage != null ? percentageToLetter(analysis.overallAverage) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Subject Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="pb-2 pr-4">Subject</th>
                      <th className="pb-2 pr-4">Grade</th>
                      <th className="pb-2 pr-4">Letter</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analysis.subjects.map((s, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-medium text-slate-900">{s.subject}</td>
                        <td className="py-2 pr-4 text-slate-700">
                          {s.gradeType === 'percentage' && s.percentage != null
                            ? `${s.percentage}%`
                            : s.rawGrade}
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{s.letterGrade ?? '—'}</td>
                        <td className="py-2">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">💪 Strengths</h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                      {s.subject}
                      <span className="text-xs opacity-75">
                        {s.percentage != null ? `${s.percentage}%` : s.letterGrade}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Needs Attention */}
            {(analysis.needsImprovement.length > 0 || analysis.critical.length > 0) && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">⚠️ Needs Attention</h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.critical.map((s, i) => (
                    <span key={`c-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-800">
                      {s.subject}
                      <span className="text-xs opacity-75">
                        {s.percentage != null ? `${s.percentage}%` : s.letterGrade}
                      </span>
                    </span>
                  ))}
                  {analysis.needsImprovement.map((s, i) => (
                    <span key={`n-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                      {s.subject}
                      <span className="text-xs opacity-75">
                        {s.percentage != null ? `${s.percentage}%` : s.letterGrade}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trends */}
            {trends && trends.subjects.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">📈 Trends (vs {trends.previousTerm})</h2>
                <div className="space-y-2">
                  {trends.subjects.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-lg">
                        {t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→'}
                      </span>
                      <span className="font-medium text-slate-900">{t.subject}</span>
                      {t.change != null && (
                        <span
                          className={`text-xs font-semibold ${
                            t.direction === 'up'
                              ? 'text-emerald-600'
                              : t.direction === 'down'
                                ? 'text-red-600'
                                : 'text-slate-500'
                          }`}
                        >
                          {t.change > 0 ? '+' : ''}
                          {t.change.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* Coach Plan */}
        {/* ============================================================= */}
        {analysis && (
          <div className="space-y-6">
            {!coachPlan && !planLoading && (
              <button
                type="button"
                onClick={fetchCoachPlan}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                🎯 Get Your Personalized Coach Plan
              </button>
            )}

            {planLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-sm text-slate-600">Your coach is preparing a personalized plan…</span>
              </div>
            )}

            {coachPlan && (
              <div className="space-y-6">
                {/* Overall Assessment */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-3 text-lg font-semibold text-slate-900">🎯 Coach Plan</h2>
                  <p className="text-sm leading-relaxed text-slate-700">{coachPlan.overallAssessment}</p>
                </div>

                {/* Subject Plans */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-slate-900">Subject Plans</h3>
                  <div className="space-y-4">
                    {coachPlan.subjectPlans.map((sp, i) => (
                      <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">{sp.subject}</span>
                          <span className="text-sm text-slate-500">{sp.currentGrade}</span>
                          <StatusBadge status={sp.status} />
                          {sp.weeklyMinutes > 0 && (
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              {sp.weeklyMinutes} min/week
                            </span>
                          )}
                        </div>
                        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                          {sp.recommendations.map((rec, j) => (
                            <li key={j}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Schedule */}
                {coachPlan.weeklySchedule && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-2 text-base font-semibold text-slate-900">📅 Weekly Schedule</h3>
                    <p className="text-sm leading-relaxed text-slate-700">{coachPlan.weeklySchedule}</p>
                  </div>
                )}

                {/* Parent Talking Points */}
                {coachPlan.parentTalkingPoints.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-2 text-base font-semibold text-slate-900">👨‍👩‍👧 Parent Talking Points</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                      {coachPlan.parentTalkingPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Regenerate & Attribution */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={fetchCoachPlan}
                    disabled={planLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    🔄 Regenerate Plan
                  </button>
                  <span className="text-xs text-slate-400">
                    {coachPlan.generatedBy === 'ai' ? 'Generated by AI' : 'Generated from study templates'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* Past Report Cards */}
        {/* ============================================================= */}
        {pastCards.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">📚 Past Report Cards</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pastCards.map((card) => {
                const pctSubjects = card.subjects.filter(
                  (s) => s.includeInAnalysis && s.percentage != null,
                );
                const avg =
                  pctSubjects.length > 0
                    ? pctSubjects.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / pctSubjects.length
                    : null;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => loadPastCard(card)}
                    className={`rounded-lg border p-4 text-left transition hover:border-indigo-300 hover:shadow-sm ${
                      savedId === card.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {card.term} {card.schoolYear}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </p>
                    {avg != null && (
                      <p className="mt-1 text-lg font-bold text-slate-900">{avg.toFixed(1)}%</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
