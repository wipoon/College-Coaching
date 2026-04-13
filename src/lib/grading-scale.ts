// Shared grading scale configuration — school-specific (0-100% system)
// A=94-100, B=86-93, C=75-85, D=64-75, F=63 or below

export interface GradeRange {
  letter: string;
  min: number;
  max: number;
  gpa: number;
  color: string; // tailwind bg class
}

export const GRADING_SCALE: GradeRange[] = [
  { letter: "A+", min: 97, max: 100, gpa: 4.0, color: "bg-emerald-100 text-emerald-800" },
  { letter: "A",  min: 94, max: 96,  gpa: 4.0, color: "bg-emerald-100 text-emerald-800" },
  { letter: "A-", min: 91, max: 93,  gpa: 3.7, color: "bg-emerald-50 text-emerald-700" },
  { letter: "B+", min: 90, max: 90,  gpa: 3.3, color: "bg-blue-100 text-blue-800" },
  { letter: "B",  min: 86, max: 89,  gpa: 3.0, color: "bg-blue-100 text-blue-800" },
  { letter: "B-", min: 85, max: 85,  gpa: 2.7, color: "bg-blue-50 text-blue-700" },
  { letter: "C+", min: 80, max: 84,  gpa: 2.3, color: "bg-yellow-100 text-yellow-800" },
  { letter: "C",  min: 75, max: 79,  gpa: 2.0, color: "bg-yellow-100 text-yellow-800" },
  { letter: "C-", min: 70, max: 74,  gpa: 1.7, color: "bg-yellow-50 text-yellow-700" },
  { letter: "D+", min: 67, max: 69,  gpa: 1.3, color: "bg-orange-100 text-orange-800" },
  { letter: "D",  min: 64, max: 66,  gpa: 1.0, color: "bg-orange-100 text-orange-800" },
  { letter: "D-", min: 60, max: 63,  gpa: 0.7, color: "bg-orange-50 text-orange-700" },
  { letter: "F",  min: 0,  max: 59,  gpa: 0.0, color: "bg-red-100 text-red-800" },
];

/** Convert a percentage to a letter grade using school-specific scale */
export function percentageToLetter(pct: number): string {
  for (const g of GRADING_SCALE) {
    if (pct >= g.min && pct <= g.max) return g.letter;
  }
  return pct > 100 ? "A+" : "F";
}

/** Convert a percentage to GPA points */
export function percentageToGpa(pct: number): number {
  for (const g of GRADING_SCALE) {
    if (pct >= g.min && pct <= g.max) return g.gpa;
  }
  return pct > 100 ? 4.0 : 0.0;
}

/** Convert a letter grade to approximate percentage (midpoint) */
export function letterToPercentage(letter: string): number | null {
  const g = GRADING_SCALE.find((r) => r.letter.toLowerCase() === letter.toLowerCase());
  if (!g) return null;
  return Math.round((g.min + g.max) / 2);
}

/** Get the color class for a percentage */
export function gradeColor(pct: number): string {
  for (const g of GRADING_SCALE) {
    if (pct >= g.min && pct <= g.max) return g.color;
  }
  return pct > 100 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800";
}

// Subject normalization mapping
const SUBJECT_ALIASES: Record<string, string> = {
  "math": "math",
  "mathematics": "math",
  "algebra": "math",
  "geometry": "math",
  "pre-algebra": "math",
  "english": "ela",
  "english language arts": "ela",
  "ela": "ela",
  "language arts": "ela",
  "reading": "ela",
  "writing": "ela",
  "science": "science",
  "life science": "science",
  "earth science": "science",
  "physical science": "science",
  "biology": "science",
  "social studies": "social-studies",
  "history": "social-studies",
  "world history": "social-studies",
  "us history": "social-studies",
  "geography": "social-studies",
  "civics": "social-studies",
  "spanish": "world-language",
  "french": "world-language",
  "world language": "world-language",
  "foreign language": "world-language",
  "mandarin": "world-language",
  "chinese": "world-language",
  "pe": "pe",
  "physical education": "pe",
  "health": "health",
  "art": "art",
  "visual art": "art",
  "music": "music",
  "band": "music",
  "orchestra": "music",
  "choir": "music",
  "technology": "tech",
  "computer science": "tech",
  "computers": "tech",
};

/** Normalize a subject name to a canonical key */
export function normalizeSubject(subject: string): string {
  const lower = subject.toLowerCase().trim();
  return SUBJECT_ALIASES[lower] || lower.replace(/[^a-z0-9]+/g, "-");
}

/** Check if a subject is a core academic subject */
export function isCoreSubject(normalizedKey: string): boolean {
  return ["math", "ela", "science", "social-studies", "world-language"].includes(normalizedKey);
}

// Default subjects pre-populated for each grade
export const DEFAULT_SUBJECTS: Record<number, Array<{ subject: string; gradeType: string }>> = {
  6: [
    { subject: "Mathematics", gradeType: "percentage" },
    { subject: "English Language Arts", gradeType: "percentage" },
    { subject: "Science", gradeType: "percentage" },
    { subject: "Social Studies", gradeType: "percentage" },
    { subject: "World Language", gradeType: "percentage" },
    { subject: "Physical Education", gradeType: "pass_fail" },
    { subject: "Art / Music", gradeType: "percentage" },
  ],
  7: [
    { subject: "Mathematics", gradeType: "percentage" },
    { subject: "English Language Arts", gradeType: "percentage" },
    { subject: "Science", gradeType: "percentage" },
    { subject: "Social Studies", gradeType: "percentage" },
    { subject: "World Language", gradeType: "percentage" },
    { subject: "Physical Education", gradeType: "pass_fail" },
    { subject: "Art / Music", gradeType: "percentage" },
  ],
  8: [
    { subject: "Mathematics", gradeType: "percentage" },
    { subject: "English Language Arts", gradeType: "percentage" },
    { subject: "Science", gradeType: "percentage" },
    { subject: "Social Studies", gradeType: "percentage" },
    { subject: "World Language", gradeType: "percentage" },
    { subject: "Physical Education", gradeType: "pass_fail" },
  ],
  // 9-12 have more varied schedules — start with common core
  9: [
    { subject: "English 9", gradeType: "percentage" },
    { subject: "Algebra I / Geometry", gradeType: "percentage" },
    { subject: "Biology", gradeType: "percentage" },
    { subject: "World History", gradeType: "percentage" },
    { subject: "World Language", gradeType: "percentage" },
    { subject: "Elective", gradeType: "percentage" },
  ],
  10: [
    { subject: "English 10", gradeType: "percentage" },
    { subject: "Geometry / Algebra II", gradeType: "percentage" },
    { subject: "Chemistry", gradeType: "percentage" },
    { subject: "US History", gradeType: "percentage" },
    { subject: "World Language", gradeType: "percentage" },
    { subject: "Elective", gradeType: "percentage" },
  ],
  11: [
    { subject: "English 11 / AP Language", gradeType: "percentage" },
    { subject: "Algebra II / Pre-Calculus", gradeType: "percentage" },
    { subject: "Physics / AP Science", gradeType: "percentage" },
    { subject: "US History / AP History", gradeType: "percentage" },
    { subject: "World Language", gradeType: "percentage" },
    { subject: "Elective", gradeType: "percentage" },
  ],
  12: [
    { subject: "English 12 / AP Literature", gradeType: "percentage" },
    { subject: "Pre-Calculus / Calculus", gradeType: "percentage" },
    { subject: "AP Science", gradeType: "percentage" },
    { subject: "Government / Economics", gradeType: "percentage" },
    { subject: "Elective 1", gradeType: "percentage" },
    { subject: "Elective 2", gradeType: "percentage" },
  ],
};
