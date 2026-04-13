import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/prompts';
import { buildKnowledgeContext, getGradeRoadmap, loadArticlesFromDir } from '@/lib/knowledge';
import { prisma } from '@/lib/db';

/**
 * Knowledge-based fallback when Azure OpenAI is not configured.
 * Searches the curated knowledge base and returns relevant snippets.
 */
function generateKnowledgeFallback(message: string, grade: number): string {
  const query = message.toLowerCase();
  const sections: string[] = [];

  // Load the grade roadmap
  const roadmap = getGradeRoadmap(grade);

  // Match topics to knowledge base articles
  const studyKeywords = ['study', 'schedule', 'homework', 'time management', 'organize', 'plan', 'habit'];
  const motivationKeywords = ['motivat', 'focus', 'distract', 'procrastinat', 'mindset', 'growth', 'stress', 'setback'];
  const collegeKeywords = ['college', 'university', 'admission', 'application', 'major', 'career'];
  const extracurricularKeywords = ['extracurricular', 'activit', 'club', 'sport', 'volunteer', 'community service'];
  const testKeywords = ['test', 'exam', 'quiz', 'sat', 'act', 'psat', 'grade', 'gpa'];
  const noteKeywords = ['note', 'cornell', 'note-taking', 'notes'];
  const readingKeywords = ['read', 'book', 'reading list'];
  const writingKeywords = ['writ', 'essay', 'paragraph'];

  // Study habits
  if (studyKeywords.some(k => query.includes(k))) {
    const articles = loadArticlesFromDir('study-habits');
    const timeArticle = articles.find(a => a.slug.includes('time-management'));
    const hwArticle = articles.find(a => a.slug.includes('homework'));
    if (timeArticle) sections.push(formatArticleResponse(timeArticle.title, timeArticle.content, grade));
    else if (hwArticle) sections.push(formatArticleResponse(hwArticle.title, hwArticle.content, grade));
    else if (articles.length > 0) sections.push(formatArticleResponse(articles[0].title, articles[0].content, grade));
  }

  // Note-taking
  if (noteKeywords.some(k => query.includes(k))) {
    const articles = loadArticlesFromDir('study-habits');
    const noteArticle = articles.find(a => a.slug.includes('note-taking'));
    if (noteArticle) sections.push(formatArticleResponse(noteArticle.title, noteArticle.content, grade));
  }

  // Reading
  if (readingKeywords.some(k => query.includes(k))) {
    const articles = loadArticlesFromDir('study-habits');
    const readArticle = articles.find(a => a.slug.includes('reading'));
    if (readArticle) sections.push(formatArticleResponse(readArticle.title, readArticle.content, grade));
  }

  // Writing
  if (writingKeywords.some(k => query.includes(k))) {
    const articles = loadArticlesFromDir('study-habits');
    const writeArticle = articles.find(a => a.slug.includes('writing'));
    if (writeArticle) sections.push(formatArticleResponse(writeArticle.title, writeArticle.content, grade));
  }

  // Test prep
  if (testKeywords.some(k => query.includes(k))) {
    const articles = loadArticlesFromDir('study-habits');
    const testArticle = articles.find(a => a.slug.includes('test-preparation'));
    if (testArticle) sections.push(formatArticleResponse(testArticle.title, testArticle.content, grade));
  }

  // Motivation
  if (motivationKeywords.some(k => query.includes(k))) {
    const articles = loadArticlesFromDir('motivation');
    if (articles.length > 0) {
      const best = articles.find(a =>
        query.includes('setback') ? a.slug.includes('setback') :
        query.includes('mindset') || query.includes('growth') ? a.slug.includes('mindset') :
        a.slug.includes('engaged')
      ) || articles[0];
      sections.push(formatArticleResponse(best.title, best.content, grade));
    }
  }

  // College / career
  if (collegeKeywords.some(k => query.includes(k))) {
    const admissions = loadArticlesFromDir('admissions');
    const career = loadArticlesFromDir('career');
    const relevant = [...admissions, ...career];
    if (relevant.length > 0) {
      const best = relevant.find(a => query.includes('type') ? a.slug.includes('types') : true) || relevant[0];
      sections.push(formatArticleResponse(best.title, best.content, grade));
    }
  }

  // Extracurriculars
  if (extracurricularKeywords.some(k => query.includes(k))) {
    if (roadmap) {
      const ecSection = extractPillarContent(roadmap.content, 'Extracurriculars');
      if (ecSection) sections.push(`**🏆 Extracurriculars for ${grade}th Grade:**\n\n${ecSection}`);
    }
  }

  // If nothing matched, pull from the roadmap overview
  if (sections.length === 0 && roadmap) {
    // Try to find relevant section in roadmap
    const content = roadmap.content.slice(0, 1500);
    sections.push(
      `Great question! Here's what your ${grade}th grade roadmap says about this:\n\n${content}\n\n` +
      `💡 **Tip:** Check out the Roadmap page for the full list of activities and milestones for your grade!`
    );
  }

  // Final fallback
  if (sections.length === 0) {
    return (
      `Great question! 🌟\n\n` +
      `I'm pulling from your ${grade}th grade College Coach knowledge base to help. ` +
      `Here are some things you can ask me about:\n\n` +
      `- **Study habits** — "How do I create a study schedule?"\n` +
      `- **Note-taking** — "What's the Cornell method?"\n` +
      `- **Test preparation** — "How do I prepare for tests?"\n` +
      `- **Motivation** — "How do I stay focused?"\n` +
      `- **Extracurriculars** — "What activities should I try?"\n` +
      `- **College exploration** — "What types of colleges are there?"\n\n` +
      `Also check out the **Roadmap** page for your grade-specific action items! 🗺️\n\n` +
      `_Note: For more personalized AI coaching, ask a parent to configure the Azure OpenAI connection._`
    );
  }

  return sections.join('\n\n---\n\n');
}

/** Extract content for a specific pillar from roadmap markdown */
function extractPillarContent(content: string, pillar: string): string | null {
  const lines = content.split('\n');
  let inSection = false;
  const result: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (line.match(new RegExp(`^##\\s+.*${pillar}`, 'i'))) {
      inSection = true;
      continue;
    }
    if (inSection && line.match(/^##\s+/)) break;
    if (inSection && line.trim()) result.push(line);
  }

  return result.length > 0 ? result.slice(0, 20).join('\n') : null;
}

/** Format a knowledge article into a friendly chat response */
function formatArticleResponse(title: string, content: string, grade: number): string {
  // Trim to a reasonable length for chat
  const trimmed = content.length > 1200 ? content.slice(0, 1200) + '\n\n_...see the full article for more details!_' : content;
  return (
    `Great question! Here's what I know about **${title}** for ${grade}th graders:\n\n` +
    trimmed +
    `\n\n💡 You can also check the **Roadmap** for related action items!`
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, grade, userId } = body as {
      message: string;
      grade: number;
      userId?: string;
    };

    if (!message || grade == null) {
      return NextResponse.json(
        { error: 'Missing required fields: message, grade' },
        { status: 400 }
      );
    }

    let aiResponse: string;

    const client = getOpenAIClient();
    if (client && isOpenAIConfigured()) {
      // Use Azure OpenAI
      const knowledgeContext = buildKnowledgeContext(grade);
      const systemPrompt = buildSystemPrompt(grade, knowledgeContext);

      const completion = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      });

      aiResponse = completion.choices[0]?.message?.content ?? '';
    } else {
      // Fallback: knowledge-based response from curated content
      aiResponse = generateKnowledgeFallback(message, grade);
    }

    if (userId) {
      await prisma.chatMessage.createMany({
        data: [
          { userId, role: 'user', content: message },
          { userId, role: 'assistant', content: aiResponse },
        ],
      });
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('[chat] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
