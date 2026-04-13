import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  analyzeReportCard,
  detectTrends,
} from '@/lib/report-card-analysis';
import type { SubjectInput } from '@/lib/report-card-analysis';

export async function GET(
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

    // Look for a previous report card for trend detection
    const previousReportCard = await prisma.reportCard.findFirst({
      where: {
        userId: reportCard.userId,
        id: { not: reportCard.id },
        OR: [
          { grade: reportCard.grade },
          { grade: reportCard.grade - 1 },
        ],
      },
      include: { subjects: true },
      orderBy: { createdAt: 'desc' },
    });

    let trends = undefined;
    if (previousReportCard) {
      const previousInputs: SubjectInput[] = previousReportCard.subjects
        .filter((s) => s.includeInAnalysis)
        .map((s) => ({
          subject: s.subject,
          normalizedSubject: s.normalizedSubject,
          gradeType: s.gradeType,
          rawGrade: s.rawGrade,
          percentage: s.percentage,
          letterGrade: s.letterGrade,
        }));

      const previousAnalysis = analyzeReportCard(previousInputs);
      trends = detectTrends(
        analysis.subjects,
        previousAnalysis.subjects,
        previousReportCard.term
      );
    }

    return NextResponse.json({ analysis, trends });
  } catch (error) {
    console.error('Failed to analyze report card:', error);
    return NextResponse.json(
      { error: 'Failed to analyze report card' },
      { status: 500 }
    );
  }
}
