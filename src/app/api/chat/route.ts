import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/prompts';
import { buildKnowledgeContext } from '@/lib/knowledge';
import { prisma } from '@/lib/db';

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

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json(
        { error: 'OpenAI client not configured. Check environment variables.' },
        { status: 500 }
      );
    }

    const knowledgeContext = buildKnowledgeContext(grade);
    const systemPrompt = buildSystemPrompt(grade, knowledgeContext);

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content ?? '';

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
