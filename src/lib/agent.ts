import { EDGE_FUNCTION_URL } from './supabase';
import type { AgentResponse } from '@/types';

export async function sendAgentMessage(
  conversationId: string,
  customerId: string,
  message: string,
  memoryEnabled: boolean,
): Promise<AgentResponse> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      conversationId,
      customerId,
      message,
      memoryEnabled,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = 'Failed to get agent response';
    try {
      const parsed = JSON.parse(errorText);
      errorMsg = parsed.error || errorMsg;
    } catch {
      errorMsg = errorText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function getAgentVersion(): Promise<{ connected: boolean; message: string }> {
  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}?health=true`, {
      method: 'GET',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    });
    if (response.ok) {
      const data = await response.json();
      return { connected: true, message: data.message || 'Connected' };
    }
    return { connected: false, message: 'Agent offline' };
  } catch {
    return { connected: false, message: 'Agent offline' };
  }
}
