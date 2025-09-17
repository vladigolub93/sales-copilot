import { NextResponse } from 'next/server';
import { getRetellClient } from '@lib/clients/retell';
import { RETELL_VOICE_PROMPT } from '@lib/prompts';

interface StartCallPayload {
  leadId: string;
  phoneNumber: string;
  goal?: string;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as StartCallPayload;

  try {
    const client = await getRetellClient();
    const response = await client.calls.create({
      assistant_id: process.env.RETELL_ASSISTANT_ID ?? '',
      customer_number: payload.phoneNumber,
      metadata: {
        leadId: payload.leadId,
        goal: payload.goal
      },
      prompt: `${RETELL_VOICE_PROMPT}\nGoal: ${payload.goal ?? 'Qualify the lead.'}`
    });

    return NextResponse.json({ callId: response.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to start Retell call. Check API keys and assistant configuration.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
