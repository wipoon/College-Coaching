export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalCategory =
  | "Academic"
  | "Extracurricular"
  | "PersonalGrowth"
  | "CollegePrep";

export type GoalStatus = "not_started" | "in_progress" | "done";

export interface MilestoneProgress {
  id: string;
  userId: string;
  grade: number;
  pillar: Pillar;
  milestoneKey: string;
  title: string;
  isComplete: boolean;
  completedAt?: string;
}

export type Pillar =
  | "Academics"
  | "Extracurriculars"
  | "Skills"
  | "CollegePrep"
  | "PersonalGrowth";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface WeeklyCheckIn {
  id: string;
  userId: string;
  weekOf: string;
  wentWell?: string;
  wasHard?: string;
  nextWeekPlan?: string;
  aiSummary?: string;
  createdAt: string;
}

export interface GradeRoadmap {
  grade: number;
  title: string;
  theme: string;
  pillars: PillarSection[];
}

export interface PillarSection {
  name: Pillar;
  icon: string;
  items: RoadmapItem[];
}

export interface RoadmapItem {
  key: string;
  title: string;
  semester?: string;
  isComplete: boolean;
}

export const PILLAR_CONFIG: Record<Pillar, { icon: string; color: string; label: string }> = {
  Academics: { icon: "🎓", color: "blue", label: "Academics" },
  Extracurriculars: { icon: "🏆", color: "amber", label: "Extracurriculars" },
  Skills: { icon: "🧠", color: "green", label: "Skills & Habits" },
  CollegePrep: { icon: "🔍", color: "purple", label: "College & Career Prep" },
  PersonalGrowth: { icon: "💪", color: "rose", label: "Personal Growth" },
};

export const GRADE_THEMES: Record<number, { title: string; theme: string }> = {
  6: { title: "6th Grade", theme: "Foundation Year — Build the Basics" },
  7: { title: "7th Grade", theme: "Growth Year — Strengthen & Explore" },
  8: { title: "8th Grade", theme: "Transition Year — Prepare for High School" },
  9: { title: "9th Grade", theme: "Launch Year — Everything Counts Now" },
  10: { title: "10th Grade", theme: "Building Year — Go Deeper" },
  11: { title: "11th Grade", theme: "Critical Year — The Big Push" },
  12: { title: "12th Grade", theme: "Application Year — Finish Strong" },
};
