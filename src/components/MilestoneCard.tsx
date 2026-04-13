'use client';

export interface MilestoneCardProps {
  title: string;
  pillar: string;
  priority: number;
  isComplete: boolean;
  onToggle: () => void;
}

const pillarIcons: Record<string, string> = {
  Academics: '🎓',
  Extracurriculars: '🏆',
  Skills: '🧠',
  CollegePrep: '🔍',
  PersonalGrowth: '💪',
};

const pillarColors: Record<string, string> = {
  Academics: 'bg-blue-100 text-blue-700',
  Extracurriculars: 'bg-green-100 text-green-700',
  Skills: 'bg-purple-100 text-purple-700',
  CollegePrep: 'bg-amber-100 text-amber-700',
  PersonalGrowth: 'bg-rose-100 text-rose-700',
};

const priorityBadges: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-green-100 text-green-700',
};

const priorityLabels: Record<number, string> = {
  1: 'P1',
  2: 'P2',
  3: 'P3',
};

export default function MilestoneCard({ title, pillar, priority, isComplete, onToggle }: MilestoneCardProps) {
  const icon = pillarIcons[pillar] ?? '📌';
  const badgeColor = pillarColors[pillar] ?? 'bg-slate-100 text-slate-600';
  const pBadgeColor = priorityBadges[priority] ?? 'bg-slate-100 text-slate-600';
  const pLabel = priorityLabels[priority] ?? 'P2';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
        isComplete
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
      }`}
    >
      {/* Checkbox */}
      <span
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs transition-colors ${
          isComplete
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-slate-300'
        }`}
      >
        {isComplete && '✓'}
      </span>

      {/* Title */}
      <span
        className={`flex-1 text-sm font-medium ${
          isComplete ? 'line-through text-slate-400' : 'text-slate-700'
        }`}
      >
        {title}
      </span>

      {/* Priority badge */}
      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${pBadgeColor}`}>
        {pLabel}
      </span>

      {/* Pillar badge */}
      <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
        {icon} {pillar}
      </span>
    </button>
  );
}
