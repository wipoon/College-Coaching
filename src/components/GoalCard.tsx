'use client';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  targetDate?: string;
}

export interface GoalCardProps {
  goal: Goal;
  onStatusChange: (id: string, status: string) => void;
}

const categoryStyles: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  extracurricular: 'bg-green-100 text-green-700',
  personal: 'bg-purple-100 text-purple-700',
};

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600', icon: '○' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: '◑' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700', icon: '✓' },
};

const statusCycle = ['not_started', 'in_progress', 'done'];

export default function GoalCard({ goal, onStatusChange }: GoalCardProps) {
  const catStyle = categoryStyles[goal.category] ?? 'bg-slate-100 text-slate-600';
  const status = statusConfig[goal.status] ?? statusConfig.not_started;

  const cycleStatus = () => {
    const idx = statusCycle.indexOf(goal.status);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    onStatusChange(goal.id, next);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-800 text-sm leading-snug">
          {goal.title}
        </h3>
        <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${catStyle}`}>
          {goal.category}
        </span>
      </div>

      {goal.description && (
        <p className="text-xs text-slate-500 leading-relaxed">{goal.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={cycleStatus}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer ${status.color}`}
        >
          <span>{status.icon}</span>
          {status.label}
        </button>

        {goal.targetDate && (
          <span className="text-[11px] text-slate-400">🎯 {goal.targetDate}</span>
        )}
      </div>
    </div>
  );
}
