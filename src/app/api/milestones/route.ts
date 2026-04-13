import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseRoadmapMilestones } from '@/lib/knowledge';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const gradeParam = request.nextUrl.searchParams.get('grade');

    if (!userId || !gradeParam) {
      return NextResponse.json(
        { error: 'Missing required query params: userId, grade' },
        { status: 400 }
      );
    }

    const grade = parseInt(gradeParam, 10);
    if (isNaN(grade)) {
      return NextResponse.json(
        { error: 'grade must be a number' },
        { status: 400 }
      );
    }

    const availableMilestones = parseRoadmapMilestones(grade);

    const completedRecords = await prisma.milestoneProgress.findMany({
      where: { userId, grade },
    });

    const completionMap = new Map(
      completedRecords.map((r) => [r.milestoneKey, r])
    );

    const milestones = availableMilestones.map((m) => {
      const record = completionMap.get(m.key);
      return {
        ...m,
        isComplete: record?.isComplete ?? false,
        completedAt: record?.completedAt ?? null,
        id: record?.id ?? null,
      };
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error('[milestones] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, milestoneKey, grade, pillar, title } = body as {
      userId: string;
      milestoneKey: string;
      grade: number;
      pillar: string;
      title: string;
    };

    if (!userId || !milestoneKey || grade == null || !pillar || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, milestoneKey, grade, pillar, title' },
        { status: 400 }
      );
    }

    const existing = await prisma.milestoneProgress.findUnique({
      where: { userId_milestoneKey: { userId, milestoneKey } },
    });

    let milestone;
    if (existing) {
      const nowComplete = !existing.isComplete;
      milestone = await prisma.milestoneProgress.update({
        where: { id: existing.id },
        data: {
          isComplete: nowComplete,
          completedAt: nowComplete ? new Date() : null,
        },
      });
    } else {
      milestone = await prisma.milestoneProgress.create({
        data: {
          userId,
          milestoneKey,
          title,
          grade,
          pillar,
          isComplete: true,
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error('[milestones] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle milestone' },
      { status: 500 }
    );
  }
}
