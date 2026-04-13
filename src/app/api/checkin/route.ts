import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOpenAIClient } from '@/lib/openai';
import { buildWeeklyCheckInPrompt } from '@/lib/prompts';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required query param: userId' },
        { status: 400 }
      );
    }

    const checkIns = await prisma.weeklyCheckIn.findMany({
      where: { userId },
      orderBy: { weekOf: 'desc' },
      take: 10,
    });

    return NextResponse.json(checkIns);
  } catch (error) {
    console.error('[checkin] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, wentWell, wasHard } = body as {
      userId: string;
      wentWell: string;
      wasHard: string;
    };

    if (!userId || !wentWell || !wasHard) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, wentWell, wasHard' },
        { status: 400 }
      );
    }

    // Look up the user's grade for the prompt
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { grade: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine the start of the current week (Monday)
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const weekOf = new Date(now);
    weekOf.setDate(now.getDate() - diff);
    weekOf.setHours(0, 0, 0, 0);

    const checkIn = await prisma.weeklyCheckIn.create({
      data: {
        userId,
        weekOf,
        wentWell,
        wasHard,
      },
    });

    // Generate AI summary asynchronously; don't fail the whole request if AI is unavailable
    const client = getOpenAIClient();
    if (client) {
      try {
        const prompt = buildWeeklyCheckInPrompt(user.grade, wentWell, wasHard);
        const completion = await client.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
        });

        const aiText = completion.choices[0]?.message?.content ?? '';

        // Parse AI response — expect two sections separated by a blank line or heading
        const sections = aiText.split(/\n{2,}|\n(?=##?\s)/);
        const aiSummary = sections[0]?.trim() || aiText;
        const nextWeekPlan = sections.slice(1).join('\n').trim() || null;

        const updated = await prisma.weeklyCheckIn.update({
          where: { id: checkIn.id },
          data: { aiSummary, nextWeekPlan },
        });

        return NextResponse.json(updated, { status: 201 });
      } catch (aiError) {
        console.error('[checkin] AI generation error:', aiError);
        // Return the check-in without AI summary
      }
    }

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    console.error('[checkin] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}
