'use client';

import { useState } from 'react';

export default function Disclaimer() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-start gap-2 text-xs text-amber-800 mx-4 mt-3">
      <span className="shrink-0 mt-0.5">📋</span>
      <p className="flex-1">
        This tool provides general educational guidance. It is not a substitute
        for a professional school counselor or college admissions advisor.
      </p>
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 text-amber-600 hover:text-amber-800 transition-colors p-0.5 rounded"
        aria-label="Dismiss disclaimer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
