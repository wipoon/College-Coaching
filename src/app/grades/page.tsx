'use client';

const GRADE_TABLE = [
  { letter: 'A+', pct: '97–100%', gpa: '4.0', color: 'bg-emerald-100 text-emerald-800' },
  { letter: 'A',  pct: '93–96%',  gpa: '4.0', color: 'bg-emerald-100 text-emerald-800' },
  { letter: 'A-', pct: '90–92%',  gpa: '3.7', color: 'bg-emerald-50 text-emerald-700' },
  { letter: 'B+', pct: '87–89%',  gpa: '3.3', color: 'bg-blue-100 text-blue-800' },
  { letter: 'B',  pct: '83–86%',  gpa: '3.0', color: 'bg-blue-100 text-blue-800' },
  { letter: 'B-', pct: '80–82%',  gpa: '2.7', color: 'bg-blue-50 text-blue-700' },
  { letter: 'C+', pct: '77–79%',  gpa: '2.3', color: 'bg-yellow-100 text-yellow-800' },
  { letter: 'C',  pct: '73–76%',  gpa: '2.0', color: 'bg-yellow-100 text-yellow-800' },
  { letter: 'C-', pct: '70–72%',  gpa: '1.7', color: 'bg-yellow-50 text-yellow-700' },
  { letter: 'D+', pct: '67–69%',  gpa: '1.3', color: 'bg-orange-100 text-orange-800' },
  { letter: 'D',  pct: '63–66%',  gpa: '1.0', color: 'bg-orange-100 text-orange-800' },
  { letter: 'D-', pct: '60–62%',  gpa: '0.7', color: 'bg-orange-50 text-orange-700' },
  { letter: 'F',  pct: 'Below 60%', gpa: '0.0', color: 'bg-red-100 text-red-800' },
];

const QUICK_TRANSLATIONS = [
  { roadmap: '"Maintain a B+ or higher"', target: '87% or above', emoji: '🎯' },
  { roadmap: '"Aim for straight A\'s"', target: '93%+ in every class', emoji: '⭐' },
  { roadmap: '"GPA of 3.5+"', target: '~90% average across all classes', emoji: '📊' },
  { roadmap: '"GPA of 3.0+"', target: '~83% average across all classes', emoji: '📊' },
  { roadmap: '"No grades below a C"', target: '73% or above in every class', emoji: '⚠️' },
  { roadmap: '"Honor Roll"', target: '90%+ average (check your school)', emoji: '🏅' },
];

const COLLEGE_TARGETS = [
  { type: 'Ivy League / Top 20', gpa: '3.8–4.0', pct: '93%+ average', color: 'border-emerald-400' },
  { type: 'Top 50 Universities', gpa: '3.5–3.8', pct: '90%+ average', color: 'border-blue-400' },
  { type: 'State Universities', gpa: '3.0–3.5', pct: '83%+ average', color: 'border-yellow-400' },
  { type: 'Community Colleges', gpa: 'Open admission', pct: 'All welcome', color: 'border-slate-400' },
];

export default function GradesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">📐 Grade Translator</h1>
        <p className="text-slate-600">
          Your school uses <strong>0–100% grades</strong>. College guides and our roadmap use letter grades.
          Use this page to translate between the two systems.
        </p>
      </div>

      {/* Quick Translation Cards */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">🎯 Quick Translation</h2>
        <p className="text-sm text-slate-500 mb-3">When our roadmap says… aim for this percentage:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_TRANSLATIONS.map((t) => (
            <div key={t.roadmap} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-2xl">{t.emoji}</span>
              <div>
                <p className="text-sm text-slate-500">{t.roadmap}</p>
                <p className="text-lg font-semibold text-indigo-700">{t.target}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full Conversion Table */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">📋 Full Conversion Table</h2>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Letter Grade</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Percentage</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">GPA Points</th>
              </tr>
            </thead>
            <tbody>
              {GRADE_TABLE.map((row) => (
                <tr key={row.letter} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${row.color}`}>
                      {row.letter}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{row.pct}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.gpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* College Targets */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">🎓 What Colleges Expect</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {COLLEGE_TARGETS.map((c) => (
            <div key={c.type} className={`bg-white border-l-4 ${c.color} border border-slate-200 rounded-xl p-4 shadow-sm`}>
              <h3 className="font-semibold text-slate-800">{c.type}</h3>
              <p className="text-sm text-slate-500 mt-1">GPA: {c.gpa}</p>
              <p className="text-lg font-bold text-indigo-700 mt-1">≈ {c.pct}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GPA Explainer */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">🧮 How GPA Works</h2>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <p className="text-slate-700 mb-3">
            <strong>GPA</strong> (Grade Point Average) converts your percentages into a 0–4.0 scale that colleges use to compare students.
          </p>
          <div className="bg-white rounded-lg p-4 mb-3">
            <p className="text-sm font-mono text-slate-600">
              <strong>Example:</strong> Math = 95% (A = 4.0) + English = 88% (B+ = 3.3) + Science = 91% (A- = 3.7)
            </p>
            <p className="text-sm font-mono text-slate-600 mt-1">
              GPA = (4.0 + 3.3 + 3.7) ÷ 3 = <strong className="text-indigo-700">3.67</strong>
            </p>
          </div>
          <p className="text-sm text-slate-500">
            💡 <strong>Tip:</strong> Honors and AP classes often get a +0.5 or +1.0 GPA boost (weighted GPA).
            An A in an AP class could count as 5.0 instead of 4.0.
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>⚠️ Note:</strong> The standard letter-to-percentage conversion above is the most widely used scale.
        Your school uses straight percentages — the letter grade equivalents are provided to help you
        understand college prep materials and our roadmap goals.
      </div>
    </div>
  );
}
