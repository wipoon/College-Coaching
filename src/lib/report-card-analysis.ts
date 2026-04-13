// Report Card Analysis Engine — deterministic, no AI dependency
import {
  percentageToLetter,
  percentageToGpa,
  letterToPercentage,
  gradeColor,
  normalizeSubject,
  isCoreSubject,
} from "./grading-scale";

export interface SubjectInput {
  subject: string;
  gradeType: "percentage" | "letter" | "pass_fail";
  rawGrade: string;
  includeInAnalysis?: boolean;
}

export interface AnalyzedSubject {
  subject: string;
  normalizedSubject: string;
  gradeType: string;
  rawGrade: string;
  percentage: number | null;
  letterGrade: string | null;
  gpa: number | null;
  color: string;
  isCore: boolean;
  includeInAnalysis: boolean;
  status: "excellent" | "good" | "needs-improvement" | "critical" | "pass" | "fail" | "na";
}

export interface ReportCardAnalysis {
  subjects: AnalyzedSubject[];
  coreAverage: number | null;
  overallAverage: number | null;
  estimatedGpa: number | null;
  strengths: AnalyzedSubject[];
  needsImprovement: AnalyzedSubject[];
  critical: AnalyzedSubject[];
  subjectCount: number;
  analyzableCount: number;
}

export interface TrendItem {
  subject: string;
  normalizedSubject: string;
  currentPct: number | null;
  previousPct: number | null;
  change: number | null;
  direction: "up" | "down" | "stable" | "na";
}

export interface TrendAnalysis {
  subjects: TrendItem[];
  overallDirection: "improving" | "declining" | "stable" | "insufficient-data";
  previousTerm: string;
}

/** Analyze a single subject entry */
function analyzeSubject(input: SubjectInput): AnalyzedSubject {
  const norm = normalizeSubject(input.subject);
  const core = isCoreSubject(norm);
  const include = input.includeInAnalysis !== false;

  let percentage: number | null = null;
  let letterGrade: string | null = null;
  let gpa: number | null = null;
  let color = "bg-gray-100 text-gray-600";
  let status: AnalyzedSubject["status"] = "na";

  if (input.gradeType === "percentage") {
    const pct = parseFloat(input.rawGrade);
    if (!isNaN(pct)) {
      percentage = Math.min(Math.max(pct, 0), 100);
      letterGrade = percentageToLetter(percentage);
      gpa = percentageToGpa(percentage);
      color = gradeColor(percentage);
      if (percentage >= 90) status = "excellent";
      else if (percentage >= 86) status = "good";
      else if (percentage >= 75) status = "needs-improvement";
      else status = "critical";
    }
  } else if (input.gradeType === "letter") {
    letterGrade = input.rawGrade.trim();
    percentage = letterToPercentage(letterGrade);
    if (percentage !== null) {
      gpa = percentageToGpa(percentage);
      color = gradeColor(percentage);
      if (percentage >= 90) status = "excellent";
      else if (percentage >= 86) status = "good";
      else if (percentage >= 75) status = "needs-improvement";
      else status = "critical";
    }
  } else if (input.gradeType === "pass_fail") {
    const raw = input.rawGrade.toLowerCase().trim();
    status = raw === "pass" || raw === "p" ? "pass" : "fail";
    letterGrade = status === "pass" ? "P" : "F";
  }

  return {
    subject: input.subject,
    normalizedSubject: norm,
    gradeType: input.gradeType,
    rawGrade: input.rawGrade,
    percentage,
    letterGrade,
    gpa,
    color,
    isCore: core,
    includeInAnalysis: include,
    status,
  };
}

/** Main analysis function */
export function analyzeReportCard(subjects: SubjectInput[]): ReportCardAnalysis {
  const analyzed = subjects.map(analyzeSubject);

  // Filter to subjects with numeric grades that should be analyzed
  const analyzable = analyzed.filter(
    (s) => s.includeInAnalysis && s.percentage !== null
  );
  const coreAnalyzable = analyzable.filter((s) => s.isCore);

  // Compute averages
  const calcAvg = (items: AnalyzedSubject[]): number | null => {
    const nums = items.map((s) => s.percentage).filter((p): p is number => p !== null);
    if (nums.length === 0) return null;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
  };

  const overallAverage = calcAvg(analyzable);
  const coreAverage = calcAvg(coreAnalyzable);

  // Estimated GPA
  const gpaValues = analyzable
    .map((s) => s.gpa)
    .filter((g): g is number => g !== null);
  const estimatedGpa =
    gpaValues.length > 0
      ? Math.round((gpaValues.reduce((a, b) => a + b, 0) / gpaValues.length) * 100) / 100
      : null;

  // Strengths (≥ 90%), needs improvement (< 86%), critical (< 75%)
  const strengths = analyzable
    .filter((s) => s.status === "excellent")
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));

  const needsImprovement = analyzable
    .filter((s) => s.status === "needs-improvement")
    .sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0));

  const critical = analyzable
    .filter((s) => s.status === "critical")
    .sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0));

  return {
    subjects: analyzed,
    coreAverage,
    overallAverage,
    estimatedGpa,
    strengths,
    needsImprovement,
    critical,
    subjectCount: analyzed.length,
    analyzableCount: analyzable.length,
  };
}

/** Detect trends between current and previous report cards */
export function detectTrends(
  currentSubjects: AnalyzedSubject[],
  previousSubjects: AnalyzedSubject[],
  previousTerm: string
): TrendAnalysis {
  const trendItems: TrendItem[] = [];
  let totalChange = 0;
  let comparableCount = 0;

  for (const curr of currentSubjects) {
    if (curr.percentage === null) continue;

    const prev = previousSubjects.find(
      (p) => p.normalizedSubject === curr.normalizedSubject && p.percentage !== null
    );

    if (prev && prev.percentage !== null) {
      const change = Math.round((curr.percentage - prev.percentage) * 10) / 10;
      totalChange += change;
      comparableCount++;
      trendItems.push({
        subject: curr.subject,
        normalizedSubject: curr.normalizedSubject,
        currentPct: curr.percentage,
        previousPct: prev.percentage,
        change,
        direction: change > 1 ? "up" : change < -1 ? "down" : "stable",
      });
    } else {
      trendItems.push({
        subject: curr.subject,
        normalizedSubject: curr.normalizedSubject,
        currentPct: curr.percentage,
        previousPct: null,
        change: null,
        direction: "na",
      });
    }
  }

  let overallDirection: TrendAnalysis["overallDirection"] = "insufficient-data";
  if (comparableCount >= 2) {
    const avgChange = totalChange / comparableCount;
    overallDirection = avgChange > 1 ? "improving" : avgChange < -1 ? "declining" : "stable";
  }

  return { subjects: trendItems, overallDirection, previousTerm };
}
