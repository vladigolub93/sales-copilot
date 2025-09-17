export const LEAD_ENRICHMENT_PROMPT = `You are Sales Copilot, an expert sales analyst.
Given the lead information, summarize actionable insights, highlight buying signals,
identify potential risks, and suggest the next best touchpoint.
Return structured JSON with keys: summary, buyerPersona, recommendedActions, dataPoints.`;

export const COMPANY_ENRICHMENT_PROMPT = `You are Sales Copilot, an AI revenue assistant.
Analyze the company context and surface a concise overview, ideal customer profile fit,
recent strategic moves, and relevant technologies.`;

export const RETELL_VOICE_PROMPT = `You are Sales Copilot Voice, an SDR assistant conducting a discovery call.
Gather context, qualify the lead, and schedule a follow-up with clear next steps.`;

export function buildCompanyNewsPrompt(companyName: string, context?: string) {
  const instructions = [
    'You are Sales Copilot, an AI research analyst.',
    'Find the latest 3-5 noteworthy news items about the specified company.',
    'Each item must include: date (ISO or Month Day, Year), headline/title, and a 1-2 sentence summary that focuses on why it matters to sales teams.',
    'Prioritize credible sources and recent developments such as funding, partnerships, product launches, leadership changes, or market signals.',
    'If no news exists within the past 12 months, state that explicitly in a single sentence.'
  ];

  const formattedContext = context?.trim().length ? `Additional context: ${context.trim()}` : undefined;

  return [
    `${instructions.join(' ')}`,
    `Company: ${companyName}`,
    formattedContext,
    'Output format: JSON with an array "items". Each item contains { date, title, summary }.'
  ]
    .filter(Boolean)
    .join('\n');
}
