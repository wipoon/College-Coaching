import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  percentageToLetter,
  percentageToGpa,
  normalizeSubject,
  letterToPercentage,
} from '@/lib/grading-scale';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-student';

    const reportCards = await prisma.reportCard.findMany({
      where: { userId },
      include: { subjects: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reportCards);
  } catch (error) {
    console.error('Failed to fetch report cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report cards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = 'default-student',
      schoolYear,
      term,
      grade,
      subjects,
    } = body;

    if (!schoolYear || !term || grade == null || !Array.isArray(subjects)) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolYear, term, grade, subjects' },
        { status: 400 }
      );
    }

    const subjectRecords = subjects.map(
      (s: {
        subject: string;
        gradeType: string;
        rawGrade: string;
        includeInAnalysis?: boolean;
        notes?: string;
      }) => {
        const normalized = normalizeSubject(s.subject);
        let percentage: number | null = null;
        let letterGrade: string | null = null;

        if (s.gradeType === 'percentage') {
          percentage = parseFloat(s.rawGrade);
          letterGrade = percentageToLetter(percentage);
        } else if (s.gradeType === 'letter') {
          letterGrade = s.rawGrade;
          percentage = letterToPercentage(s.rawGrade);
        } else if (s.gradeType === 'pass_fail') {
          percentage = null;
          letterGrade =
            s.rawGrade.toLowerCase() === 'p' ||
            s.rawGrade.toLowerCase() === 'pass'
              ? 'P'
              : 'F';
        }

        return {
          subject: s.subject,
          normalizedSubject: normalized,
          gradeType: s.gradeType,
          rawGrade: s.rawGrade,
          percentage,
          letterGrade,
          includeInAnalysis: s.includeInAnalysis ?? true,
          notes: s.notes ?? null,
        };
      }
    );

    const reportCard = await prisma.reportCard.create({
      data: {
        userId,
        schoolYear,
        term,
        grade,
        subjects: { create: subjectRecords },
      },
      include: { subjects: true },
    });

    return NextResponse.json(reportCard, { status: 201 });
  } catch (error) {
    console.error('Failed to create report card:', error);
    return NextResponse.json(
      { error: 'Failed to create report card' },
      { status: 500 }
    );
  }
}
