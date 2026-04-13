// AI Coach Plan Generator — with template fallback for no-API-key mode
import { getOpenAIClient, DEPLOYMENT_NAME } from "./openai";
import { ReportCardAnalysis, AnalyzedSubject } from "./report-card-analysis";
import { buildKnowledgeContext } from "./knowledge";

export interface CoachPlan {
  overallAssessment: string;
  subjectPlans: SubjectPlan[];
  weeklySchedule: string;
  parentTalkingPoints: string[];
  generatedBy: "ai" | "template";
}

export interface SubjectPlan {
  subject: string;
  currentGrade: string;
  status: string;
  recommendations: string[];
  weeklyMinutes: number;
}

/** Generate an AI-powered improvement plan */
export async function generateCoachPlan(
  analysis: ReportCardAnalysis,
  gradeLevel: number
): Promise<CoachPlan> {
  // Try AI first, fall back to template
  try {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    if (!apiKey) throw new Error("No API key configured");

    return await generateAIPlan(analysis, gradeLevel);
  } catch {
    return generateTemplatePlan(analysis, gradeLevel);
  }
}

async function generateAIPlan(
  analysis: ReportCardAnalysis,
  gradeLevel: number
): Promise<CoachPlan> {
  const client = getOpenAIClient();
  const knowledgeContext = buildKnowledgeContext(gradeLevel);

  const gradesTable = analysis.subjects
    .filter((s) => s.includeInAnalysis)
    .map(
      (s) =>
        `- ${s.subject}: ${s.rawGrade}${s.gradeType === "percentage" ? "%" : ""} (${s.letterGrade || s.status}) — ${s.status}`
    )
    .join("\n");

  const systemPrompt = `You are a caring, encouraging college prep coach for a ${gradeLevel}th grader. 
You help students improve their grades with concrete, actionable study strategies.
Always be positive and motivating — focus on growth, not criticism.
Use age-appropriate language. Be specific and practical.

The student's school uses a 0-100% grading scale:
A = 94-100%, B = 86-93%, C = 75-85%, D = 64-75%, F = 63% or below

Reference knowledge:
${knowledgeContext.slice(0, 3000)}`;

  const userPrompt = `Here are my report card grades:

${gradesTable}

Overall average: ${analysis.overallAverage ?? "N/A"}%
Core subject average: ${analysis.coreAverage ?? "N/A"}%
Estimated GPA: ${analysis.estimatedGpa ?? "N/A"}

Please give me a personalized improvement plan in this exact JSON format:
{
  "overallAssessment": "2-3 encouraging sentences about where the student stands and their potential",
  "subjectPlans": [
    {
      "subject": "Subject Name",
      "currentGrade": "92%",
      "status": "excellent/good/needs-improvement/critical",
      "recommendations": ["specific action 1", "specific action 2", "specific action 3"],
      "weeklyMinutes": 30
    }
  ],
  "weeklySchedule": "A suggested weekly study schedule as a paragraph",
  "parentTalkingPoints": ["point 1 for parents to discuss with student", "point 2"]
}

Focus on the weakest subjects first. Give 2-3 specific, actionable recommendations per subject.
Suggest realistic daily study time based on a ${gradeLevel}th grader's schedule.
Include at least 3 parent talking points.
Return ONLY valid JSON, no markdown fences.`;

  const response = await client.chat.completions.create({
    model: DEPLOYMENT_NAME,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  // Strip markdown fences if present
  const jsonStr = content.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "");

  try {
    const plan = JSON.parse(jsonStr) as CoachPlan;
    plan.generatedBy = "ai";
    return plan;
  } catch {
    // If AI output isn't valid JSON, fall back to template
    return generateTemplatePlan(analysis, gradeLevel);
  }
}

/** Template-based fallback plan (no AI needed) */
function generateTemplatePlan(
  analysis: ReportCardAnalysis,
  gradeLevel: number
): CoachPlan {
  const subjectPlans: SubjectPlan[] = [];

  // Sort subjects: critical first, then needs-improvement, then good, then excellent
  const prioritized = [...analysis.subjects]
    .filter((s) => s.includeInAnalysis && s.percentage !== null)
    .sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0));

  for (const s of prioritized) {
    const plan = buildSubjectPlan(s, gradeLevel);
    subjectPlans.push(plan);
  }

  const overallAssessment = buildOverallAssessment(analysis, gradeLevel);
  const weeklySchedule = buildWeeklySchedule(subjectPlans, gradeLevel);
  const parentTalkingPoints = buildParentPoints(analysis, gradeLevel);

  return {
    overallAssessment,
    subjectPlans,
    weeklySchedule,
    parentTalkingPoints,
    generatedBy: "template",
  };
}

function buildSubjectPlan(s: AnalyzedSubject, grade: number): SubjectPlan {
  const recommendations: string[] = [];
  let weeklyMinutes = 30;

  if (s.status === "critical") {
    weeklyMinutes = grade <= 8 ? 45 : 60;
    recommendations.push(
      `Dedicate ${weeklyMinutes / 5} minutes every school day to ${s.subject} practice`,
      `Ask your teacher for extra practice materials or tutoring options`,
      `Review and redo past tests/quizzes to understand where mistakes happened`,
    );
  } else if (s.status === "needs-improvement") {
    weeklyMinutes = grade <= 8 ? 30 : 45;
    recommendations.push(
      `Spend ${weeklyMinutes / 5} extra minutes per day reviewing ${s.subject} notes`,
      `Create flashcards for key concepts you find tricky`,
      `Form a study group with classmates who are strong in this subject`,
    );
  } else if (s.status === "good") {
    weeklyMinutes = 20;
    recommendations.push(
      `You're doing well — keep up current study habits`,
      `Try challenge problems or enrichment activities to push toward an A`,
      `Review notes briefly before each class to stay sharp`,
    );
  } else if (s.status === "excellent") {
    weeklyMinutes = 15;
    recommendations.push(
      `Excellent work! Maintain your current approach`,
      `Consider helping classmates — teaching others reinforces your knowledge`,
      `Explore advanced topics or competitions in this subject`,
    );
  }

  return {
    subject: s.subject,
    currentGrade: s.percentage !== null ? `${s.percentage}%` : s.rawGrade,
    status: s.status,
    recommendations,
    weeklyMinutes,
  };
}

function buildOverallAssessment(analysis: ReportCardAnalysis, grade: number): string {
  const avg = analysis.overallAverage;
  if (avg === null) return "Enter your grades to get a personalized assessment.";

  if (avg >= 90) {
    return `Great job! Your ${avg}% average shows strong academic performance across your subjects. ` +
      `As a ${grade}th grader, you're building an excellent foundation. ` +
      `Let's focus on maintaining your strengths and pushing even higher in a few areas.`;
  } else if (avg >= 86) {
    return `You're doing solid work with a ${avg}% average — that's a B range which is a good foundation. ` +
      `With some focused effort on your weaker subjects, you can push into the A range. ` +
      `Here's a plan to help you get there.`;
  } else if (avg >= 75) {
    return `Your ${avg}% average shows you have a solid base to build on. ` +
      `There are some subjects that need extra attention, but with consistent effort, ` +
      `you can see real improvement. Let's work together on a plan to bring those grades up.`;
  } else {
    return `Your ${avg}% average tells me some subjects need extra support right now, and that's okay — ` +
      `every student goes through challenging periods. The important thing is having a plan. ` +
      `Let's focus on the areas that need the most help and build from there.`;
  }
}

function buildWeeklySchedule(plans: SubjectPlan[], grade: number): string {
  const totalMin = plans.reduce((sum, p) => sum + p.weeklyMinutes, 0);
  const dailyMin = Math.round(totalMin / 5);
  const critical = plans.filter((p) => p.status === "critical");
  const needsWork = plans.filter((p) => p.status === "needs-improvement");

  let schedule = `Suggested daily study time: about ${dailyMin} minutes after school. `;

  if (critical.length > 0) {
    schedule += `Focus most time on ${critical.map((p) => p.subject).join(" and ")} — ` +
      `these need the most attention. `;
  }
  if (needsWork.length > 0) {
    schedule += `Also give extra time to ${needsWork.map((p) => p.subject).join(" and ")}. `;
  }

  if (grade <= 8) {
    schedule += `At ${grade}th grade, aim for 45-60 minutes of focused study time, with breaks every 20 minutes. ` +
      `Leave time for activities and relaxation too!`;
  } else {
    schedule += `In high school, aim for 1-2 hours of focused study, rotating subjects across the week. ` +
      `Use a planner to track assignments and test dates.`;
  }

  return schedule;
}

function buildParentPoints(analysis: ReportCardAnalysis, grade: number): string[] {
  const points: string[] = [];

  if (analysis.critical.length > 0) {
    points.push(
      `${analysis.critical.map((s) => s.subject).join(" and ")} need immediate attention — ` +
      `consider reaching out to the teacher(s) to discuss support options`
    );
  }

  if (analysis.strengths.length > 0) {
    points.push(
      `Celebrate the wins: ${analysis.strengths.map((s) => `${s.subject} (${s.percentage}%)`).join(", ")} — ` +
      `positive reinforcement keeps motivation high`
    );
  }

  points.push(
    `Set up a consistent daily study routine with a quiet, dedicated space`,
    `Review the report card together and set 2-3 specific grade goals for next term`,
  );

  if (grade >= 9) {
    points.push(`Discuss how these grades connect to college goals — make it real but not stressful`);
  } else {
    points.push(`Focus on building habits now — the specific grades matter less than the study skills being developed`);
  }

  return points;
}
