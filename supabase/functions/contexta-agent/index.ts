import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { HindsightClient } from 'https://esm.sh/@vectorize-io/hindsight-client@0.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AgentRequest {
  conversationId: string;
  customerId: string;
  message: string;
  memoryEnabled: boolean;
}

interface MemoryRecallResult {
  text: string;
  context?: string;
  score?: number;
  type?: string;
  tags?: string[];
}

interface MemoryRetainResult {
  text: string;
  tags: string[];
  context?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const hindsightApiKey = Deno.env.get('HINDSIGHT_API_KEY') ?? '';
const hindsightApiUrl = Deno.env.get('HINDSIGHT_BASE_URL') ?? 'https://api.hindsight.vectorize.io';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function getHindsightClient(): HindsightClient | null {
  if (!hindsightApiKey) return null;
  return new HindsightClient({
    apiKey: hindsightApiKey,
    apiUrl: hindsightApiUrl,
  });
}

function getBankId(customerId: string): string {
  return `customer-${customerId}`;
}

async function ensureBank(hindsight: HindsightClient, bankId: string): Promise<void> {
  try {
    await hindsight.createBank(bankId, {
      reflectMission: 'You are Contexta, an AI customer support agent with persistent memory. Use recalled memories to provide personalized, contextual support. Reference past issues, solutions, and customer environment when relevant. Be concise, warm, and helpful.',
      retainMission: 'Extract durable facts about the customer: their environment (OS, browser, device), recurring issues, solutions that worked, preferences, and account details. Avoid storing transient conversation details.',
    });
  } catch {
    // Bank already exists — that's fine
  }
}

async function recallMemories(
  hindsight: HindsightClient,
  customerId: string,
  query: string,
): Promise<MemoryRecallResult[]> {
  const bankId = getBankId(customerId);
  await ensureBank(hindsight, bankId);
  try {
    const response = await hindsight.recall(bankId, query, {
      maxTokens: 2000,
    });
    const results: MemoryRecallResult[] = [];
    if (response.results) {
      for (const r of response.results) {
        results.push({
          text: r.text ?? '',
          context: r.context,
          score: r.score,
          type: r.type,
          tags: r.tags,
        });
      }
    }
    return results;
  } catch (err) {
    console.error('Recall error:', err);
    return [];
  }
}

async function retainMemory(
  hindsight: HindsightClient,
  customerId: string,
  content: string,
  tags: string[],
  context?: string,
): Promise<MemoryRetainResult | null> {
  const bankId = getBankId(customerId);
  await ensureBank(hindsight, bankId);
  try {
    await hindsight.retain(bankId, content, {
      tags,
      context,
    });
    return { text: content, tags, context };
  } catch (err) {
    console.error('Retain error:', err);
    return null;
  }
}

async function logMemoryEvent(
  customerId: string,
  eventType: 'retain' | 'recall',
  content: string,
  tags: string[],
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from('memory_events').insert({
      customer_id: customerId,
      event_type: eventType,
      content,
      tags,
      metadata: metadata ?? null,
    });
  } catch (err) {
    console.error('Failed to log memory event:', err);
  }
}

async function getConversationContext(conversationId: string, customerId: string) {
  const [customerRes, messagesRes] = await Promise.all([
    supabase.from('customers').select('*').eq('id', customerId).single(),
    supabase.from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20),
  ]);

  const customer = customerRes.data;
  const messages = messagesRes.data ?? [];

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

  const ticketIds = (tickets ?? []).map((t) => t.id);
  let outcomes: Record<string, unknown>[] = [];
  if (ticketIds.length > 0) {
    const { data: outcomeData } = await supabase
      .from('outcomes')
      .select('*')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: false });
    outcomes = outcomeData ?? [];
  }

  return { customer, messages, tickets: tickets ?? [], outcomes };
}

function buildSystemPrompt(
  customer: Record<string, unknown> | null,
  recalledMemories: MemoryRecallResult[],
  conversationHistory: Record<string, unknown>[],
  tickets: Record<string, unknown>[],
  outcomes: Record<string, unknown>[],
  memoryEnabled: boolean,
): string {
  let prompt = `You are Contexta, an AI customer support agent. You help customers resolve issues with their software platform.\n\n`;
  prompt += `## Guidelines\n`;
  prompt += `- Be concise, warm, and professional\n`;
  prompt += `- If you know the customer's environment or past issues from memory, reference them directly\n`;
  prompt += `- Don't ask for information you already know from memory\n`;
  prompt += `- If the issue matches a previous resolved ticket, suggest the solution that worked last time\n`;
  prompt += `- When you don't have enough context, ask targeted questions\n`;
  prompt += `- Keep responses under 150 words unless the situation requires more detail\n\n`;

  if (customer) {
    prompt += `## Customer Profile\n`;
    prompt += `Name: ${customer.name}\n`;
    prompt += `Company: ${customer.company}\n`;
    prompt += `Product: ${customer.product}\n`;
    prompt += `Plan: ${customer.plan}\n\n`;
  }

  if (memoryEnabled && recalledMemories.length > 0) {
    prompt += `## Recalled Memories (from Hindsight)\n`;
    prompt += `These are facts remembered from previous conversations with this customer:\n`;
    recalledMemories.forEach((m, i) => {
      prompt += `${i + 1}. ${m.text}`;
      if (m.tags && m.tags.length > 0) {
        prompt += ` [tags: ${m.tags.join(', ')}]`;
      }
      prompt += `\n`;
    });
    prompt += `\nUse these memories to provide personalized support. Reference specific past issues, solutions, and environment details.\n\n`;
  } else if (!memoryEnabled) {
    prompt += `## Memory Status: DISABLED\n`;
    prompt += `You have no access to past memories. Treat this as a first interaction. Ask standard diagnostic questions.\n\n`;
  }

  if (tickets.length > 0) {
    prompt += `## Ticket History\n`;
    tickets.forEach((t, i) => {
      prompt += `${i + 1}. [${t.status}] ${t.title} (${t.category}, ${t.priority})\n`;
    });
    prompt += `\n`;
  }

  if (outcomes.length > 0) {
    prompt += `## Previous Resolutions\n`;
    outcomes.forEach((o, i) => {
      prompt += `${i + 1}. [${o.outcome}] ${o.solution_summary}\n`;
    });
    prompt += `\n`;
  }

  if (conversationHistory.length > 0) {
    prompt += `## Conversation So Far\n`;
    conversationHistory.forEach((m) => {
      prompt += `${m.role}: ${m.content}\n`;
    });
    prompt += `\n`;
  }

  return prompt;
}

async function callAnthropic(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('No text in Anthropic response');
  return text;
}

function extractDurableFacts(
  customerMessage: string,
  agentResponse: string,
  customerId: string,
): { text: string; tags: string[] } | null {
  const lower = customerMessage.toLowerCase();
  const facts: string[] = [];
  const tags: string[] = [];

  if (lower.includes('windows')) {
    facts.push('Customer uses Windows.');
    tags.push('environment:windows');
  }
  if (lower.includes('mac') || lower.includes('macbook')) {
    facts.push('Customer uses macOS.');
    tags.push('environment:mac');
  }
  if (lower.includes('chrome')) {
    facts.push('Customer uses Chrome browser.');
    tags.push('environment:chrome');
  }
  if (lower.includes('edge') || lower.includes('microsoft edge')) {
    facts.push('Customer uses Microsoft Edge browser.');
    tags.push('environment:edge');
  }
  if (lower.includes('firefox')) {
    facts.push('Customer uses Firefox browser.');
    tags.push('environment:firefox');
  }
  if (lower.includes('ios') || lower.includes('iphone')) {
    facts.push('Customer uses iOS.');
    tags.push('environment:ios');
  }
  if (lower.includes('android')) {
    facts.push('Customer uses Android.');
    tags.push('environment:android');
  }
  if (lower.includes('upload')) {
    facts.push(`Customer reported an upload issue: ${customerMessage.slice(0, 200)}`);
    tags.push('issue-type:upload');
  }
  if (lower.includes('login') || lower.includes('password')) {
    facts.push(`Customer reported a login issue: ${customerMessage.slice(0, 200)}`);
    tags.push('issue-type:login');
  }
  if (lower.includes('api') || lower.includes('rate limit') || lower.includes('429')) {
    facts.push(`Customer reported an API issue: ${customerMessage.slice(0, 200)}`);
    tags.push('issue-type:api');
  }
  if (lower.includes('payment') || lower.includes('stripe') || lower.includes('webhook')) {
    facts.push(`Customer reported a payment issue: ${customerMessage.slice(0, 200)}`);
    tags.push('issue-type:payment');
  }
  if (lower.includes('crash') || lower.includes('bug')) {
    facts.push(`Customer reported a crash/bug: ${customerMessage.slice(0, 200)}`);
    tags.push('issue-type:bug');
  }

  if (facts.length === 0) return null;

  return {
    text: facts.join(' '),
    tags: [...new Set(tags)],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.get('health')) {
      const hindsight = getHindsightClient();
      return new Response(JSON.stringify({
        status: 'ok',
        message: hindsight ? 'Agent online with memory' : 'Agent online (no Hindsight key)',
        memoryEnabled: !!hindsightApiKey,
        anthropicConfigured: !!anthropicApiKey,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: AgentRequest = await req.json();
    const { conversationId, customerId, message, memoryEnabled } = body;

    if (!conversationId || !customerId || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { customer, messages, tickets, outcomes } = await getConversationContext(conversationId, customerId);

    const hindsight = getHindsightClient();
    let recalledMemories: MemoryRecallResult[] = [];

    if (memoryEnabled && hindsight) {
      recalledMemories = await recallMemories(hindsight, customerId, message);
      if (recalledMemories.length > 0) {
        await logMemoryEvent(customerId, 'recall', `Recalled ${recalledMemories.length} memories for: "${message.slice(0, 100)}"`, [`query:${message.slice(0, 50)}`], {
          memory_count: recalledMemories.length,
          bank_id: getBankId(customerId),
        });
      }
    }

    const systemPrompt = buildSystemPrompt(customer, recalledMemories, messages, tickets, outcomes, memoryEnabled);
    const agentResponse = await callAnthropic(systemPrompt, message);

    let retainedMemories: MemoryRetainResult[] = [];
    if (memoryEnabled && hindsight) {
      const facts = extractDurableFacts(message, agentResponse, customerId);
      if (facts) {
        const retained = await retainMemory(hindsight, customerId, facts.text, facts.tags, `Conversation: ${message.slice(0, 100)}`);
        if (retained) {
          retainedMemories.push(retained);
          await logMemoryEvent(customerId, 'retain', facts.text, facts.tags, {
            bank_id: getBankId(customerId),
            conversation_id: conversationId,
          });
        }
      }
    }

    const { data: insertedMessage } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'agent',
      content: agentResponse,
      memory_recalled: recalledMemories.length > 0 ? recalledMemories : null,
      memory_retained: retainedMemories.length > 0 ? retainedMemories : null,
    }).select().single();

    return new Response(JSON.stringify({
      response: agentResponse,
      recalledMemories,
      memoryRetained: retainedMemories,
      messageId: insertedMessage?.id ?? '',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Agent error:', err);
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
