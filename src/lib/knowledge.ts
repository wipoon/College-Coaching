import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface KnowledgeArticle {
  slug: string;
  title: string;
  content: string;
  grade?: string;       // "all" or "6" through "12"
  topic: string;
  audience: string;     // "student" | "parent" | "all"
  pillar?: string;
  lastUpdated: string;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");

/**
 * Load a single markdown file from the knowledge base.
 */
export function loadArticle(relativePath: string): KnowledgeArticle | null {
  const fullPath = path.join(KNOWLEDGE_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug: relativePath.replace(/\.md$/, ""),
    title: (data.title as string) || relativePath,
    content: content.trim(),
    grade: data.grade?.toString(),
    topic: (data.topic as string) || "",
    audience: (data.audience as string) || "all",
    pillar: data.pillar as string | undefined,
    lastUpdated: (data.lastUpdated as string) || "",
  };
}

/**
 * Load all articles from a subdirectory.
 */
export function loadArticlesFromDir(subdir: string): KnowledgeArticle[] {
  const dirPath = path.join(KNOWLEDGE_DIR, subdir);
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".md"))
    .map((f) => loadArticle(path.join(subdir, f)))
    .filter((a): a is KnowledgeArticle => a !== null);
}

/**
 * Get the grade roadmap for a specific grade.
 */
export function getGradeRoadmap(grade: number): KnowledgeArticle | null {
  return loadArticle(`roadmap/${grade}th-grade.md`);
}

/**
 * Build context string for the AI from relevant knowledge base articles.
 * Loads the grade roadmap + all study habits + motivation content.
 */
export function buildKnowledgeContext(grade: number): string {
  const sections: string[] = [];

  // Grade-specific roadmap (highest priority)
  const roadmap = getGradeRoadmap(grade);
  if (roadmap) {
    sections.push(`## ${roadmap.title}\n${roadmap.content}`);
  }

  // Study habits
  const habits = loadArticlesFromDir("study-habits");
  if (habits.length > 0) {
    sections.push(
      "## Study Habits & Skills\n" +
        habits.map((a) => `### ${a.title}\n${a.content}`).join("\n\n")
    );
  }

  // Motivation
  const motivation = loadArticlesFromDir("motivation");
  if (motivation.length > 0) {
    sections.push(
      "## Motivation & Mindset\n" +
        motivation.map((a) => `### ${a.title}\n${a.content}`).join("\n\n")
    );
  }

  // Career exploration
  const career = loadArticlesFromDir("career");
  const careerMd = career.filter((a) => a.slug.endsWith(".md") || !a.slug.endsWith(".json"));
  if (careerMd.length > 0) {
    sections.push(
      "## Career & College Exploration\n" +
        careerMd.map((a) => `### ${a.title}\n${a.content}`).join("\n\n")
    );
  }

  // Trim to avoid exceeding token limits — keep first ~8000 chars
  const full = sections.join("\n\n---\n\n");
  return full.length > 8000 ? full.slice(0, 8000) + "\n\n[... additional content available]" : full;
}

/**
 * Load the grade roadmap and parse milestones by pillar.
 */
export interface RoadmapMilestone {
  key: string;
  title: string;
  pillar: string;
  grade: number;
  semester?: string;
  priority: number; // 1 = must do, 2 = should do, 3 = nice to do
}

export function parseRoadmapMilestones(grade: number): RoadmapMilestone[] {
  const article = getGradeRoadmap(grade);
  if (!article) return [];

  const milestones: RoadmapMilestone[] = [];
  const pillars = ["Academics", "Extracurriculars", "Skills", "CollegePrep", "PersonalGrowth"];
  let currentPillar = "";
  let currentSemester = "";

  for (const rawLine of article.content.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    // Detect pillar headers (## 🎓 Academics, etc.)
    const pillarMatch = line.match(/^##\s+.*?(Academics|Extracurriculars|Skills|College.*(?:Prep|Exploration)|Personal.*Growth)/i);
    if (pillarMatch) {
      const matched = pillarMatch[1].toLowerCase();
      currentPillar =
        pillars.find((p) => matched.includes(p.toLowerCase())) ||
        (matched.includes("college") ? "CollegePrep" : 
         matched.includes("personal") ? "PersonalGrowth" : 
         matched.includes("skills") ? "Skills" : matched);
      continue;
    }

    // Detect semester headers
    const semesterMatch = line.match(/^###\s+(Fall|Spring|Summer)/i);
    if (semesterMatch) {
      currentSemester = semesterMatch[1];
      continue;
    }

    // Detect action items (bullet points or numbered lists)
    // The optional (?:\[ \]\s*)? handles old checkbox syntax but must NOT consume [P1]/[P2]/[P3] tags
    const itemMatch = line.match(/^[-*]\s+(?:\[ \]\s*)?(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (itemMatch && currentPillar) {
      let title = itemMatch[1].trim();
      // Extract priority tag [P1], [P2], [P3] — default to P2 if not tagged
      let priority = 2;
      const priorityMatch = title.match(/^\[P([123])\]\s*/);
      if (priorityMatch) {
        priority = parseInt(priorityMatch[1], 10);
        title = title.replace(/^\[P[123]\]\s*/, '');
      }
      const key = `g${grade}-${currentPillar.toLowerCase()}-${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40)}`;
      milestones.push({
        key,
        title,
        pillar: currentPillar,
        grade,
        semester: currentSemester || undefined,
        priority,
      });
    }
  }

  return milestones;
}
