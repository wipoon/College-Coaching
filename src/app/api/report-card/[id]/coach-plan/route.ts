import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeReportCard } from '@/lib/report-card-analysis';
import { generateCoachPlan } from '@/lib/coach-plan';
import type { SubjectInput } from '@/lib/report-card-analysis';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reportCard = await prisma.reportCard.findUnique({
      where: { id },
      include: { subjects: true },
    });

    if (!reportCard) {
      return NextResponse.json(
        { error: 'Report card not found' },
        { status: 404 }
      );
    }

    const subjectInputs: SubjectInput[] = reportCard.subjects
      .filter((s) => s.includeInAnalysis)
      .map((s) => ({
        subject: s.subject,
        normalizedSubject: s.normalizedSubject,
        gradeType: s.gradeType,
        rawGrade: s.rawGrade,
        percentage: s.percentage,
        letterGrade: s.letterGrade,
      }));

    const analysis = analyzeReportCard(subjectInputs);
    const plan = await generateCoachPlan(analysis, reportCard.grade);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Failed to generate coach plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate coach plan' },
      { status: 500 }
    );
  }
}
