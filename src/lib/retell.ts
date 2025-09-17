import type { Lead } from '@types/lead';
import type { Company } from '@types/company';

interface StartRetellCallResult {
  callId: string;
  prompt: string;
}

export async function startRetellCall(lead: Lead, company?: Company | null): Promise<StartRetellCallResult> {
  const prompt = buildDiscoveryPrompt(lead, company ?? undefined);

  // TODO: Swap this mock with a real Retell SDK/API call once credentials are available.
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    callId: `mock-call-${Date.now()}`,
    prompt
  };
}

function buildDiscoveryPrompt(lead: Lead, company?: Company) {
  const sections = [
    `You are Sales Copilot Voice, an SDR conducting a warm discovery call.`,
    `Your goal is to qualify the prospect, understand their needs, and schedule a follow-up demo.`,
    '',
    `Lead details:
- Name: ${lead.fullName}
- Title: ${lead.title ?? 'Unknown'}
- Email: ${lead.email ?? 'Unknown'}
- Phone: ${lead.phone ?? 'Unknown'}
- LinkedIn: ${lead.linkedIn ?? 'Unknown'}
- Personal notes: ${lead.personalNotes ?? 'None'}
- AI insights: ${lead.aiInsights ?? 'None'}
- Recent news: ${formatNews(lead.newsFeed)}
- Messages: ${formatMessages(lead.messages)}`,
    company
      ? `
Company details:
- Name: ${company.name}
- Website: ${company.website ?? 'Unknown'}
- LinkedIn: ${company.linkedIn ?? 'Unknown'}
- Sector: ${company.sector ?? 'Unknown'}
- Sub-sector: ${company.subSector ?? 'Unknown'}
- Employees: ${company.employees ?? 'Unknown'}
- Funding stage: ${company.fundingStage ?? 'Unknown'}
- Investment info: ${formatInvestment(company.investmentInfo)}
- AI insights: ${company.aiInsights ?? 'None'}
- Recent news: ${formatNews(company.newsFeed)}
- Associated leads: ${company.associatedLeads?.join(', ') ?? 'None'}`
      : 'Company details: Unknown',
    '',
    `Call objectives:
1. Build rapport using the notes and AI insights.
2. Confirm current priorities and pain points.
3. Introduce Sales Copilot's value props tailored to their context.
4. Secure agreement on next steps (demo or follow-up meeting).`,
    '',
    `Ensure the tone stays consultative, concise, and outcome-driven.`
  ];

  return sections.join('\n');
}

function formatNews(news: unknown) {
  if (!news) return 'None';
  if (Array.isArray(news)) {
    return news
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const headline = 'headline' in item ? String(item.headline) : 'News item';
          const publishedAt = 'publishedAt' in item ? String(item.publishedAt) : undefined;
          return publishedAt ? `${headline} (published ${publishedAt})` : headline;
        }
        return 'News item';
      })
      .join('; ');
  }
  return String(news);
}

function formatMessages(messages: unknown) {
  if (!messages) return 'None';
  if (Array.isArray(messages)) {
    return messages
      .map((message) => {
        if (typeof message === 'string') return message;
        if (message && typeof message === 'object') {
          const channel = 'channel' in message ? String(message.channel) : 'channel';
          const summary = 'subject' in message ? String(message.subject) : 'notes' in message ? String((message as Record<string, unknown>).notes) : 'interaction';
          const timestamp =
            'sentAt' in message
              ? String(message.sentAt)
              : 'occurredAt' in message
              ? String((message as Record<string, unknown>).occurredAt)
              : undefined;
          return timestamp ? `${channel}: ${summary} (${timestamp})` : `${channel}: ${summary}`;
        }
        return 'Message';
      })
      .join('; ');
  }
  return String(messages);
}

function formatInvestment(investment: unknown) {
  if (!investment) return 'None';
  if (typeof investment === 'string') return investment;
  if (Array.isArray(investment)) {
    return investment.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ');
  }
  if (typeof investment === 'object') {
    return JSON.stringify(investment);
  }
  return String(investment);
}
