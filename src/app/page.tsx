import Link from 'next/link';

const features = [
  {
    icon: '💬',
    title: 'AI Coach',
    description:
      'Chat with your personal college coach for study tips, career guidance, and motivation',
    href: '/chat',
  },
  {
    icon: '🗺️',
    title: 'Roadmap',
    description:
      'Follow your grade-by-grade roadmap with clear milestones for every year',
    href: '/roadmap',
  },
  {
    icon: '🎯',
    title: 'Goals',
    description:
      'Set and track your academic, extracurricular, and personal growth goals',
    href: '/goals',
  },
  {
    icon: '📝',
    title: 'Weekly Check-In',
    description:
      'Reflect on your week and get personalized advice from your coach',
    href: '/check-in',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12 sm:py-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Your College Journey Starts Here 🎓
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto px-4">
          A step-by-step guide to help you succeed from 6th grade through
          college admissions
        </p>
        <div className="mt-6 inline-block rounded-full bg-white/20 backdrop-blur px-5 py-2 text-sm font-medium">
          You&apos;re in 7th Grade — the Growth Year! 🌱
        </div>
        <div className="mt-8">
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-amber-300 transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h2 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {f.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {f.description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
